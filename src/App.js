import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import ApprovalQueue from './components/ApprovalQueue';
import BillingTracker from './components/BillingTracker';
import { AuthProvider, useAuth } from './context/AuthContext';
import { auth } from './firebase';

// Component'leri import et
import Login from './components/Login';
import ProductAdd from './components/ProductAdd';
import SignUp from './components/SignUp';
import StockAdd from './components/StockAdd';
import StockDetail from './components/StockDetail'; // <--- EKLENECEK SATIR BU
import StockList from './components/StockList';

const ProtectedRoute = ({ children }) => {
    const { currentUser } = useAuth();
    return currentUser ? children : <Navigate to="/login" replace />;
};

const Layout = ({ children }) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        auth.signOut().then(() => navigate('/login'));
    };

    return (
        <div>
            <nav className="bg-gray-800 p-4 shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-white text-xl font-bold">Endomed Grup</h1>
                    {currentUser && (
                        <div className='flex items-center space-x-6'>
                            <span className='text-gray-300 text-sm'>Hoş geldin, {currentUser.displayName || currentUser.email}</span>
                            <ul className="flex space-x-6">
                                <li><Link to="/" className="text-gray-300 hover:text-white">Stok Listesi</Link></li>
                                <li><Link to="/onay-bekleyenler" className="text-gray-300 hover:text-white">Onay Bekleyenler</Link></li>
                                <li><Link to="/faturalandirma" className="text-gray-300 hover:text-white">Faturalandırma</Link></li>
                                <li><Link to="/stok-girisi" className="text-gray-300 hover:text-white">Stok Girişi</Link></li>
                            </ul>
                            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm">Çıkış Yap</button>
                        </div>
                    )}
                </div>
            </nav>
            <main className="container mx-auto p-6">{children}</main>
        </div>
    );
}; // <--- EKSİK OLAN PARANTEZ VE NOKTALI VİRGÜL BU SATIRDA!

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public (herkese açık) rotalar */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />

                    {/* Protected (korumalı) rotalar */}
                    <Route path="/" element={<ProtectedRoute><Layout><StockList /></Layout></ProtectedRoute>} />
                    <Route path="/stok-girisi" element={<ProtectedRoute><Layout><StockAdd /></Layout></ProtectedRoute>} />
                    <Route path="/urun-ekle" element={<ProtectedRoute><Layout><ProductAdd /></Layout></ProtectedRoute>} />
                    <Route path="/onay-bekleyenler" element={<ProtectedRoute><Layout><ApprovalQueue /></Layout></ProtectedRoute>} />
                    <Route path="/faturalandirma" element={<ProtectedRoute><Layout><BillingTracker /></Layout></ProtectedRoute>} />
                    <Route path="/stok-detay/:itemId" element={<ProtectedRoute><Layout><StockDetail /></Layout></ProtectedRoute>} />

                    {/* Eşleşmeyen tüm yolları ana sayfaya yönlendir */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;