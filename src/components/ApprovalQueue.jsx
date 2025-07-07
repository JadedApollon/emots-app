import { arrayUnion, collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

const ApprovalQueue = () => {
    const { currentUser } = useAuth(); // Yönetici bilgisini almak için
    const [pendingItems, setPendingItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hem zimmet hem de iade taleplerini dinlemek için sorguyu güncelliyoruz
        const q = query(collection(db, "stockItems"), where("status", "in", ["assignment_pending", "return_pending"]));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const items = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            setPendingItems(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (item) => {
        const itemRef = doc(db, "stockItems", item.id);
        const approverName = currentUser.displayName || currentUser.email;

        // Onaylama mantığını talebin türüne göre ayır
        if (item.status === 'assignment_pending') {
            const historyEntry = { timestamp: new Date(), action: "Zimmetleme Talebi Onaylandı", user: approverName };
            await updateDoc(itemRef, {
                status: 'with_personnel',
                currentLocation: {
                    type: 'personnel',
                    name: item.pendingRequest.requestedBy.name,
                    id: item.pendingRequest.requestedBy.id
                },
                history: arrayUnion(historyEntry),
                pendingRequest: null // İstek bilgisini temizle
            });
        } else if (item.status === 'return_pending') {
            const historyEntry = { timestamp: new Date(), action: "İade Talebi Onaylandı", user: approverName };
            await updateDoc(itemRef, {
                status: 'in_warehouse',
                currentLocation: { type: 'warehouse', name: 'Ana Depo' },
                history: arrayUnion(historyEntry),
                pendingRequest: null // İstek bilgisini temizle
            });
        }
    };

    const handleReject = async (item) => {
        const itemRef = doc(db, "stockItems", item.id);
        const approverName = currentUser.displayName || currentUser.email;

        // Reddetme mantığını talebin türüne göre ayır
        if (item.status === 'assignment_pending') {
            const historyEntry = { timestamp: new Date(), action: "Zimmetleme Talebi Reddedildi", user: approverName };
            await updateDoc(itemRef, {
                status: 'in_warehouse',
                history: arrayUnion(historyEntry),
                pendingRequest: null
            });
        } else if (item.status === 'return_pending') {
            const historyEntry = { timestamp: new Date(), action: "İade Talebi Reddedildi", user: approverName };
            await updateDoc(itemRef, {
                status: 'with_personnel', // İade reddedilirse, ürün personelde kalmaya devam eder
                history: arrayUnion(historyEntry),
                pendingRequest: null
            });
        }
    };


    if (loading) return <div className="p-4">Yükleniyor...</div>;

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Onay Bekleyen İşlemler</h2>
            {pendingItems.length === 0 ? (
                <p>Onay bekleyen işlem bulunmamaktadır.</p>
            ) : (
                <table className="min-w-full bg-white border shadow-md rounded-lg">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Ürün</th>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Talep Türü</th>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Talep Eden</th>
                            <th className="py-3 px-4 border-b text-center text-sm font-semibold text-gray-600 uppercase tracking-wider">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {pendingItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="py-3 px-4 border-b">{item.productName} ({item.lot})</td>
                                <td className="py-3 px-4 border-b">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        item.pendingRequest?.type === 'İade Talebi' ? 'bg-purple-200 text-purple-800' : 'bg-orange-200 text-orange-800'
                                    }`}>
                                        {item.pendingRequest?.type || 'Zimmetleme Talebi'}
                                    </span>
                                </td>
                                <td className="py-3 px-4 border-b">{item.pendingRequest?.requestedBy.name}</td>
                                <td className="py-3 px-4 border-b text-center">
                                    <button onClick={() => handleApprove(item)} className="bg-green-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-green-600 transition-colors">Onayla</button>
                                    <button onClick={() => handleReject(item)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors">Reddet</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ApprovalQueue;