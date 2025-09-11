import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBuQlP4IUseUSnK2Zm31scCo5HrbNpZZF0",
  authDomain: "localswap-761cd.firebaseapp.com",
  projectId: "localswap-761cd",
  storageBucket: "localswap-761cd.firebasestorage.app",
  messagingSenderId: "969228383594",
  appId: "1:969228383594:web:a5878c11769fcd6db0e113",
  measurementId: "G-ERGSDY5SZS"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service  
export const db = getFirestore(app)

export default app