import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Firestore'a kullanıcı eklemek için
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; // db'yi de import edelim

const SignUp = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Firebase Authentication profiline ismi ekle
            await updateProfile(user, {
                displayName: name
            });

            // Firestore'daki 'users' koleksiyonuna da kullanıcıyı ekle
            // Bu, ileride rol gibi ek bilgileri tutmak için önemlidir.
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                role: 'personnel' // Varsayılan rol
            });

            navigate("/"); // Kayıt başarılı, ana sayfaya yönlendir
        } catch (err) {
            setError(err.message);
            console.error("Kayıt sırasında hata:", err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-primary">Kayıt Ol</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label>İsim Soyisim:</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label>Email:</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label>Şifre:</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" className="w-full bg-primary text-white py-2 rounded-md hover:bg-blue-700">Kayıt Ol</button>
                </form>
            </div>
        </div>
    );
};

export default SignUp;