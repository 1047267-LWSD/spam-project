    document.addEventListener('DOMContentLoaded', () => {
    const spam = document.getElementById('spam-input');
    const text = document.createElement('p');
    const button = document.getElementById('check');
    const shapped = document.createElement('p');
    const img = document.getElementById('myFile');
    const upload = document.getElementById('upload');
    const showocrtext = document.createElement('p');
    let spam_input = '';
    let ocrtext = '';
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
            const word_contributions = data.word_contributions;
            let words = textToSend.split(' ');
            let highlightedText = words.map(word => {
                let cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
                if(word_contributions[cleanWord] && word_contributions[cleanWord] > 0) {
                    return `<span style="background-color: yellow">${cleanWord}</span>`;
                }
                // else if(word_contributions[word]>0.5) {
                //     return `<span style="background-color: red">${word}</span>`;
                // }
                else {
                    return word;
                }
            }).join(' ');
            shapped.innerHTML = highlightedText;
        }
        catch (error){
            console.error(error);
            alert('Error Submitting Form');
        }
        textToSend = '';
    }
    button.addEventListener('click', function() {
    detect(spam);
    });
    img.addEventListener('change',function() {
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

    document.body.appendChild(text);
    document.body.appendChild(shapped);
    document.body.appendChild(showocrtext);
});