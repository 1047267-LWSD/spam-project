import { collection, doc, getDocs, increment, limit, orderBy, query, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db } from './firebase-config.js';
const container = document.getElementById('carousel-inner');
 async function loadDocs() {
        const collectionRef = collection(db, 'reports');
        const docs = await getDocs(collectionRef);
        let numTimes = 0;
        docs.forEach((d) => {
            numTimes+=1
        });
        return numTimes;    
        
    }

    async function handleUpVotes(postId, buttonElement) {
    const postRef = doc(db, 'reports', postId);
    try {
        await updateDoc (postRef, {
            upvotes: increment(1)
        });

        const countSpan = buttonElement.querySelector('span');
        countSpan.textContent = parseInt(countSpan.textContent) + 1;
    }

    catch (error) {
        console.error(error);
    }
    }

    async function handleDownVotes(postId, buttonElement) {
    const postRef = doc(db, 'reports', postId);
    try {
        await updateDoc (postRef, {
            downvotes: increment(1)
        });

        const countSpan = buttonElement.querySelector('span');
        countSpan.textContent = parseInt(countSpan.textContent) + 1;
    }

    catch (error) {
        console.error(error);
    }
    }

    function votingButtons() {
    document.querySelectorAll('.upvote').forEach(btn => {
        btn.addEventListener('click', function() {
            const postId = btn.dataset.postId;
            handleUpVotes(postId, btn);
        });
    });

    document.querySelectorAll('.downvote').forEach(btn => {
        btn.addEventListener('click', function() {
            const postId = btn.dataset.postId;
            handleDownVotes(postId, btn);
        });
    });
    }

    function ensureModal() {
        let overlay = document.getElementById('post-modal-overlay');
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = 'post-modal-overlay';
        overlay.className = 'modal-overlay';

        const sheet = document.createElement('div');
        sheet.className = 'modal-sheet';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('click', () => overlay.classList.remove('open'));

        const type = document.createElement('h2');
        type.className = 'modal-type';
        type.id = 'modal-type';

        const message = document.createElement('p');
        message.className = 'modal-message';
        message.id = 'modal-message';

        const stats = document.createElement('div');
        stats.className = 'card-stats';

        const date = document.createElement('p');
        date.className = 'card-date';
        date.id = 'modal-date';

        const confidence = document.createElement('p');
        confidence.className = 'card-confidence';
        confidence.id = 'modal-confidence';

        stats.appendChild(date);
        stats.appendChild(confidence);

        sheet.appendChild(closeBtn);
        sheet.appendChild(type);
        sheet.appendChild(message);
        sheet.appendChild(stats);
        overlay.appendChild(sheet);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('open');
        });

        document.body.appendChild(overlay);
        return overlay;
    }

    function openModal(report) {
        const overlay = ensureModal();
        document.getElementById('modal-type').textContent = 'Scam Type: ' + report.type;
        document.getElementById('modal-message').textContent = report.message;
        document.getElementById('modal-date').textContent = report.timestamp;
        document.getElementById('modal-confidence').textContent = 'Confidence: ' + report.confidence;

        overlay.classList.add('open');
    }

let recents = []
let seenMessages = new Set();
const collectionRef = collection(db, 'reports');
const q = query(collectionRef, orderBy('timestamp', 'desc'), limit(15));
const snapshot = await getDocs(q);
const docs = snapshot.docs
docs.forEach((d) => {
    let message = d.data().message;
    if (seenMessages.has(message)) return;
    seenMessages.add(message);
    let report = {}
    report['id'] = d.id;
    report['type'] = d.data().type;
    report['message'] = message;
    report['prediction'] = d.data().prediction;
    report['confidence'] = d.data().confidence;
    report['upvotes'] = d.data().upvotes || 0;
    report['downvotes'] = d.data().downvotes || 0;
    let timestamp = d.data().timestamp;
    let date = new Date(timestamp);
    report['timestamp'] = date.toLocaleDateString('en-US', {timeZone: 'America/Los_Angeles'});
    recents.push(report);

})


recents.forEach((report) => {
    let card = document.createElement('div');
    card.className = 'carousel-card';
    card.innerHTML = `
        <h2 class="card-type">Scam Type: ${report.type}</h2>
        <p class="card-message">${report.message}</p>
        <p class="card-expand-hint">Tap to read full message</p>
        <div class = 'card-details'>
        <div class = 'card-stats'>
        <p class = 'card-date'>${report.timestamp}</p>
        <p class="card-confidence">Confidence: ${report.confidence}</p>
        </div>
        <div class="card-votes">
            <button class='vote upvote' data-post-id='${report.id}'>👍 <span>${report.upvotes}</span></button>
            <button class='vote downvote' data-post-id='${report.id}'>👎 <span>${report.downvotes}</span></button>
        </div>
        </div>
    `;

    // Open the popup when tapping the card, but not when tapping a vote button
    card.addEventListener('click', (e) => {
        if (e.target.closest('.vote')) return;
        openModal(report);
    });

    container.appendChild(card);
});
votingButtons();

let currentIndex = 0;
const totalCards = recents.length;
const prev = document.querySelector('.carousel-control-prev');
const next = document.querySelector('.carousel-control-next');

function updateCarousel() {
    container.style.transform = `translateX(-${currentIndex * 100}%)`;
    updateDots();
}

next.addEventListener('click', (e) => {
    e.preventDefault();
    currentIndex = (currentIndex + 1) % totalCards;
    updateCarousel();
});

prev.addEventListener('click', (e) => {
    e.preventDefault();
    currentIndex = (currentIndex - 1 + totalCards) % totalCards;
    updateCarousel();
});

const dotsContainer = document.querySelector('.carousel-indicators');
for (let i = 0; i < totalCards; i++) {
    let dot = document.createElement('span');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dotsContainer.appendChild(dot);
}

function updateDots() {
    document.querySelectorAll('.dot').forEach((dot, i) => {
        dot.className = 'dot' + (i === currentIndex ? ' active' : '');
    });
}

document.querySelector('#numTimes').textContent = `${await loadDocs()}`;