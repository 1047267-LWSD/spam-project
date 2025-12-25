import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db } from './firebase-config.js';
 async function loadDocs() {
        const collectionRef = collection(db, 'reports');
        const docs = await getDocs(collectionRef);
        let numTimes = 0;
        docs.forEach((d) => {
            numTimes+=1
        });
        return numTimes;
        
    }
document.querySelector('#numTimes').textContent = `${await loadDocs()}`;