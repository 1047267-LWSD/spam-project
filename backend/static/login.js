// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

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
  const login = document.getElementById('login');
  const auth = getAuth();
  login.addEventListener('click', function(event) {
    event.preventDefault();
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const email = emailInput.value;
  const password = passwordInput.value;
  signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed up 
    const user = userCredential.user;
    window.location.href = '/index'
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    console.log(error)
    let message = '';
      if (errorCode.includes('user-not-found')) {
        message = 'No account found with this email';
    } else if (errorCode.includes('wrong-password')) {
        message = 'Incorrect password';
    } else if (errorCode.includes('invalid-email')) {
        message = 'Not a valid email';
    } else {
         message = 'Something went wrong. Please try again later';
    }
    alert(message);
    emailInput.value = '';
    passwordInput.value = '';
  });

  });

  
export function logout() {
  signOut(auth).then(() => {
    window.location.href = "{{ url_for('login') }}";
  }).catch((error) => {
    console.error("Logout failed:", error);
  });
};
export { auth };
