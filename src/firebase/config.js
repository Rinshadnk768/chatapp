// src/firebase/config.js

import firebase from '@react-native-firebase/app';
// Import other services explicitly so they are bundled
import '@react-native-firebase/auth'; 
import '@react-native-firebase/firestore'; 
import '@react-native-firebase/storage'; 
import '@react-native-firebase/functions'; 
import '@react-native-firebase/database';

// --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyCLwi-XSYyMQJauo__lD-6-Fxd0htvrGI0",
  authDomain: "instil-learning-hub-b1f48.firebaseapp.com",
  projectId: "instil-learning-hub-b1f48",
  storageBucket: "instil-learning-hub-b1f48.firebasestorage.app",
  messagingSenderId: "598084072877",
  appId: "1:598084072877:web:e0268ff73dec9460b85d24",
  databaseURL: "https://instil-learning-hub-b1f48-default-rtdb.firebaseio.com",
};

// Initialize Firebase if it hasn't been already
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export the initialized services
export const auth = firebase.auth();
export const db = firebase.firestore();
export const rtdb = firebase.database();
export const storage = firebase.storage();
export const functions = firebase.functions();

export default firebase;