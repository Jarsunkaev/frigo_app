import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5-rqNltV7_WL1fUB3BBrjy_bm_5XUbao",
  authDomain: "frigo-1b57c.firebaseapp.com",
  projectId: "frigo-1b57c",
  storageBucket: "frigo-1b57c.appspot.com",
  messagingSenderId: "295100988052",
  appId: "1:295100988052:web:410c7293e496deab0e9281",
  measurementId: "G-WKM95V7K81",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
