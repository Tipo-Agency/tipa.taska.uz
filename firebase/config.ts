// Firebase configuration
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgDuPin7aSOBfkmA0ENpiiQZAbbj_Fl4g",
  authDomain: "tipa-task-manager.firebaseapp.com",
  databaseURL: "https://tipa-task-manager-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tipa-task-manager",
  storageBucket: "tipa-task-manager.firebasestorage.app",
  messagingSenderId: "529094386000",
  appId: "1:529094386000:web:223840a2126ab0b1a88c55",
  measurementId: "G-PWP22Q6PF4"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const storage = getStorage(app);
export const db = getFirestore(app);

// Initialize Analytics only in browser environment
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Export app as default export as well
export default app;

