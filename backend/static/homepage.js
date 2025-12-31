import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db } from './firebase-config.js';
import { auth } from "/static/auth.js";
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async(user) => {
    if (!user) {
        window.location.href = '/registration';
        return;
    }
    else {
        console.log("Logged in as:", user.email);
        document.querySelector('#header').textContent = `Hi ${user.displayName || 'User'}!`;
            document.querySelector('.stat-number').textContent = `${await loadDocs(user)}`;
      }
    });

    async function loadDocs(user) {
        const collectionRef = collection(db, 'reports');
        const docs = await getDocs(collectionRef);
        let numTimes = 0;
        docs.forEach((d) => {
            console.log(d.data().reportedBy)
            if (d.data().reportedBy == user.displayName) {
                numTimes += 1;
            }
        });
        return numTimes;
        
    }

   });




