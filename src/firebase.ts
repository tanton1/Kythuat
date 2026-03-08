import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA2kbzG3Ll-yZmSAx2fE4Ff-jNkX4m3AMc",
  authDomain: "kythuat-6f66b.firebaseapp.com",
  projectId: "kythuat-6f66b",
  storageBucket: "kythuat-6f66b.firebasestorage.app",
  messagingSenderId: "370907799453",
  appId: "1:370907799453:web:28d7a20b7c05c0d6c75974",
  measurementId: "G-79HQH12YKX"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
