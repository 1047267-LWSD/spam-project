import { addDoc, collection } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db } from './firebase-config.js';
    document.addEventListener('DOMContentLoaded', () => {   
    const spam = document.getElementById('spam-input');
    const button = document.getElementById('check');
    const shapped = document.createElement('p');
    const img = document.getElementById('myFile');
    const upload = document.getElementById('upload');
    const report = document.getElementById('report');
    const cancel = document.getElementById('cancel');
    const customButton = document.getElementById('customFileButton');
    const fileNameDisplay = document.getElementById('fileName');
    const ocrBtn = document.getElementById('ocr-button');
    const txtBtn = document.getElementById('text-button');
    const ocrForm = document.getElementById('ocr-form');
    const txtForm = document.getElementById('text-form');
    const resultsContainer = document.getElementById('results-container');
    const predicted = document.createElement('h2');
    const confident = document.createElement('h3');
    const category = document.createElement('h3');
    const confcat = document.createElement('div');
    const results = document.createElement('div');
    const analysisdescription = document.createElement('h3');
    const key = document.createElement('p');
    key.setAttribute('id','key');
    key.innerHTML = "<span style = 'background-color: yellow'>highlighted words</span> are classified as suspicious";
    analysisdescription.textContent = "Suspicious words in your message";
    const analyzed = document.createElement('div');
    analyzed.appendChild(analysisdescription);
    analyzed.setAttribute('id','analyzed');
    analyzed.style.display = 'none';
    results.setAttribute('id', 'result');
    confcat.setAttribute('id','confcat');
    shapped.setAttribute('id', 'shapped');
    confcat.appendChild(confident);
    confcat.appendChild(category);
    results.appendChild(predicted);
    results.appendChild(confcat);
    ocrForm.style.display = 'none';
    txtForm.style.display = 'none';
    
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
            predicted.textContent = 'Prediction: ' + data.prediction;
            confident.textContent = 'Confidence: ' + (data.confidence*100).toFixed(0) + "%";
            category.textContent = 'Type: ' + data.type;
            resultsContainer.style.display='flex';
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
            analyzed.style.display = 'flex';
            analyzed.appendChild(shapped);
            analyzed.appendChild(key);
            if (prediction == 'ham') {
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
        spam_input = '';
        ocrtext = '';
        img.value = null;
        report.style.display = 'none';
        cancel.style.display = 'none';
        resultsContainer.style.display = 'none';
        prediction = '';
        confidence = '';
        type = '';
        confident.textContent = '';
        predicted.textContent = '';
        category.textContent = '';
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
    shapped.textContent = '';
    process_img();
    });
    upload.addEventListener('click', function() {
    if (ocrtext == '') {
        alert('Please upload a valid image')
    }
    else {
    detect(ocrtext);
    resultsContainer.style.display = 'flex';
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
    ocrBtn.addEventListener('click', function(){
        ocrForm.style.display = 'flex';
        txtForm.style.display = 'none';
        reset();
    });
    txtBtn.addEventListener('click', function(){
        txtForm.style.display = 'flex';
        ocrForm.style.display = 'none';
        reset();
    });
    resultsContainer.appendChild(results);
    resultsContainer.appendChild(analyzed);
});