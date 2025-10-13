    const spam = document.getElementById('spam-input')
    // const predicted = document.createElement('p')
    const text = document.createElement('p')
    const button = document.getElementById('detect')
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
            text.textContent = `Prediction: ${data.prediction}, Confidence: ${(data.confidence*100).toFixed(2)}%`;
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