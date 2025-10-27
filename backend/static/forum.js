const container = document.getElementById('post-container');
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
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

    post.appendChild(time);
    post.appendChild(message);
    details.appendChild(confidence);
    details.appendChild(type);
    post.appendChild(details);
    post.className = 'posts';
    container.appendChild(post);
 })

}
loadDocs();
document.body.appendChild(container);
