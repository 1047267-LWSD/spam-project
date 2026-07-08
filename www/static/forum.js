const container = document.getElementById('post-container');
const all = document.getElementById('all');
const service = document.getElementById('service');
const personal = document.getElementById('personal');
const lottery = document.getElementById('lottery');
const premium_rate = document.getElementById('fake-message');
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

function flagger() {
   document.querySelectorAll('.flag').forEach(btn => {
      btn.addEventListener('click', function () {
         const postId = btn.dataset.postId;
         openFlagModal(postId);
      })
   })
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
   const label = response['type'] === 'fake-message' ? 'premium rate' : response['type'];
   document.getElementById('modal-type').textContent = 'Scam Type: ' + label;
   document.getElementById('modal-message').textContent = response['message'];
   document.getElementById('modal-date').textContent = response['time'];
   document.getElementById('modal-confidence').textContent = 'Confidence: ' + response['confidence'];

   overlay.classList.add('open');
}

function ensureFlagModal() {
   let overlay = document.getElementById('post-flag-modal-overlay');
   if (overlay) return overlay;

   overlay = document.createElement('div');
   overlay.id = 'post-flag-modal-overlay';
   overlay.className = 'modal-overlay';

   const sheet = document.createElement('div');
   sheet.className = 'flag-modal-sheet';

   const closeBtn = document.createElement('button');
   closeBtn.className = 'modal-close';
   closeBtn.textContent = '✕';
   closeBtn.addEventListener('click', () => overlay.classList.remove('open'));

   const reason = document.createElement('textarea');
   reason.id = 'flag-reason-input';
   reason.placeholder = 'please state your reason for flagging the message';

   const submit_reason = document.createElement('button');
   submit_reason.className = 'submit_reason';
   submit_reason.textContent = 'Submit';

   // Listener attached here, at creation time — same moment the button
   // itself is created. A later querySelectorAll('.submit_reason') in
   // flagger() would always find nothing, since this button doesn't exist
   // in the DOM until the first time someone clicks Flag.
   submit_reason.addEventListener('click', async () => {
      const postId = overlay.dataset.postId;
      const reasonText = reason.value.trim();
      if (!reasonText) {
         alert('Please enter a reason before submitting.');
         return;
      }

      submit_reason.disabled = true;
      submit_reason.textContent = 'Submitting...';

      const postRef = doc(db, 'reports', postId);
      try {
         await updateDoc(postRef, {
            reportCount: increment(1)
         });

         const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
         if (card) {
            card.style.display = 'none';
            updateEmptyState();
         }

         overlay.classList.remove('open');
         reason.value = '';
         alert('Thank you — this post has been flagged for review.');
      }
      catch (error) {
         console.error(error);
         alert('Error submitting flag: ' + error.message);
      }
      finally {
         submit_reason.disabled = false;
         submit_reason.textContent = 'Submit';
      }
   });

   sheet.appendChild(closeBtn);
   sheet.appendChild(reason);
   sheet.appendChild(submit_reason);
   overlay.appendChild(sheet);

   overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
   });

   document.body.appendChild(overlay);
   return overlay;
}

function openFlagModal(postId) {
   const overlay = ensureFlagModal();
   overlay.dataset.postId = postId;
   document.getElementById('flag-reason-input').value = '';
   overlay.classList.add('open');
}

function ensureEmptyState() {
   let empty = document.getElementById('no-results');
   if (empty) return empty;

   empty = document.createElement('div');
   empty.id = 'no-results';
   empty.className = 'no-results';
   empty.textContent = 'No messages to display';
   empty.style.display = 'none';
   container.appendChild(empty);
   return empty;
}

function updateEmptyState() {
   const empty = ensureEmptyState();
   const anyVisible = Array.from(document.querySelectorAll('.post-card'))
      .some(card => card.style.display !== 'none');
   empty.style.display = anyVisible ? 'none' : 'block';
}

function setupFilters() {
   const filters = {
      all: all,
      service: service,
      personal: personal,
      lottery: lottery,
      'fake-message': premium_rate,
   };

   Object.entries(filters).forEach(([type, link]) => {
      if (!link) return;

      link.addEventListener('click', (e) => {
         e.preventDefault();

         document.querySelectorAll('.post-card').forEach(card => {
            const show = type === 'all' || card.dataset.type === type;
            card.style.display = show ? '' : 'none';
         });

         Object.values(filters).forEach(l => l && l.classList.remove('active-filter'));
         link.classList.add('active-filter');

         updateEmptyState();
      });
   });
}

async function loadDocs() {
   const collectionRef = collection(db, 'reports');
   const docs = await getDocs(collectionRef);
   let responses = [];
   let seenMessages = new Set();

   docs.forEach((d) => {
      let message = d.data().message;
      if (seenMessages.has(message)) return;
      seenMessages.add(message);

      let docItem = {};
      docItem['id'] = d.id;
      docItem['message'] = message;
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
      post.dataset.type = response['type'];
      post.dataset.postId = response['id'];

      // "Scam Type: X" heading
      const type = document.createElement('div');
      type.className = 'card-type';
      if (response['type'] == 'fake-message') {
         type.textContent = 'Scam Type: premium rate';
      }
      else {
      type.textContent = 'Scam Type: ' + response['type'];
      }

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

      const flag = document.createElement('button');
      flag.className = 'vote flag';
      flag.textContent = 'Flag';
      flag.dataset.postId = response['id'];

      votes.appendChild(upvoteBtn);
      votes.appendChild(downvoteBtn);
      votes.appendChild(flag);

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
   flagger();
   setupFilters();
   ensureEmptyState();
   updateEmptyState();
}

loadDocs();