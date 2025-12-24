 async function loadDocs() {
        const collectionRef = collection(db, 'reports');
        const docs = await getDocs(collectionRef);
        let numTimes = 0;
        docs.forEach((d) => {
            numTimes+=1
        });
        return numTimes;
        
    }
document.querySelector('.stats-number').textContent = `${await loadDocs()}`;