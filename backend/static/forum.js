const container = document.getElementById('post-container');
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db } from './firebase-config.js';
async function loadDocs() {
 const collectionRef = collection(db, 'reports');
 const docs = await getDocs(collectionRef);
 let responses = [];
 docs.forEach((doc) => {
    let docItem = {}
    docItem['message'] = doc.data().message;
    docItem['prediction'] = doc.data().prediction;
    docItem['confidence'] = doc.data().confidence;
    docItem['type'] = doc.data().type;
    docItem['time'] = doc.data().timestamp;
    responses.push(docItem);
 });
 responses.forEach((response) => {
    let post = document.createElement('div');
    let message = document.createElement('p');
    let prediction = document.createElement('p');
    let confidence = document.createElement('p');
    let type = document.createElement('p');

    message.textContent = response['message'];
    prediction.textContent = response['prediction'];
    confidence.textContent = response['confidence'];
    type.textContent = response['type'];

    post.appendChild(message);
    post.appendChild(prediction);
    post.appendChild(confidence);
    post.appendChild(type);
    post.className = 'posts';
    container.appendChild(post);
 })
}
loadDocs();
document.body.appendChild(container);
