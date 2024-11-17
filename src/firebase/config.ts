import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBL9e7KdGpsvKZeTPIalNj_VaYbY2I4otc",
  authDomain: "agri-staff-new.firebaseapp.com",
  projectId: "agri-staff-new",
  storageBucket: "agri-staff-new.firebasestorage.app",
  messagingSenderId: "332468192622",
  appId: "1:332468192622:web:d4785059b09cca2eb8ad7f",
  measurementId: "G-DYG53YVQPV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 