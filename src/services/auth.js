import { initializeAuth } from './firebase'; // Firebase config dosyanızdan import edin

/**
 * Kullanıcı giriş fonksiyonu
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{idToken: string, refreshToken: string, localId: string}>}
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${import.meta.env.VITE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          returnSecureToken: true 
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || 'Authentication failed');
    }

    const { idToken, refreshToken, localId, expiresIn } = await response.json();
    
    // Token'ları ve süre bilgisini sakla
    localStorage.setItem('firebaseToken', idToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userId', localId);
    localStorage.setItem('tokenExpiry', String(Date.now() + expiresIn * 1000));
    
    return { idToken, refreshToken, localId };
    
  } catch (error) {
    console.error("Login error:", error);
    throw new Error(formatAuthError(error.message));
  }
};

/**
 * Token yenileme fonksiyonu
 * @returns {Promise<string|null>} Yeni idToken veya null
 */
export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${import.meta.env.VITE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`
      }
    );

    if (!response.ok) throw new Error(await response.text());

    const { id_token, expires_in } = await response.json();
    
    // Yeni token'ı sakla
    localStorage.setItem('firebaseToken', id_token);
    localStorage.setItem('tokenExpiry', String(Date.now() + expires_in * 1000));
    
    return id_token;
    
  } catch (error) {
    console.error("Token refresh failed:", error);
    clearAuthData(); // Hata durumunda tüm verileri temizle
    return null;
  }
};

/**
 * Auth verilerini temizle
 */
export const clearAuthData = () => {
  ['firebaseToken', 'refreshToken', 'userId', 'tokenExpiry'].forEach(item => {
    localStorage.removeItem(item);
  });
};

/**
 * Token geçerlilik kontrolü
 * @returns {boolean}
 */
export const isTokenValid = () => {
  const expiry = localStorage.getItem('tokenExpiry');
  return expiry && Date.now() < Number(expiry);
};

/**
 * Hata mesajlarını kullanıcı dostu forma çevir
 */
const formatAuthError = (error) => {
  const messages = {
    'INVALID_EMAIL': 'Geçersiz email adresi',
    'EMAIL_NOT_FOUND': 'Bu email ile kayıtlı kullanıcı bulunamadı',
    'INVALID_PASSWORD': 'Hatalı şifre',
    'USER_DISABLED': 'Hesap devre dışı bırakılmış',
    'TOKEN_EXPIRED': 'Oturum süresi doldu',
    // Diğer hata kodları...
  };
  
  return messages[error] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
};

/**
 * Mevcut kullanıcı token'ını getir
 * @returns {Promise<string|null>}
 */
export const getCurrentToken = async () => {
  if (isTokenValid()) {
    return localStorage.getItem('firebaseToken');
  }
  
  return await refreshToken(); // Token süresi dolmuşsa yenile
};