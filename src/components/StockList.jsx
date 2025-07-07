import { arrayUnion, collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import UsageModal from './UsageModal';

const StockList = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    // === STATE'LER ===
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [filters, setFilters] = useState({ brand: '', productType: '', status: '', searchUbb: '', searchRef: '', searchLot: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });

    // === VERİ ÇEKME ===
    useEffect(() => {
        const q = query(collection(db, "stockItems"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const items = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            setStockItems(items);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // === FİLTRELEME VE SIRALAMA MANTIĞI ===
    
    const { brandOptions, productTypeOptions } = useMemo(() => {
        const brands = new Set();
        const types = {};
        stockItems.forEach(item => {
            const originalName = (item.originalProductName || item.productName);
            const parts = originalName.split(' ');
            if (parts.length > 0) {
                const brand = parts[0];
                brands.add(brand);
                const type = parts.slice(1).join(' ').replace(/\s*\d+mm.*$/, '').trim();
                if (type) {
                    if (!types[brand]) types[brand] = new Set();
                    types[brand].add(type);
                }
            }
        });
        return {
            brandOptions: [...brands].sort(),
            productTypeOptions: Object.keys(types).reduce((acc, brand) => {
                acc[brand] = [...types[brand]].sort();
                return acc;
            }, {})
        };
    }, [stockItems]);
    
    const sortedAndFilteredItems = useMemo(() => {
        let processableItems = [...stockItems];
        processableItems = processableItems.filter(item => {
            const originalName = (item.originalProductName || item.productName);
            const brandMatch = filters.brand ? originalName.startsWith(filters.brand) : true;
            const typeMatch = filters.productType ? originalName.includes(filters.productType) : true;
            const statusMatch = filters.status ? (filters.status === '_pending' ? item.status.includes('_pending') : item.status === filters.status) : true;
            const ubbMatch = filters.searchUbb ? item.ubb?.toLowerCase().includes(filters.searchUbb.toLowerCase()) : true;
            const refMatch = filters.searchRef ? item.ref?.toLowerCase().includes(filters.searchRef.toLowerCase()) : true;
            const lotMatch = filters.searchLot ? item.lot?.toLowerCase().includes(filters.searchLot.toLowerCase()) : true;
            return brandMatch && typeMatch && statusMatch && ubbMatch && refMatch && lotMatch;
        });

        if (sortConfig.key) {
            processableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return processableItems;
    }, [stockItems, filters, sortConfig]);

    const summaryCounts = useMemo(() => {
        const counts = { in_warehouse: 0, with_personnel: 0, pending: 0, used: 0, total: sortedAndFilteredItems.length };
        sortedAndFilteredItems.forEach(item => {
            if (item.status.includes('_pending')) {
                counts.pending++;
            } else if (counts.hasOwnProperty(item.status)) {
                counts[item.status]++;
            }
        });
        return counts;
    }, [sortedAndFilteredItems]);

    // === YARDIMCI VE İŞLEM FONKSİYONLARI ===

    const statusOptions = {
        'in_warehouse': 'Depoda', 'with_personnel': 'Personelde', '_pending': 'Onay Bekleyenler', 'used': 'Kullanıldı'
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        if (name === 'brand') {
            setFilters(prev => ({ ...prev, brand: value, productType: '' }));
        } else {
            setFilters(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSummaryClick = (statusKey) => {
        const currentStatusFilter = filters.status;
        const newStatus = currentStatusFilter === statusKey ? '' : statusKey;
        setFilters(prevFilters => ({
            ...prevFilters,
            status: newStatus
        }));
        const statusSelect = document.getElementById('status');
        if (statusSelect) {
            statusSelect.value = newStatus;
        }
    };
    
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return ' ↕';
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    const translateStatus = (status) => statusOptions[status] || (status.includes('_pending') ? 'Onay Bekliyor' : status);

    const handleAssignToPersonnel = async (itemId) => {
        if (!currentUser) return alert("İşlem için giriş yapmalısınız.");
        const itemRef = doc(db, "stockItems", itemId);
        const requestInfo = {
            requestedBy: { id: currentUser.uid, name: currentUser.displayName || currentUser.email },
            requestDate: new Date(),
            type: 'Zimmetleme Talebi'
        };
        try {
            await updateDoc(itemRef, { status: 'assignment_pending', pendingRequest: requestInfo });
            alert("Zimmetleme talebiniz depo sorumlusunun onayına gönderildi.");
        } catch (error) { console.error("Zimmetleme talebi sırasında hata: ", error); }
    };

    const handleReturnToWarehouse = async (itemId) => {
        if (!currentUser) return alert("İşlem için giriş yapmalısınız.");
        const itemRef = doc(db, "stockItems", itemId);
        const requestInfo = {
            requestedBy: { id: currentUser.uid, name: currentUser.displayName || currentUser.email },
            requestDate: new Date(),
            type: 'İade Talebi'
        };
        try {
            await updateDoc(itemRef, { status: 'return_pending', pendingRequest: requestInfo });
            alert("İade talebiniz depo sorumlusunun onayına gönderildi.");
        } catch (error) { console.error("İade talebi sırasında hata: ", error); }
    };

    const openUsageModal = (item) => {
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleMarkAsUsed = async (usageData) => {
        if (!currentItem) return;
        const itemRef = doc(db, "stockItems", currentItem.id);
        const usageDate = new Date(usageData.usageDate);
        const historyEntry = {
            timestamp: usageDate, action: `Kullanıldı - Hastane: ${usageData.hospital}`, user: currentItem.currentLocation.name
        };
        const newUsageInfo = {
            hospital: usageData.hospital, patient: usageData.patient, usageDate: usageData.usageDate, usedBy: currentItem.currentLocation,
        };
        const newBillingInfo = {
            billingType: usageData.billingType, isDealerInvolved: usageData.isDealerInvolved,
            involvedDealer: usageData.involvedDealer, invoiceRecipient: usageData.invoiceRecipient,
            status: 'Evrak Bekleniyor',
            statusLog: [{ status: 'Evrak Bekleniyor', updatedBy: { id: currentUser.uid, name: currentUser.displayName || currentUser.email }, updatedAt: new Date() }],
            notes: ''
        };
        if (usageData.billingType === 'DMO') {
            const deadline = new Date(usageDate);
            deadline.setDate(deadline.getDate() + 3);
            newBillingInfo.submissionDeadline = deadline;
        }
        try {
            await updateDoc(itemRef, {
                status: 'used', currentLocation: { type: 'used', name: `Kullanıldı - ${usageData.hospital}` },
                usageInfo: newUsageInfo, billingInfo: newBillingInfo, history: arrayUnion(historyEntry)
            });
            setIsModalOpen(false);
            setCurrentItem(null);
        } catch (error) { console.error("Kullanıldı olarak işaretlerken hata: ", error); }
    };

    if (loading) return <div className="text-center p-10">Stok verileri yükleniyor...</div>;

    // === JSX / RENDER KISMI ===
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-6 text-primary">Depodaki Mevcut Stoklar</h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                        <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Marka</label>
                        <select id="brand" name="brand" value={filters.brand} onChange={handleFilterChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md">
                            <option value="">Tüm Markalar</option>
                            {brandOptions.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="productType" className="block text-sm font-medium text-gray-700">Ürün Tipi</label>
                        <select id="productType" name="productType" value={filters.productType} onChange={handleFilterChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md" disabled={!filters.brand}>
                            <option value="">Tüm Tipler</option>
                            {filters.brand && productTypeOptions[filters.brand]?.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Durum</label>
                        <select id="status" name="status" value={filters.status} onChange={handleFilterChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md">
                            <option value="">Tüm Durumlar</option>
                            {Object.entries(statusOptions).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="searchUbb" className="block text-sm font-medium text-gray-700">UBB Ara</label>
                        <input type="text" id="searchUbb" name="searchUbb" value={filters.searchUbb} onChange={handleFilterChange} placeholder="UBB..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="searchRef" className="block text-sm font-medium text-gray-700">Ref Ara</label>
                        <input type="text" id="searchRef" name="searchRef" value={filters.searchRef} onChange={handleFilterChange} placeholder="Ref..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="searchLot" className="block text-sm font-medium text-gray-700">Lot Ara</label>
                        <input type="text" id="searchLot" name="searchLot" value={filters.searchLot} onChange={handleFilterChange} placeholder="Lot..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 items-center text-sm">
                    <span className="font-bold text-gray-700">Hızlı Filtre:</span>
                    <span className={`px-3 py-1 rounded-full font-semibold cursor-pointer hover:bg-blue-200 transition-all ${!filters.status ? 'bg-blue-200 ring-2 ring-blue-500' : 'bg-blue-100 text-blue-800'}`} onClick={() => handleSummaryClick('')}>Toplam: {summaryCounts.total}</span>
                    <span className={`px-3 py-1 rounded-full font-semibold cursor-pointer hover:bg-green-200 transition-all ${filters.status === 'in_warehouse' ? 'bg-green-200 ring-2 ring-green-500' : 'bg-green-100 text-green-800'}`} onClick={() => handleSummaryClick('in_warehouse')}>Depoda: {summaryCounts.in_warehouse}</span>
                    <span className={`px-3 py-1 rounded-full font-semibold cursor-pointer hover:bg-yellow-200 transition-all ${filters.status === 'with_personnel' ? 'bg-yellow-200 ring-2 ring-yellow-500' : 'bg-yellow-100 text-yellow-800'}`} onClick={() => handleSummaryClick('with_personnel')}>Personelde: {summaryCounts.with_personnel}</span>
                    <span className={`px-3 py-1 rounded-full font-semibold cursor-pointer hover:bg-orange-200 transition-all ${filters.status === '_pending' ? 'bg-orange-200 ring-2 ring-orange-500' : 'bg-orange-100 text-orange-800'}`} onClick={() => handleSummaryClick('_pending')}>Onay Bekliyor: {summaryCounts.pending}</span>
                    <span className={`px-3 py-1 rounded-full font-semibold cursor-pointer hover:bg-red-200 transition-all ${filters.status === 'used' ? 'bg-red-200 ring-2 ring-red-500' : 'bg-red-100 text-red-800'}`} onClick={() => handleSummaryClick('used')}>Kullanıldı: {summaryCounts.used}</span>
                </div>
            </div>

            <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="py-3 px-4 text-left cursor-pointer hover:bg-gray-700" onClick={() => requestSort('productName')}>Ürün Adı{getSortIndicator('productName')}</th>
                            <th className="py-3 px-4 text-left cursor-pointer hover:bg-gray-700" onClick={() => requestSort('lot')}>Lot{getSortIndicator('lot')}</th>
                            <th className="py-3 px-4 text-left cursor-pointer hover:bg-gray-700" onClick={() => requestSort('skt')}>SKT{getSortIndicator('skt')}</th>
                            <th className="py-3 px-4 text-left cursor-pointer hover:bg-gray-700" onClick={() => requestSort('status')}>Durum{getSortIndicator('status')}</th>
                            <th className="py-3 px-4 text-left">Mevcut Konum</th>
                            <th className="py-3 px-4 text-center">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {sortedAndFilteredItems.map(item => (
                            <tr key={item.id} className="border-b hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate(`/stok-detay/${item.id}`)}>
                                <td className="py-3 px-4 font-bold">{item.productName}</td>
                                <td className="py-3 px-4">{item.lot}</td>
                                <td className="py-3 px-4">{item.skt || 'N/A'}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        item.status === 'in_warehouse' ? 'bg-green-200 text-green-800' :
                                        item.status === 'with_personnel' ? 'bg-yellow-200 text-yellow-800' :
                                        item.status === 'used' ? 'bg-red-200 text-red-800' :
                                        item.status.includes('_pending') ? 'bg-orange-200 text-orange-800' : ''
                                    }`}>{translateStatus(item.status)}</span>
                                </td>
                                <td className="py-3 px-4">{item.currentLocation.name}</td>
                                <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-center space-x-2">
                                        {item.status === 'in_warehouse' && <button onClick={() => handleAssignToPersonnel(item.id)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm">Zimmetle</button>}
                                        {item.status === 'assignment_pending' && <span className="text-xs text-gray-500">Onay Bekliyor</span>}
                                        {item.status === 'with_personnel' && (<>
                                            <button onClick={() => handleReturnToWarehouse(item.id)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm">İade Et</button>
                                            <button onClick={() => openUsageModal(item)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm">Kullanıldı</button>
                                        </>)}
                                        {item.status === 'return_pending' && <span className="text-xs text-gray-500">İade Onayı Bekliyor</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {sortedAndFilteredItems.length === 0 && !loading && (
                    <p className="text-center p-5 text-gray-500">Bu kriterlere uygun ürün bulunamadı.</p>
                )}
            </div>
            <UsageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleMarkAsUsed} item={currentItem}/>
        </div>
    );
};

export default StockList;