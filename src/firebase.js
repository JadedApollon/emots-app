// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBIDYRO3h7in5W3oU9FB_qy1G1Yg497rTY",
  authDomain: "endomed-grup-medikal.firebaseapp.com",
  projectId: "endomed-grup-medikal",
  storageBucket: "endomed-grup-medikal.firebasestorage.app",
  messagingSenderId: "853679288088",
  appId: "1:853679288088:web:dbdb378450847e30c0f86d",
  measurementId: "G-7GS2YPMYNF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Diğer component'lerde kullanmak için db ve auth'u export edelim
export { auth, db };

