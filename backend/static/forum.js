const container = document.getElementById('post-container');
import { collection, doc, getDocs, increment, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db } from './firebase-config.js';
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
async function loadDocs() {
 const collectionRef = collection(db, 'reports');
 const docs = await getDocs(collectionRef);
 let responses = [];
 docs.forEach((d) => {
    let docItem = {}
    docItem['id'] = d.id;
    docItem['message'] = d.data().message;
    docItem['prediction'] = d.data().prediction;
    docItem['confidence'] = d.data().confidence;
    docItem['type'] = d.data().type;
    docItem['upvotes'] = d.data().upvotes || 0;
    docItem['downvotes'] = d.data().downvotes || 0;
    let timestamp = d.data().timestamp;
    let date = new Date(timestamp);
    let pstDate = date.toLocaleDateString('en-US', {timeZone: 'America/Los_Angeles'})
    docItem['time'] = pstDate
    responses.push(docItem);
 });
 responses.forEach((response) => {
    let post = document.createElement('div');
    let time = document.createElement('p');
    time.setAttribute('class','time');
    let message = document.createElement('p');
    message.setAttribute('class','message');
    let confidence = document.createElement('p');
    confidence.setAttribute('class','confidence');
    let type = document.createElement('p');
    type.setAttribute('class','type');
    let details = document.createElement('div');
    details.setAttribute('class', 'details');
    time.textContent = response['time'];
    message.textContent = response['message'];
    confidence.textContent = "Confidence: " + response['confidence'];
    type.textContent = "Scam type: "+ response['type'];

   let votingSection = document.createElement('div');
   votingSection.setAttribute('class', 'votingSection');

   let upvoteBtn = document.createElement('button');
   let downvoteBtn = document.createElement('button');
   upvoteBtn.setAttribute('class', 'upvote');
   downvoteBtn.setAttribute('class', 'downvote');
   upvoteBtn.innerHTML = `👍<span>${response['upvotes']}</span>`
   downvoteBtn.innerHTML = `👎<span>${response['downvotes']}</span>`
   upvoteBtn.dataset.postId = response['id'];
   downvoteBtn.dataset.postId = response['id'];

   votingSection.appendChild(upvoteBtn);
   votingSection.appendChild(downvoteBtn);

    post.appendChild(time);
    post.appendChild(message);
    details.appendChild(confidence);
    details.appendChild(type);
    details.appendChild(votingSection);
    post.appendChild(details);
    post.className = 'posts';
    container.appendChild(post);
 })
 votingButtons();
}
loadDocs();
document.body.appendChild(container);
