import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    onSnapshot,
    addDoc,
    updateDoc,
    query,
    where,
    writeBatch,
    Timestamp,
    getDocs
} from 'firebase/firestore';
import { LucidePackage, LucideUsers, LucideTruck, LucidePlus, LucideClipboardList, LucideCheckCircle, LucideXCircle, LucideHistory, LucideScanLine, LucideLogOut, LucideWarehouse, LucideUserCheck, LucideBuilding, LucidePill } from 'lucide-react';

// --- Firebase Konfigürasyonu ---
// Gerçek konfigürasyon bilgileri buraya eklenmelidir.
// Canvas ortamı bu bilgileri otomatik olarak sağlayacaktır.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBIDYRO3h7in5W3oU9FB_qy1G1Yg497rTY",
  authDomain: "endomed-grup-medikal.firebaseapp.com",
  projectId: "endomed-grup-medikal",
  storageBucket: "endomed-grup-medikal.firebasestorage.app",
  messagingSenderId: "853679288088",
  appId: "1:853679288088:web:dbdb378450847e30c0f86d",
  measurementId: "G-7GS2YPMYNF"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- YARDIMCI BİLEŞENLER ---

const Spinner = () => (
    <div className="flex justify-center items-center h-full w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                 <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
        <div className={`rounded-full p-3 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);


// --- KULLANICI GİRİŞ (AUTH) BİLEŞENİ ---

const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('personnel');
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isRegister) {
                if (!name || !role) {
                    setError('İsim ve rol alanları zorunludur.');
                    setLoading(false);
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                // Kullanıcı rolünü ve adını Firestore'a kaydet
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: user.email,
                    name: name,
                    role: role, // 'admin', 'personnel', 'dealer'
                });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            console.error("Auth error:", err);
            const friendlyMessage = err.code === 'auth/user-not-found' ? 'Kullanıcı bulunamadı.' :
                                  err.code === 'auth/wrong-password' ? 'Hatalı şifre.' :
                                  err.code === 'auth/email-already-in-use' ? 'Bu e-posta adresi zaten kullanımda.' :
                                  'Bir hata oluştu. Lütfen tekrar deneyin.';
            setError(friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full mx-auto bg-white shadow-xl rounded-2xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-600">EMOTS</h1>
                    <p className="text-gray-500 mt-1">Stok ve Operasyon Sistemi</p>
                </div>
                
                <form onSubmit={handleAuthAction}>
                    {isRegister && (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">İsim Soyisim</label>
                                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                             <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">Rol</label>
                                <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                                    <option value="personnel">Personel</option>
                                    <option value="dealer">Bayi</option>
                                    <option value="admin">Yönetici</option>
                                </select>
                            </div>
                        </>
                    )}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">E-posta</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Şifre</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-blue-300">
                        {loading ? <Spinner /> : (isRegister ? 'Kayıt Ol' : 'Giriş Yap')}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    {isRegister ? 'Zaten bir hesabınız var mı?' : 'Hesabınız yok mu?'}
                    <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="font-medium text-blue-600 hover:underline ml-1">
                        {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
                    </button>
                </p>
            </div>
        </div>
    );
};

// --- YÖNETİCİ PANELİ (ADMIN DASHBOARD) ---

const AdminDashboard = ({ userData, handleLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [inventory, setInventory] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [newProduct, setNewProduct] = useState({ brand: '', name: '', category: '' });
    const [newInventoryItem, setNewInventoryItem] = useState({ 
        productId: '', ubb: '', refNo: '', lotNo: '', expirationDate: '', quantity: 1 
    });
    
    useEffect(() => {
        const unsubInventory = onSnapshot(collection(db, "inventory"), (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInventory(items);
            setLoading(false);
        });

        const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(items);
        });

        const unsubOrders = onSnapshot(query(collection(db, "orders"), where("status", "==", "Beklemede")), (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(items);
        });
        
        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(items);
        });

        return () => {
            unsubInventory();
            unsubProducts();
            unsubOrders();
            unsubUsers();
        };
    }, []);

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.brand || !newProduct.name) return;
        await addDoc(collection(db, "products"), newProduct);
        setNewProduct({ brand: '', name: '', category: '' });
        setIsProductModalOpen(false);
    };
    
    const handleAddInventory = async (e) => {
        e.preventDefault();
        if (!newInventoryItem.productId || !newInventoryItem.ubb || !newInventoryItem.lotNo || !newInventoryItem.expirationDate) return;
        
        const selectedProduct = products.find(p => p.id === newInventoryItem.productId);
        if (!selectedProduct) return;

        const batch = writeBatch(db);
        for (let i = 0; i < newInventoryItem.quantity; i++) {
            const newDocRef = doc(collection(db, "inventory"));
            batch.set(newDocRef, {
                productId: newInventoryItem.productId,
                productInfo: {
                    brand: selectedProduct.brand,
                    name: selectedProduct.name,
                    category: selectedProduct.category
                },
                ubb: newInventoryItem.ubb,
                refNo: newInventoryItem.refNo,
                lotNo: newInventoryItem.lotNo,
                expirationDate: Timestamp.fromDate(new Date(newInventoryItem.expirationDate)),
                status: 'Depoda',
                location: { type: 'Depo', name: 'Ana Depo' },
                movementHistory: [{
                    date: Timestamp.now(),
                    action: 'Depoya Giriş',
                    by: userData.name
                }]
            });
        }
        await batch.commit();

        setNewInventoryItem({ productId: '', ubb: '', refNo: '', lotNo: '', expirationDate: '', quantity: 1 });
        setIsInventoryModalOpen(false);
    };

    const handleApproveOrder = async (orderId) => {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status: "Onaylandı", processedAt: Timestamp.now() });
    };

    const handleRejectOrder = async () => {
        if (!selectedOrder || !rejectionReason) return;
        const orderRef = doc(db, "orders", selectedOrder.id);
        await updateDoc(orderRef, {
            status: "Reddedildi",
            rejectionReason: rejectionReason,
            processedAt: Timestamp.now()
        });
        setIsRejectModalOpen(false);
        setSelectedOrder(null);
        setRejectionReason('');
    };
    
    const openRejectModal = (order) => {
        setSelectedOrder(order);
        setIsRejectModalOpen(true);
    };

    const stats = useMemo(() => ({
        totalItems: inventory.length,
        inStock: inventory.filter(i => i.status === 'Depoda').length,
        onField: inventory.filter(i => i.status === 'Personelde').length,
        pendingOrders: orders.length
    }), [inventory, orders]);

    const renderDashboard = () => (
        <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Genel Durum</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<LucidePackage className="h-8 w-8 text-blue-500" />} title="Toplam Malzeme" value={stats.totalItems} color="bg-blue-100" />
                <StatCard icon={<LucideWarehouse className="h-8 w-8 text-green-500" />} title="Depodaki Malzemeler" value={stats.inStock} color="bg-green-100" />
                <StatCard icon={<LucideUserCheck className="h-8 w-8 text-yellow-500" />} title="Personeldeki Malzemeler" value={stats.onField} color="bg-yellow-100" />
                <StatCard icon={<LucideClipboardList className="h-8 w-8 text-orange-500" />} title="Bekleyen Sipariş" value={stats.pendingOrders} color="bg-orange-100" />
            </div>
            <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-4">Onay Bekleyen Siparişler</h3>
                {orders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Bayi</th>
                                    <th scope="col" className="px-6 py-3">Sipariş Tarihi</th>
                                    <th scope="col" className="px-6 py-3">İstenen Ürünler</th>
                                    <th scope="col" className="px-6 py-3">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{users.find(u => u.uid === order.dealerId)?.name || 'Bilinmeyen Bayi'}</td>
                                        <td className="px-6 py-4">{order.createdAt.toDate().toLocaleDateString('tr-TR')}</td>
                                        <td className="px-6 py-4">
                                            <ul className="list-disc list-inside">
                                              {order.items.map((item, idx) => <li key={idx}>{item.name} ({item.quantity} adet)</li>)}
                                            </ul>
                                        </td>
                                        <td className="px-6 py-4 flex space-x-2">
                                            <button onClick={() => handleApproveOrder(order.id)} className="font-medium text-green-600 hover:underline">Onayla</button>
                                            <button onClick={() => openRejectModal(order)} className="font-medium text-red-600 hover:underline">Reddet</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-gray-500">Onay bekleyen sipariş bulunmamaktadır.</p>}
            </div>
        </div>
    );
    
    const renderInventory = () => (
         <div className="p-6">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Stok Yönetimi</h2>
                <button onClick={() => setIsInventoryModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
                    <LucidePlus size={20}/>
                    <span>Yeni Stok Girişi</span>
                </button>
            </div>
             <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Ürün Adı</th>
                                <th scope="col" className="px-6 py-3">Lot No</th>
                                <th scope="col" className="px-6 py-3">SKT</th>
                                <th scope="col" className="px-6 py-3">Durum</th>
                                <th scope="col" className="px-6 py-3">Konum</th>
                                <th scope="col" className="px-6 py-3">UBB</th>
                            </tr>
                        </thead>
                        <tbody>
                             {inventory.map(item => (
                                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.productInfo.name}</td>
                                    <td className="px-6 py-4">{item.lotNo}</td>
                                    <td className="px-6 py-4">{item.expirationDate.toDate().toLocaleDateString('tr-TR')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${item.status === 'Depoda' ? 'bg-green-100 text-green-800' :
                                              item.status === 'Personelde' ? 'bg-yellow-100 text-yellow-800' :
                                              item.status === 'Kullanıldı' ? 'bg-gray-100 text-gray-800' :
                                              'bg-red-100 text-red-800'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{item.location.name}</td>
                                    <td className="px-6 py-4">{item.ubb}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
         </div>
    );

    const renderProducts = () => (
         <div className="p-6">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Ürün Tanımları</h2>
                <button onClick={() => setIsProductModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
                    <LucidePlus size={20}/>
                    <span>Yeni Ürün Tanımla</span>
                </button>
            </div>
             <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Marka</th>
                                <th scope="col" className="px-6 py-3">Ürün Adı</th>
                                <th scope="col" className="px-6 py-3">Kategori</th>
                            </tr>
                        </thead>
                        <tbody>
                             {products.map(product => (
                                <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{product.brand}</td>
                                    <td className="px-6 py-4">{product.name}</td>
                                    <td className="px-6 py-4">{product.category}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
         </div>
    );
    
    if (loading) return <div className="flex h-screen w-screen justify-center items-center"><Spinner /></div>;

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex-shrink-0 flex flex-col">
                <div className="h-16 flex items-center justify-center border-b">
                    <h1 className="text-2xl font-bold text-blue-600">EMOTS</h1>
                </div>
                <nav className="flex-grow p-4">
                    <ul>
                        <li><a href="#" onClick={() => setActiveTab('dashboard')} className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}><LucidePackage size={20}/><span>Genel Durum</span></a></li>
                        <li><a href="#" onClick={() => setActiveTab('inventory')} className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${activeTab === 'inventory' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}><LucideWarehouse size={20}/><span>Stok Yönetimi</span></a></li>
                        <li><a href="#" onClick={() => setActiveTab('products')} className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${activeTab === 'products' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}><LucidePill size={20}/><span>Ürün Tanımları</span></a></li>
                    </ul>
                </nav>
                <div className="p-4 border-t">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                        <LucideLogOut size={20}/><span>Çıkış Yap</span>
                    </button>
                </div>
            </aside>
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Yönetici Paneli</h2>
                        <div className="text-right">
                           <p className="font-semibold">{userData.name}</p>
                           <p className="text-sm text-gray-500">{userData.email}</p>
                        </div>
                    </div>
                </header>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'inventory' && renderInventory()}
                {activeTab === 'products' && renderProducts()}
            </main>
            
            {/* Modals */}
             <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Yeni Ürün Tanımla">
                <form onSubmit={handleAddProduct}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marka</label>
                        <input type="text" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
                        <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <input type="text" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Kaydet</button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isInventoryModalOpen} onClose={() => setIsInventoryModalOpen(false)} title="Yeni Stok Girişi">
                <form onSubmit={handleAddInventory}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ürün</label>
                        <select value={newInventoryItem.productId} onChange={e => setNewInventoryItem({...newInventoryItem, productId: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                            <option value="">Ürün Seçin</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.brand} - {p.name}</option>)}
                        </select>
                    </div>
                     <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">UBB (Barkod)</label>
                        <input type="text" value={newInventoryItem.ubb} onChange={e => setNewInventoryItem({...newInventoryItem, ubb: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                     <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ref No</label>
                        <input type="text" value={newInventoryItem.refNo} onChange={e => setNewInventoryItem({...newInventoryItem, refNo: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lot No</label>
                        <input type="text" value={newInventoryItem.lotNo} onChange={e => setNewInventoryItem({...newInventoryItem, lotNo: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                     <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Son Kullanma Tarihi</label>
                        <input type="date" value={newInventoryItem.expirationDate} onChange={e => setNewInventoryItem({...newInventoryItem, expirationDate: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                     <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adet</label>
                        <input type="number" min="1" value={newInventoryItem.quantity} onChange={e => setNewInventoryItem({...newInventoryItem, quantity: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Stoğa Ekle</button>
                    </div>
                </form>
            </Modal>

             <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Siparişi Reddet">
                 <div>
                    <p className="mb-4">Lütfen siparişi reddetme nedenini belirtin.</p>
                     <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="3" required></textarea>
                    <div className="flex justify-end pt-4">
                        <button onClick={handleRejectOrder} className="bg-red-600 text-white px-4 py-2 rounded-lg">Reddet</button>
                    </div>
                 </div>
            </Modal>
        </div>
    );
};

// --- PERSONEL PANELİ (PERSONNEL DASHBOARD) ---

const PersonnelDashboard = ({ userData, handleLogout }) => {
    const [myInventory, setMyInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scannedUbb, setScannedUbb] = useState('');
    const [scanMessage, setScanMessage] = useState({ type: '', text: '' });
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [usageInfo, setUsageInfo] = useState({ hospitalName: '', patientIdentifier: '', operationDate: '' });

    useEffect(() => {
        const q = query(collection(db, "inventory"), where("location.id", "==", userData.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMyInventory(items);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userData.uid]);

    const handleScan = async () => {
        if (!scannedUbb) return;
        setScanMessage({ type: '', text: '' });

        const q = query(collection(db, "inventory"), where("ubb", "==", scannedUbb));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setScanMessage({ type: 'error', text: 'Bu barkoda sahip ürün bulunamadı.' });
            return;
        }

        const itemDoc = querySnapshot.docs[0];
        const item = { id: itemDoc.id, ...itemDoc.data() };

        if (item.status === 'Depoda') {
            await updateDoc(doc(db, "inventory", item.id), {
                status: 'Personelde',
                location: {
                    type: 'Personel',
                    id: userData.uid,
                    name: userData.name
                },
                movementHistory: [...item.movementHistory, {
                    date: Timestamp.now(),
                    action: 'Personele Zimmet',
                    by: userData.name,
                    location: userData.name
                }]
            });
            setScanMessage({ type: 'success', text: `Ürün "${item.productInfo.name}" başarıyla zimmetinize alındı.` });
            setScannedUbb('');
        } else {
            setScanMessage({ type: 'error', text: `Bu ürün zaten ${item.location.name} konumunda (${item.status}).` });
        }
    };
    
    const openUsageModal = (item) => {
        setSelectedItem(item);
        setIsUsageModalOpen(true);
    };

    const handleMarkAsUsed = async (e) => {
        e.preventDefault();
        if (!selectedItem || !usageInfo.hospitalName || !usageInfo.patientIdentifier || !usageInfo.operationDate) return;
        
        await updateDoc(doc(db, "inventory", selectedItem.id), {
            status: 'Kullanıldı',
            location: {
                type: 'Hastane',
                name: usageInfo.hospitalName
            },
            movementHistory: [...selectedItem.movementHistory, {
                date: Timestamp.now(),
                action: 'Kullanıldı',
                by: userData.name,
                location: usageInfo.hospitalName
            }],
            usageLog: {
                ...usageInfo,
                operationDate: Timestamp.fromDate(new Date(usageInfo.operationDate)),
                personnelName: userData.name,
                personnelId: userData.uid
            }
        });
        
        setIsUsageModalOpen(false);
        setSelectedItem(null);
        setUsageInfo({ hospitalName: '', patientIdentifier: '', operationDate: '' });
    };

    if (loading) return <div className="flex h-screen w-screen justify-center items-center"><Spinner /></div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-blue-600">Personel Paneli</h1>
                    <p className="text-gray-500">{userData.name}</p>
                </div>
                <button onClick={handleLogout} className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                    <LucideLogOut size={20}/><span>Çıkış Yap</span>
                </button>
            </header>
            <main className="p-6">
                <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">Barkod ile Malzeme Al</h2>
                    <div className="flex space-x-2">
                        <input 
                            type="text" 
                            value={scannedUbb} 
                            onChange={e => setScannedUbb(e.target.value)}
                            placeholder="Ürün barkodunu (UBB) okutun veya girin" 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button onClick={handleScan} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
                           <LucideScanLine size={20}/> <span>Tara ve Al</span>
                        </button>
                    </div>
                    {scanMessage.text && (
                        <p className={`mt-2 text-sm ${scanMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {scanMessage.text}
                        </p>
                    )}
                </div>
                
                <h2 className="text-2xl font-semibold mb-4">Zimmetimdeki Malzemeler ({myInventory.length})</h2>
                {myInventory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myInventory.map(item => (
                            <div key={item.id} className="bg-white p-5 rounded-xl shadow-md flex flex-col justify-between">
                               <div>
                                   <h3 className="font-bold text-lg text-gray-800">{item.productInfo.name}</h3>
                                   <p className="text-sm text-gray-500">{item.productInfo.brand}</p>
                                   <div className="mt-4 space-y-2 text-sm">
                                       <p><span className="font-semibold">Lot No:</span> {item.lotNo}</p>
                                       <p><span className="font-semibold">SKT:</span> {item.expirationDate.toDate().toLocaleDateString('tr-TR')}</p>
                                       <p><span className="font-semibold">UBB:</span> {item.ubb}</p>
                                   </div>
                               </div>
                               <div className="mt-4 pt-4 border-t">
                                   <button onClick={() => openUsageModal(item)} className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300">
                                       Kullanıldı Olarak İşaretle
                                   </button>
                               </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-gray-500 bg-white p-6 rounded-xl shadow-md">Zimmetinizde malzeme bulunmamaktadır.</p>}
            </main>
            <Modal isOpen={isUsageModalOpen} onClose={() => setIsUsageModalOpen(false)} title="Kullanım Kaydı Oluştur">
                <form onSubmit={handleMarkAsUsed}>
                    <p className="mb-4">Kullanılan ürün: <span className="font-semibold">{selectedItem?.productInfo.name}</span></p>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hastane Adı</label>
                        <input type="text" value={usageInfo.hospitalName} onChange={e => setUsageInfo({...usageInfo, hospitalName: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hasta No / Adı</label>
                        <input type="text" value={usageInfo.patientIdentifier} onChange={e => setUsageInfo({...usageInfo, patientIdentifier: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Operasyon Tarihi</label>
                        <input type="date" value={usageInfo.operationDate} onChange={e => setUsageInfo({...usageInfo, operationDate: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Kaydı Tamamla</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

// --- BAYİ PANELİ (DEALER DASHBOARD) ---

const DealerDashboard = ({ userData, handleLogout }) => {
    const [myOrders, setMyOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [newOrderItems, setNewOrderItems] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "orders"), where("dealerId", "==", userData.uid));
        const unsubOrders = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMyOrders(items.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
            setLoading(false);
        });
        
        const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(items);
        });

        return () => {
            unsubOrders();
            unsubProducts();
        };
    }, [userData.uid]);

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        const itemsToOrder = newOrderItems.filter(item => item.quantity > 0);
        if (itemsToOrder.length === 0) return;

        await addDoc(collection(db, "orders"), {
            dealerId: userData.uid,
            dealerName: userData.name,
            items: itemsToOrder.map(item => ({ productId: item.id, name: item.name, quantity: item.quantity })),
            status: 'Beklemede',
            createdAt: Timestamp.now()
        });

        setIsOrderModalOpen(false);
        setNewOrderItems([]);
    };

    const handleItemQuantityChange = (productId, quantity) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setNewOrderItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === productId);
            if (existingItem) {
                return prevItems.map(item => item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item);
            }
            return [...prevItems, { id: productId, name: `${product.brand} - ${product.name}`, quantity: Math.max(0, quantity) }];
        });
    };
    
    if (loading) return <div className="flex h-screen w-screen justify-center items-center"><Spinner /></div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-blue-600">Bayi Portalı</h1>
                    <p className="text-gray-500">{userData.name}</p>
                </div>
                <button onClick={handleLogout} className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                    <LucideLogOut size={20}/><span>Çıkış Yap</span>
                </button>
            </header>
            <main className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Siparişlerim</h2>
                    <button onClick={() => setIsOrderModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
                        <LucidePlus size={20}/>
                        <span>Yeni Sipariş Oluştur</span>
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Sipariş Tarihi</th>
                                    <th scope="col" className="px-6 py-3">İstenen Ürünler</th>
                                    <th scope="col" className="px-6 py-3">Durum</th>
                                    <th scope="col" className="px-6 py-3">Açıklama</th>
                                </tr>
                            </thead>
                            <tbody>
                                 {myOrders.map(order => (
                                    <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">{order.createdAt.toDate().toLocaleDateString('tr-TR')}</td>
                                        <td className="px-6 py-4">
                                            <ul className="list-disc list-inside">
                                              {order.items.map((item, idx) => <li key={idx}>{item.name} ({item.quantity} adet)</li>)}
                                            </ul>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${order.status === 'Onaylandı' ? 'bg-green-100 text-green-800' :
                                                  order.status === 'Beklemede' ? 'bg-yellow-100 text-yellow-800' :
                                                  'bg-red-100 text-red-800'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">{order.status === 'Reddedildi' ? order.rejectionReason : ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
            <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Yeni Sipariş Oluştur">
                <form onSubmit={handleCreateOrder}>
                    <p className="mb-4 text-sm text-gray-600">Sipariş vermek istediğiniz ürünlerin adetlerini girin.</p>
                    <div className="space-y-4">
                        {products.map(product => (
                            <div key={product.id} className="grid grid-cols-3 gap-4 items-center">
                                <span className="col-span-2">{product.brand} - {product.name}</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    placeholder="Adet"
                                    className="w-full px-3 py-1 border border-gray-300 rounded-lg"
                                    onChange={(e) => handleItemQuantityChange(product.id, parseInt(e.target.value, 10))}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end pt-6 mt-4 border-t">
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg">Siparişi Gönder</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

// --- ANA UYGULAMA (APP) BİLEŞENİ ---

export default function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Firestore'dan kullanıcı rolünü al
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
                setUser(user);
            } else {
                setUser(null);
                setUserData(null);
            }
            setAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
    };

    if (!authReady) {
        return <div className="flex h-screen w-screen justify-center items-center"><Spinner /></div>;
    }
    
    if (!user) {
        return <AuthScreen />;
    }
    
    // Role göre doğru paneli render et
    switch (userData?.role) {
        case 'admin':
            return <AdminDashboard userData={userData} handleLogout={handleLogout} />;
        case 'personnel':
            return <PersonnelDashboard userData={userData} handleLogout={handleLogout} />;
        case 'dealer':
            return <DealerDashboard userData={userData} handleLogout={handleLogout} />;
        default:
            return <div className="p-4">
                <p>Kullanıcı rolü bulunamadı veya geçersiz. Lütfen çıkış yapıp tekrar deneyin.</p>
                <button onClick={handleLogout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Çıkış Yap</button>
            </div>;
    }
}