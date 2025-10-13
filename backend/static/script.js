    const spam = document.getElementById('spam-input');
    const text = document.createElement('p');
    const button = document.getElementById('detect');
    const shapped = document.createElement('p');
    async function submit() {
        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({text: spam.value})
            });
            const data = await response.json();
            text.textContent = `Prediction: ${data.prediction}, Confidence: ${(data.confidence*100).toFixed(2)}%, Spam Type: ${data.type}`;
            const word_contributions = data.word_contributions;
            let words = spam.value.split(' ');
            let highlightedText = words.map(word => {
                if(word_contributions[word]>0 && word_contributions[word]<0.5) {
                    return `<span style="background-color: yellow">${word}</span>`;
                }
                else if(word_contributions[word]>0.5) {
                    return `<span style="background-color: red">${word}</span>`;
                }
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
        spam.value = '';
    }
    button.addEventListener('click', function() {
    submit();
    });

    document.body.appendChild(text);
    document.body.appendChild(shapped);