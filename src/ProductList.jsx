import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { db } from '../firebase';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "products"));
                const productsArray = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setProducts(productsArray);
            } catch (error) {
                console.error("Ürünler çekilirken hata oluştu: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []); // Boş dependency array, component yüklendiğinde bir kere çalışmasını sağlar

    if (loading) {
        return <div>Yükleniyor...</div>;
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4 text-primary">Tanımlı Ürünler</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="py-2 px-4 text-left">Marka</th>
                            <th className="py-2 px-4 text-left">Ürün Adı</th>
                            <th className="py-2 px-4 text-left">Türü</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} className="border-b hover:bg-gray-100">
                                <td className="py-2 px-4">{product.brand}</td>
                                <td className="py-2 px-4">{product.name}</td>
                                <td className="py-2 px-4">{product.type}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductList;