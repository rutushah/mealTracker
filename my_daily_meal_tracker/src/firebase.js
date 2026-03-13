import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAU0sXTOGGBNTlRO0BzMEUiR3KQBRjdXAA",
  authDomain: "mydailymealtracker.firebaseapp.com",
  projectId: "mydailymealtracker",
  storageBucket: "mydailymealtracker.firebasestorage.app",
  messagingSenderId: "889118341661",
  appId: "1:889118341661:web:92d8a9a5893011633564f4",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export default app;