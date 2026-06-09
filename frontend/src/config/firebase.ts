import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBaDi1JCskI_nqwoWGGlndFBNDl4O456kY",
  authDomain: "examination-2c213.firebaseapp.com",
  projectId: "examination-2c213",
  storageBucket: "examination-2c213.firebasestorage.app",
  messagingSenderId: "507062295030",
  appId: "1:507062295030:web:e76ff218a1b18d0db70fd7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
