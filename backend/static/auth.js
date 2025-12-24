// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { createUserWithEmailAndPassword, getAuth, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCfyRJey-JMfPdeh9WMNMvUSUwV0dNwmHE",
  authDomain: "spam-forum-data.firebaseapp.com",
  projectId: "spam-forum-data",
  storageBucket: "spam-forum-data.firebasestorage.app",
  messagingSenderId: "178613070553",
  appId: "1:178613070553:web:2f8f213dc37a3792206cc8"
}

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth();
  document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");
    const submit = document.getElementById('submit');    
    if (!submit) {
        console.log("Submit button is null!");
        return;
    }
    console.log("Submit button:", submit);
    submit.addEventListener('click', function(event) {
    console.log("Button clicked!");
    event.preventDefault();
    const emailInput = document.getElementById('email1');
    const passwordInput = document.getElementById('password1');
    const nameInput = document.getElementById('name');
    const email = emailInput.value;
    const name = nameInput.value;
  const password = passwordInput.value;
createUserWithEmailAndPassword(auth, email, password)
  .then(async (userCredential) => {
    const user = userCredential.user;
    emailInput.value = '';
    passwordInput.value = '';

    try {
      await updateProfile(user, { displayName: name });
      console.log("Display name set:", user.displayName); 
      nameInput.value = '';
    } catch (err) {
      console.error("Failed to set display name:", err);
    }
    window.location.href = '/index';
  })
  .catch((error) => {
    const errorCode = error.code;
    if (errorCode == 'auth/email-already-in-use') {
      alert('Email is taken');
      emailInput.value = '';
      passwordInput.value = '';
      nameInput.value = '';
    }
    else if (errorCode == 'auth/invalid-email') {
      alert('Not a valid email');
      emailInput.value = '';
      passwordInput.value = '';
      nameInput.value = '';
    }
    else if (errorCode == 'auth/weak-password') {
      alert('Password is too short');
      emailInput.value = '';
      passwordInput.value = '';
      nameInput.value = '';
    }
    else if (errorCode == 'auth/missing-email') {
      alert('Please enter a valid email');
      emailInput.value = '';
      passwordInput.value = '';
      nameInput.value = '';
    }
    else {
      alert('Something went wrong. Please try again later');
      emailInput.value = '';
      passwordInput.value = '';
      nameInput.value = '';
    }
  });
  
  });
  });
export function logout() {
  signOut(auth).then(() => {
    window.location.href = "/registration";
  }).catch((error) => {
    console.error("Logout failed:", error);
  });
};
export { auth };
