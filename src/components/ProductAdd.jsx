import { addDoc, collection } from "firebase/firestore";
import { useState } from 'react';
import { db } from '../firebase'; // Bir önceki adımda oluşturduğumuz config dosyasını import ediyoruz

const ProductAdd = () => {
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); // Formun sayfayı yenilemesini engelle
    if (!brand || !name) {
      setMessage('Marka ve Ürün Adı alanları zorunludur.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // 'products' koleksiyonuna yeni bir doküman ekliyoruz
      const docRef = await addDoc(collection(db, "products"), {
        brand: brand,
        name: name,
        type: type,
        createdAt: new Date() // Ekleme tarihi
      });
      console.log("Doküman başarıyla eklendi, ID: ", docRef.id);
      setMessage('Ürün başarıyla eklendi!');
      // Formu temizle
      setBrand('');
      setName('');
      setType('');
    } catch (error) {
      console.error("Doküman eklenirken hata oluştu: ", error);
      setMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-primary">Yeni Ürün Tanımla</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Marka</label>
          <input
            type="text"
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Ürün Adı</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Türü (Örn: Stent Greft, Kateter)</label>
          <input
            type="text"
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isLoading ? 'Ekleniyor...' : 'Ürünü Kaydet'}
        </button>
      </form>
      {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
    </div>
  );
};

export default ProductAdd;