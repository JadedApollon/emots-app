import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/"); // Giriş başarılı, ana sayfaya yönlendir
        } catch (err) {
            setError("Giriş başarısız. Lütfen e-posta ve şifrenizi kontrol edin.");
            console.error("Giriş sırasında hata:", err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-primary">Giriş Yap</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label>Email:</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label>Şifre:</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" className="w-full bg-primary text-white py-2 rounded-md hover:bg-blue-700">Giriş Yap</button>
                </form>
                <p className="mt-4 text-center text-sm">
                    Hesabınız yok mu? <Link to="/signup" className="text-blue-600 hover:underline">Kayıt Olun</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;