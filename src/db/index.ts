import { FirebaseApp, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { FacebookAuthProvider, getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0eRG-YoyTVGh1MZaTwz8Qgw9leyg5Fqw",
  authDomain: "swapcard-94209.firebaseapp.com",
  projectId: "swapcard-94209",
  storageBucket: "swapcard-94209.appspot.com",
  messagingSenderId: "818232785277",
  appId: "1:818232785277:web:ac1d84149a828b9c9fb414"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const facebookProvider = new FacebookAuthProvider();

