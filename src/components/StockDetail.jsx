import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../firebase';

const StockDetail = () => {
    // URL'deki :itemId parametresini almak için useParams hook'unu kullanıyoruz
    const { itemId } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!itemId) return;

        // Belirli bir dökümana referans oluşturuyoruz
        const docRef = doc(db, "stockItems", itemId);

        // Bu dökümanı gerçek zamanlı dinlemek için onSnapshot kullanıyoruz
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                setItem({ id: doc.id, ...doc.data() });
            } else {
                setError("Ürün bulunamadı.");
            }
            setLoading(false);
        }, (err) => {
            console.error("Detay çekerken hata: ", err);
            setError("Veri alınırken bir hata oluştu.");
            setLoading(false);
        });

        // Component ekrandan kaldırıldığında dinleyiciyi sonlandır
        return () => unsubscribe();
    }, [itemId]);

        const translateStatus = (status) => {
        const translations = {
            'in_warehouse': 'Depoda',
            'with_personnel': 'Personelde',
            'assignment_pending': 'Zimmet Onayı Bekliyor',
            'return_pending': 'İade Onayı Bekliyor',
            'used': 'Kullanıldı'
        };
        return translations[status] || status;
    };
    

    if (loading) {
        return <div className="text-center p-10">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">{error}</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Stok Listesine Geri Dön</Link>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-primary text-white p-4">
                    <h2 className="text-2xl font-bold">{item.productName}</h2>
                    <p className="text-sm opacity-90">LOT: {item.lot}</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Temel Bilgiler */}
                    <div>
                        <h3 className="text-lg font-semibold border-b pb-2 mb-3">Ürün Bilgileri</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>UBB:</strong> {item.ubb}</p>
                            <p><strong>Referans No:</strong> {item.ref || 'N/A'}</p>
                            <p><strong>Üretim Tarihi:</strong> {item.utt || 'N/A'}</p>
                            <p><strong>Son Kullanma Tarihi:</strong> {item.skt || 'N/A'}</p>
                        </div>
                    </div>
                    {/* Durum Bilgileri */}
                    <div>
                        <h3 className="text-lg font-semibold border-b pb-2 mb-3">Durum ve Konum</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Durum:</strong> <span className="font-bold">{item.status}</span></p>
                            <p><strong>Mevcut Konum:</strong> {item.currentLocation.name}</p>
                        </div>
                        {item.status === 'used' && item.usageInfo && (
                             <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm">
                                <h4 className="font-semibold text-red-800">Kullanım Detayları</h4>
                                <p><strong>Hastane:</strong> {item.usageInfo.hospital}</p>
                                <p><strong>Hasta:</strong> {item.usageInfo.patient}</p>
                                <p><strong>Kullanım Tarihi:</strong> {item.usageInfo.usageDate}</p>
                             </div>
                        )}
                    </div>
                </div>
                {/* Geçmiş Hareketler */}
                <div className="p-6 border-t">
                     <h3 className="text-lg font-semibold mb-3">Geçmiş Hareketler (Tarihçe)</h3>
                     <div className="space-y-3">
                        {item.history && [...item.history].sort((a,b) => b.timestamp.toMillis() - a.timestamp.toMillis()).map((log, index) => (
                            <div key={index} className="flex items-start text-sm p-2 bg-gray-50 rounded-md">
                                <div className="text-gray-500 mr-4 whitespace-nowrap">
                                    {log.timestamp.toDate().toLocaleString('tr-TR')}
                                </div>
                                <div className="text-gray-800">
                                    <span className="font-semibold">{log.action}</span>
                                    <span className="text-gray-600"> - (İşlemi Yapan: {log.user})</span>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default StockDetail;