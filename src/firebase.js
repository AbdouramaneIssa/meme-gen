// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
 apiKey: "AIzaSyDYVX_h142AP5l0nUCjK4N-np_p9It3yOc",
  authDomain: "generateur-de-memes-72bca.firebaseapp.com",
  projectId: "generateur-de-memes-72bca",
  storageBucket: "generateur-de-memes-72bca.firebasestorage.app",
  messagingSenderId: "549348050134",
  appId: "1:549348050134:web:02916b2c8e380ba1f97577",
  measurementId: "G-4948X7ZQ2P"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
