import { arrayUnion, collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

const BillingTracker = () => {
    const [usedItems, setUsedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        const q = query(collection(db, "stockItems"), where("status", "==", "used"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const items = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            setUsedItems(items);
            setLoading(false);
        }, (error) => {
            console.error("Faturalandırma verisi çekilirken hata: ", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleStatusUpdate = async (itemId, currentStatus, newStatus) => {
        if (!currentUser) return alert("İşlem yapmak için giriş yapmalısınız.");

        const statusOrder = ["Evrak Bekleniyor", "Evrak Teslim Edildi", "Faturalandırıldı", "Tamamlandı"];
        if (statusOrder.indexOf(newStatus) < statusOrder.indexOf(currentStatus)) {
            alert("İşlemde bir önceki adıma geri dönemezsiniz.");
            // Bu satırı siliyoruz çünkü sayfa yenilemek iyi bir kullanıcı deneyimi değil.
            // Select box zaten eski değerinde kalacaktır.
            return;
        }

        const itemRef = doc(db, "stockItems", itemId);
        const statusLogEntry = {
            status: newStatus,
            updatedBy: { id: currentUser.uid, name: currentUser.displayName || currentUser.email },
            updatedAt: new Date()
        };

        const updateData = {
            "billingInfo.status": newStatus,
            "billingInfo.statusLog": arrayUnion(statusLogEntry)
        };

        if (newStatus === "Evrak Teslim Edildi") updateData["billingInfo.paperworkSubmittedDate"] = new Date();
        if (newStatus === "Faturalandırıldı") updateData["billingInfo.invoiceDate"] = new Date();

        try {
            await updateDoc(itemRef, updateData);
        } catch (error) {
            console.error("Fatura durumu güncellenirken hata: ", error);
        }
    };

    const getDeadlineColor = (deadline) => {
        if (!deadline) return 'text-gray-500';
        const today = new Date();
        const deadlineDate = deadline.toDate();
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'text-red-600 font-bold';
        if (diffDays <= 1) return 'text-orange-500 font-semibold';
        return 'text-green-600';
    };

    if (loading) {
        return <div className="p-10 text-center">Yükleniyor...</div>;
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Faturalandırma Takibi</h2>
            <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-2 px-3 text-left">Kullanım Tarihi</th>
                            <th className="py-2 px-3 text-left">Ürün</th>
                            <th className="py-2 px-3 text-left">Hasta/Hastane</th>
                            <th className="py-2 px-3 text-left">Fatura Tipi</th>
                            <th className="py-2 px-3 text-left">İlişkili Bayi</th>
                            <th className="py-2 px-3 text-left">Fatura Durumu</th>
                            <th className="py-2 px-3 text-left">DMO Son Teslim</th>
                            <th className="py-2 px-3 text-center">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usedItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 border-b">
                                <td className="py-2 px-3">{item.usageInfo?.usageDate || 'N/A'}</td>
                                <td className="py-2 px-3 cursor-pointer hover:underline" onClick={() => navigate(`/stok-detay/${item.id}`)}>
                                    {item.productName} ({item.lot})
                                </td>
                                <td className="py-2 px-3">{item.usageInfo?.hospital} / {item.usageInfo?.patient}</td>
                                <td className="py-2 px-3">{item.billingInfo?.billingType || 'Belirtilmemiş'}</td>
                                <td className="py-2 px-3">{item.billingInfo?.isDealerInvolved ? item.billingInfo.involvedDealer?.name : 'Yok'}</td>
                                <td className="py-2 px-3 font-medium">{item.billingInfo?.status || 'N/A'}</td>
                                <td className={`py-2 px-3 ${getDeadlineColor(item.billingInfo?.submissionDeadline)}`}>
                                    {item.billingInfo?.submissionDeadline ? item.billingInfo.submissionDeadline.toDate().toLocaleDateString('tr-TR') : 'N/A'}
                                </td>
                                <td className="py-2 px-3 text-center">
                                    {item.billingInfo?.status === 'Tamamlandı' ? (
                                        <div className="flex items-center justify-center text-green-500">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            <span className="ml-2">Tamamlandı</span>
                                        </div>
                                    ) : (
                                        item.billingInfo ? (
                                            <select 
                                                onChange={(e) => handleStatusUpdate(item.id, item.billingInfo.status, e.target.value)} 
                                                value={item.billingInfo.status}
                                                className="p-1 border rounded text-sm"
                                            >
                                                <option value="Evrak Bekleniyor">Evrak Bekleniyor</option>
                                                <option value="Evrak Teslim Edildi">Evrak Teslim Edildi</option>
                                                <option value="Faturalandırıldı">Faturalandırıldı</option>
                                                <option value="Tamamlandı">Tamamlandı</option>
                                            </select>
                                        ) : <span className="text-xs text-gray-400">Eski Kayıt</span>
                                    )}
                                     <div className="group relative">
                                        <span className="text-xs text-blue-500 cursor-pointer">Geçmiş</span>
                                        <div className="absolute hidden group-hover:block bg-white border p-2 rounded shadow-lg z-10 w-64 right-0">
                                            {item.billingInfo?.statusLog?.slice().reverse().map((log, i) => (
                                                <p key={i} className="text-xs text-left">
                                                    <strong>{log.status}:</strong> {log.updatedBy.name} ({new Date(log.updatedAt.seconds * 1000).toLocaleString('tr-TR')})
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {usedItems.length === 0 && !loading && (
                    <p className="text-center p-5 text-gray-500">Faturalandırılacak ürün bulunmamaktadır.</p>
                )}
            </div>
        </div>
    );
};

export default BillingTracker;