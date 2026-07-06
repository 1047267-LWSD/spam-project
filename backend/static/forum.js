const container = document.getElementById('post-container');
import { collection, doc, getDocs, increment, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db } from './firebase-config.js';

async function handleUpVotes(postId, buttonElement) {
   const postRef = doc(db, 'reports', postId);
   try {
      await updateDoc(postRef, {
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
      await updateDoc(postRef, {
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
      btn.addEventListener('click', function () {
         const postId = btn.dataset.postId;
         handleUpVotes(postId, btn);
      });
   });

   document.querySelectorAll('.downvote').forEach(btn => {
      btn.addEventListener('click', function () {
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

   const type = document.createElement('div');
   type.className = 'modal-type';
   type.id = 'modal-type';

   const message = document.createElement('p');
   message.className = 'modal-message';
   message.id = 'modal-message';

   const stats = document.createElement('div');
   stats.className = 'card-stats';

   const date = document.createElement('span');
   date.className = 'card-date';
   date.id = 'modal-date';

   const confidence = document.createElement('span');
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

function openModal(response) {
   const overlay = ensureModal();
   document.getElementById('modal-type').textContent = 'Scam Type: ' + response['type'];
   document.getElementById('modal-message').textContent = response['message'];
   document.getElementById('modal-date').textContent = response['time'];
   document.getElementById('modal-confidence').textContent = 'Confidence: ' + response['confidence'];

   overlay.classList.add('open');
}

async function loadDocs() {
   const collectionRef = collection(db, 'reports');
   const docs = await getDocs(collectionRef);
   let responses = [];

   docs.forEach((d) => {
      let docItem = {};
      docItem['id'] = d.id;
      docItem['message'] = d.data().message;
      docItem['prediction'] = d.data().prediction;
      docItem['confidence'] = d.data().confidence;
      docItem['type'] = d.data().type;
      docItem['upvotes'] = d.data().upvotes || 0;
      docItem['downvotes'] = d.data().downvotes || 0;
      let timestamp = d.data().timestamp;
      let date = new Date(timestamp);
      let pstDate = date.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
      docItem['time'] = pstDate;
      responses.push(docItem);
   });

   responses.forEach((response) => {
      // Outer card
      const post = document.createElement('div');
      post.className = 'post-card';

      // "Scam Type: X" heading
      const type = document.createElement('div');
      type.className = 'card-type';
      type.textContent = 'Scam Type: ' + response['type'];

      // Message, line-clamped to 3 lines
      const message = document.createElement('p');
      message.className = 'card-message';
      message.textContent = response['message'];

      // "Read full message" hint
      const expandHint = document.createElement('div');
      expandHint.className = 'card-expand-hint';
      expandHint.textContent = 'Tap to read full message';

      // Bottom gray details bar
      const details = document.createElement('div');
      details.className = 'card-details';

      const stats = document.createElement('div');
      stats.className = 'card-stats';

      const date = document.createElement('span');
      date.className = 'card-date';
      date.textContent = response['time'];

      const confidence = document.createElement('span');
      confidence.className = 'card-confidence';
      confidence.textContent = 'Confidence: ' + response['confidence'];

      stats.appendChild(date);
      stats.appendChild(confidence);

      const votes = document.createElement('div');
      votes.className = 'card-votes';

      const upvoteBtn = document.createElement('button');
      upvoteBtn.className = 'vote upvote';
      upvoteBtn.innerHTML = `👍<span>${response['upvotes']}</span>`;
      upvoteBtn.dataset.postId = response['id'];

      const downvoteBtn = document.createElement('button');
      downvoteBtn.className = 'vote downvote';
      downvoteBtn.innerHTML = `👎<span>${response['downvotes']}</span>`;
      downvoteBtn.dataset.postId = response['id'];

      votes.appendChild(upvoteBtn);
      votes.appendChild(downvoteBtn);

      details.appendChild(stats);
      details.appendChild(votes);

      post.appendChild(type);
      post.appendChild(message);
      post.appendChild(expandHint);
      post.appendChild(details);

      // Open the popup when tapping the card, but not when tapping a vote button
      post.addEventListener('click', (e) => {
         if (e.target.closest('.vote')) return;
         openModal(response);
      });

      container.appendChild(post);
   });

   votingButtons();
}

loadDocs();