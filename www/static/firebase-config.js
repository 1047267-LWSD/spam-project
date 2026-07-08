// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfyRJey-JMfPdeh9WMNMvUSUwV0dNwmHE",
  authDomain: "spam-forum-data.firebaseapp.com",
  projectId: "spam-forum-data",
  storageBucket: "spam-forum-data.firebasestorage.app",
  messagingSenderId: "178613070553",
  appId: "1:178613070553:web:2f8f213dc37a3792206cc8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
