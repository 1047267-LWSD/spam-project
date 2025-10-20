import { addDoc, collection } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db } from './firebase-config.js';
    document.addEventListener('DOMContentLoaded', () => {   
    const spam = document.getElementById('spam-input');
    const text = document.createElement('p');
    const button = document.getElementById('check');
    const shapped = document.createElement('p');
    const img = document.getElementById('myFile');
    const upload = document.getElementById('upload');
    const showocrtext = document.createElement('p');
    const report = document.getElementById('report');
    const cancel = document.getElementById('cancel');
    const customButton = document.getElementById('customFileButton');
    const fileNameDisplay = document.getElementById('fileName');
    let prediction = '';
    let confidence = '';
    let type = '';
    let spam_input = '';
    let ocrtext = '';
    let currentMessage = '';
    async function process_img() {
       const file = img.files[0];
       if(!file) {
        alert('Please input an image before submitting');
        return;
       }
       const formData = new FormData();
       formData.append('image', file)
       try {
        const response = await fetch('/predict/convert', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        ocrtext = data.text || 'No text detected.';
        showocrtext.textContent=ocrtext;
       }
       catch (error){
        console.error(error);
        alert('Error Submitting Form');
       }
    }
    async function detect(message) {
        let textToSend = typeof message === 'string' ? message : message.value;
        currentMessage = textToSend;
        try {
            const response = await fetch('/predict/detect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({text: textToSend})
            });
            const data = await response.json();
            text.textContent = `Prediction: ${data.prediction}, Confidence: ${(data.confidence*100).toFixed(2)}%, Spam Type: ${data.type}`;
            prediction = data.prediction;
            confidence = `${(data.confidence*100).toFixed(2)}%`;
            type = data.type;
            const word_contributions = data.word_contributions;
            let words = textToSend.split(/[\s\-\/,;:.!?()]+/);
            console.log(words)
            let highlightedText = words.map(word => {
                let cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
                console.log(`Original: "${word}", Clean: "${cleanWord}", Has contribution: ${!!word_contributions[cleanWord]}, Value: ${word_contributions[cleanWord]}`);
                if(word_contributions[cleanWord] && word_contributions[cleanWord] > 0) {
                    return `<span style="background-color: yellow">${cleanWord}</span>`;
                }
                else {
                    return word;
                }
            }).join(' ');
            shapped.innerHTML = highlightedText;
            if (prediction == 'ham') {
                reset();
                return;
            }
            if (prediction == 'spam') {
                report.style.display = 'block';
                cancel.style.display = 'block';
            }
        }
        catch (error){
            console.error(error);
            alert('Error Submitting Form');
        }
        textToSend = '';
    }
    function reset() {
        spam.value = null;
        text.textContent = '';
        spam_input = '';
        ocrtext = '';
        img.value = null;
        report.style.display = 'none';
        cancel.style.display = 'none';
        prediction = '';
        confidence = '';
        type = '';
        currentMessage = '';

    }
    button.addEventListener('click', function() {
    detect(spam);
    });
    customButton.addEventListener('click', () => {
    img.click();
});
    img.addEventListener('change',function() {
     if (img.files.length > 0) {
        fileNameDisplay.textContent = img.files[0].name;
    } else {
        fileNameDisplay.textContent = 'No file chosen';
    }
    showocrtext.textContent = '';
    shapped.textContent = '';
    process_img();
    });
    upload.addEventListener('click', function() {
    if (ocrtext == '') {
        alert('Please upload a valid image')
    }
    else {
    detect(ocrtext);
    }
    });
    report.addEventListener('click', async() => {
       let textToReport = currentMessage;
        if (!textToReport) {
            alert('No message to report!');
            return;
        }
       try {
        await addDoc(collection(db, "reports"),{
            message: textToReport,
            prediction: prediction,
            confidence: confidence,
            type: type,
            timestamp: new Date().toISOString()

        });
        alert('Reported Successfully!');
        reset();
       }
       catch (error){
        alert('Error reporting message');
        console.error('Error reporting message', error);
        reset();
       }
    });
    cancel.addEventListener('click', function() {
        reset();
    });
    document.body.appendChild(text);
    document.body.appendChild(shapped);
    document.body.appendChild(showocrtext);
});