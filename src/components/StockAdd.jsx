import { addDoc, collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { db } from '../firebase';

const StockAdd = () => {
    // Form alanları için state'ler
    const [productsList, setProductsList] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [ubb, setUbb] = useState('');
    const [ref, setRef] = useState('');
    const [lot, setLot] = useState('');
    const [utt, setUtt] = useState('');
    const [skt, setSkt] = useState('');

    // --- YENİ ÖLÇÜ STATE'LERİ ---
    const [dim1, setDim1] = useState('');
    const [dim2, setDim2] = useState('');
    const [dim3, setDim3] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            const querySnapshot = await getDocs(collection(db, "products"));
            const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProductsList(products);
        };
        fetchProducts();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProductId || !ubb || !lot || !skt) {
            setMessage("Lütfen ürün seçin ve UBB, Lot, SKT alanlarını doldurun.");
            return;
        }
        setLoading(true);
        setMessage('');

        try {
            const selectedProduct = productsList.find(p => p.id === selectedProductId);

            // Ölçüleri formatla ve ürün adına ekle
            const dimensions = [dim1, dim2, dim3].filter(Boolean);
            const formattedDimensions = dimensions.length > 0 ? ` ${dimensions.join('mm x ')}mm` : '';
            const finalProductName = `${selectedProduct.brand} ${selectedProduct.name}${formattedDimensions}`;

            const newStockItem = {
                productID: selectedProductId,
                productName: finalProductName, // Formatlanmış yeni ürün adını kaydet
                originalProductName: `${selectedProduct.brand} ${selectedProduct.name}`, // Orijinal adı da saklayalım
                dimensions: dimensions, // Ölçüleri dizi olarak sakla
                ubb, ref, lot, utt, skt,
                status: 'in_warehouse',
                currentLocation: { type: 'warehouse', name: 'Ana Depo' },
                history: [{ timestamp: new Date(), action: "Depoya Giriş", user: "admin" }],
                createdAt: new Date()
            };

            await addDoc(collection(db, "stockItems"), newStockItem);

            setMessage(`'${finalProductName}' ürünü başarıyla stoğa eklendi.`);
            // Formu temizle
            setSelectedProductId(''); setUbb(''); setRef(''); setLot(''); setUtt(''); setSkt('');
            setDim1(''); setDim2(''); setDim3('');

        } catch (error) {
            console.error("Stok eklenirken hata: ", error);
            setMessage("Bir hata oluştu. Lütfen konsolu kontrol edin.");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm";

    return (
        <div className="p-8 max-w-2xl mx-auto bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-primary">Fiziksel Stok Girişi</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Ürün Seçim Dropdown */}
                <div>
                    <label htmlFor="product" className="block text-sm font-medium text-gray-700">Ürün Tipi Seçin</label>
                    <select id="product" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className={inputStyle} required>
                        <option value="">-- Lütfen bir ürün seçin --</option>
                        {productsList.map(product => (<option key={product.id} value={product.id}>{product.brand} - {product.name}</option>))}
                    </select>
                </div>

                {/* Diğer Form Alanları */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label htmlFor="ubb" className="block text-sm font-medium">Ürün Barkodu (UBB)</label><input type="text" id="ubb" value={ubb} onChange={(e) => setUbb(e.target.value)} className={inputStyle} required /></div>
                    <div><label htmlFor="lot" className="block text-sm font-medium">Lot Numarası</label><input type="text" id="lot" value={lot} onChange={(e) => setLot(e.target.value)} className={inputStyle} required /></div>
                    <div><label htmlFor="ref" className="block text-sm font-medium">Referans No</label><input type="text" id="ref" value={ref} onChange={(e) => setRef(e.target.value)} className={inputStyle} /></div>
                    <div><label htmlFor="skt" className="block text-sm font-medium">Son Kullanma Tarihi (SKT)</label><input type="date" id="skt" value={skt} onChange={(e) => setSkt(e.target.value)} className={inputStyle} required /></div>
                    <div><label htmlFor="utt" className="block text-sm font-medium">Üretim Tarihi (ÜTT)</label><input type="date" id="utt" value={utt} onChange={(e) => setUtt(e.target.value)} className={inputStyle} /></div>
                </div>

                {/* --- YENİ OPSİYONEL ÖLÇÜ ALANLARI --- */}
                <hr />
                <div>
                    <h3 className="text-lg font-semibold">Opsiyonel Ölçüler (mm)</h3>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                        <div><label htmlFor="dim1" className="block text-sm font-medium">Ölçü 1</label><input type="number" id="dim1" value={dim1} onChange={(e) => setDim1(e.target.value)} className={inputStyle} /></div>
                        <div><label htmlFor="dim2" className="block text-sm font-medium">Ölçü 2</label><input type="number" id="dim2" value={dim2} onChange={(e) => setDim2(e.target.value)} className={inputStyle} /></div>
                        <div><label htmlFor="dim3" className="block text-sm font-medium">Ölçü 3</label><input type="number" id="dim3" value={dim3} onChange={(e) => setDim3(e.target.value)} className={inputStyle} /></div>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700">
                    {loading ? 'Ekleniyor...' : 'Stoğa Ekle'}
                </button>
            </form>
            {message && <p className="mt-4 text-center text-sm font-semibold">{message}</p>}
        </div>
    );
};

export default StockAdd;