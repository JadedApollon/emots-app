export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validatePassword = (password) => password.length >= 6;
export const validateUBB = (ubb) => /^[A-Z0-9]{8}$/.test(ubb);