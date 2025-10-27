const container = document.getElementById('post-container');
import { collection, doc, getDocs, increment, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db } from './firebase-config.js';
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
    docItem['upvotes']= d.data().upvotes || 0; 
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
    type.textContent = "Spam type: "+ response['type'];
    let voteSection = document.createElement('div');
    voteSection.setAttribute('class','vote-section');
    let upvote = document.createElement('button');
    upvote.setAttribute('class', 'upvote');
    upvote.innerHTML = `👍 <span>${response['upvotes']}</span>`;
    upvote.dataset.postId = response['id'];
    let downvote = document.createElement('button');
    downvote.setAttribute('class', 'downvote');
    downvote.innerHTML = `👎 <span>${response['downvotes']}</span>`;
    downvote.dataset.postId = response['id'];

    voteSection.appendChild(upvote);
    voteSection.appendChild(downvote);

    post.appendChild(time);
    post.appendChild(message);
    details.appendChild(confidence);
    details.appendChild(type);
    details.appendChild(voteSection);
    post.appendChild(details);
    post.className = 'posts';
    container.appendChild(post);
 })

document.querySelectorAll('.upvote').forEach(btn => {
   btn.addEventListener('click', async(e) => {
      const postId = e.target.dataset.postId;
      const postRef = doc(db, 'reports', postId);
      try {
         await updateDoc(postRef, {
            upvotes: increment(1)
         });
         const countSpan = e.target.querySelector('span');
         countSpan.textContent = parseInt(countSpan.textContent) + 1;
      }
      catch (error){
         console.error('Error upvoting:', error);
      }
   })
})
document.querySelectorAll('.downvote').forEach(btn => {
   btn.addEventListener('click', async(e) => {
      const postId = e.target.dataset.postId;
      const postRef = doc(db, 'reports', postId);
      try {
         await updateDoc(postRef, {
            downvotes: increment(1)
         });
         const countSpan = e.target.querySelector('span');
         countSpan.textContent = parseInt(countSpan.textContent) + 1;
      }
      catch (error){
         console.error('Error downvoting:', error);
      }
   })
})
}
loadDocs();
document.body.appendChild(container);
