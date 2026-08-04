import { addDoc, collection } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const spam = document.getElementById('spam-input');
    const button = document.getElementById('check');
    const shapped = document.createElement('p');
    const img = document.getElementById('myFile');
    const upload = document.getElementById('upload');
    const customButton = document.getElementById('customFileButton');
    const fileNameDisplay = document.getElementById('fileName');
    const txtBtn = document.getElementById('text-button');
    const ocrForm = document.getElementById('ocr-form');
    const txtForm = document.getElementById('text-form');
    const resultsContainer = document.getElementById('results-container');
    const description = document.getElementById('spam-description');

    // Only logistic regression is offered, so the endpoint is fixed.
    const path = '/predict/detect';
    const MODEL_NAME = 'logistic_regression';

    // ── Action buttons (created here since the result card is rebuilt each run) ──
    const report = document.createElement('button');
    report.id = 'report';
    report.textContent = 'Report to Forum';
    report.style.display = 'none';

    const cancel = document.createElement('button');
    cancel.id = 'cancel';
    cancel.textContent = 'Cancel';
    cancel.style.display = 'none';

    const incorrect = document.createElement('button');
    incorrect.id = 'incorrect';
    incorrect.textContent = 'I think the model predicted incorrectly';
    incorrect.style.display = 'none';

    const resultActions = document.createElement('div');
    resultActions.className = 'result-actions';
    resultActions.appendChild(report);
    resultActions.appendChild(cancel);
    resultActions.appendChild(incorrect);

    // ── Progress circle ──
    const CIRCUMFERENCE = 2 * Math.PI * 70;

    const circleWrap = document.createElement('div');
    circleWrap.className = 'verdict-circle-wrap';
    circleWrap.innerHTML = `
        <svg class="verdict-circle" viewBox="0 0 160 160">
            <circle class="circle-bg" cx="80" cy="80" r="70"></circle>
            <circle class="circle-progress" id="circle-progress" cx="80" cy="80" r="70"
                stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${CIRCUMFERENCE}"></circle>
        </svg>
        <div class="circle-content">
            <div class="circle-verdict" id="circle-verdict"></div>
            <div class="circle-percent" id="circle-percent"></div>
        </div>
    `;
    const circleProgress = circleWrap.querySelector('#circle-progress');
    const circleVerdictEl = circleWrap.querySelector('#circle-verdict');
    const circlePercentEl = circleWrap.querySelector('#circle-percent');

    const categoryPill = document.createElement('div');
    categoryPill.className = 'category-pill';

    const resultCard = document.createElement('div');
    resultCard.className = 'card result-card';
    resultCard.id = 'result';
    resultCard.appendChild(circleWrap);
    resultCard.appendChild(categoryPill);
    resultCard.appendChild(resultActions);

    // ── Highlighted-message analysis card ──
    const analyzed = document.createElement('div');
    analyzed.id = 'analyzed';
    const analysisTitle = document.createElement('h3');
    analysisTitle.textContent = 'Suspicious words in your message';
    const key = document.createElement('p');
    key.id = 'key';
    key.innerHTML = '<span style="background-color: rgba(239,68,68,0.6); border-radius: 3px; padding: 0 2px;">Darker red</span> means the model weighed that word more heavily as a scam signal.';
    analyzed.appendChild(analysisTitle);
    analyzed.appendChild(shapped);
    analyzed.appendChild(key);

    resultsContainer.appendChild(resultCard);
    resultsContainer.appendChild(analyzed);
    resultsContainer.appendChild(description);

    ocrForm.style.display = 'none';
    txtForm.style.display = 'flex';

    let prediction = '';
    let confidence = '';
    let type = '';
    let ocrtext = '';
    let currentMessage = '';

    // ── Expanded, per-category explanations ──
    const categoryInfo = {
        personal: {
            icon: '👤',
            label: 'Personal / Social',
            summary: 'This message shows the hallmarks of a personal-contact scam — someone building an unearned personal connection, offering vague "opportunities," or reaching out inappropriately.',
            signs: [
                'An unfamiliar person initiating personal or romantic contact out of nowhere',
                'Unsolicited job offers or "opportunities" with vague, unverifiable details',
                'Pressure to move the conversation to another app or platform quickly',
                'Requests to share personal details early, before any real relationship exists'
            ]
        },
        lottery: {
            icon: '🎉',
            label: 'Lottery / Prize',
            summary: 'This message shows the hallmarks of a prize or lottery scam, designed to get you excited enough to hand over money or personal information.',
            signs: [
                'Claims that you\'ve won money, a prize, or a reward you never entered for',
                'A "processing fee" or personal info required to "claim" the prize',
                'A tight deadline meant to rush you into acting before thinking it through',
                'Contact from a competition or lottery you don\'t actually recognize'
            ]
        },
        service: {
            icon: '🛠️',
            label: 'Service / Company Impersonation',
            summary: 'This message impersonates a company or service, usually to extract sensitive information or a payment under the guise of routine account activity.',
            signs: [
                'A "company" asking you to verify an account, password, or payment info by text',
                'Fake delivery, billing, or subscription notices demanding urgent action',
                'A link to "log in" or "resolve an issue" rather than the company\'s real site',
                'Small inconsistencies in company name, formatting, or tone versus the real thing'
            ]
        },
        'fake-message': {
            icon: '☎️',
            label: 'Premium Rate / Callback',
            summary: 'This message is a premium-rate callback scam — it wants you to call or reply to a number that quietly charges you per minute or per message.',
            signs: [
                'Vague "you have new messages" or "matches" bait with no real context',
                'A phone number you\'re told to call back to "retrieve" something',
                'Charging notices tucked into fine print (e.g. cost-per-minute wording)',
                'Generic, mass-blasted phrasing rather than anything personalized to you'
            ]
        }
    };

    function renderDescription(spamType) {
        description.innerHTML = '';
        const info = categoryInfo[spamType];
        if (!info) {
            description.style.display = 'none';
            return;
        }

        const headerRow = document.createElement('div');
        headerRow.className = 'description-header';
        headerRow.innerHTML = `<span class="description-icon">${info.icon}</span><span class="description-label">${info.label}</span>`;

        const summary = document.createElement('p');
        summary.textContent = info.summary;

        const list = document.createElement('ul');
        info.signs.forEach(sign => {
            const li = document.createElement('li');
            li.textContent = sign;
            list.appendChild(li);
        });

        description.appendChild(headerRow);
        description.appendChild(summary);
        description.appendChild(list);
        description.style.display = 'flex';
    }

    function renderVerdictCircle(percent, isSafe) {
        const clamped = Math.max(0, Math.min(100, percent));
        const offset = CIRCUMFERENCE * (1 - clamped / 100);
        circleProgress.style.strokeDasharray = CIRCUMFERENCE;
        circleProgress.style.strokeDashoffset = offset;
        circleProgress.style.stroke = isSafe ? 'var(--primary)' : 'var(--danger)';
        circlePercentEl.textContent = clamped.toFixed(0) + '%';
    }

    async function process_img() {
        const file = img.files[0];
        if (!file) {
            alert('Please input an image before submitting');
            return;
        }
        const formData = new FormData();
        formData.append('image', file);
        try {
            const response = await fetch('/predict/convert', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (!data.word_contributions) {
                console.error("No word_contributions in response:", data);
                return;
            }
            ocrtext = data.text || 'No text detected.';
        }
        catch (error) {
            console.error(error);
            alert('Error Submitting Form');
        }
    }

    async function detect(message) {
        let textToSend = typeof message === 'string' ? message : message.value;
        currentMessage = textToSend;
        try {
            const response = await fetch(path, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: textToSend })
            });
            const data = await response.json();

            const isSafe = data.prediction !== 'spam' && data.prediction !== 'smishing';
            let verdictLabel = 'SAFE';
            if (data.prediction === 'smishing') verdictLabel = 'SCAM';
            else if (data.prediction === 'spam') verdictLabel = 'SPAM';

            circleVerdictEl.textContent = verdictLabel;
            circleVerdictEl.style.color = isSafe ? 'var(--primary)' : 'var(--danger)';
            renderVerdictCircle((data.confidence * 100), isSafe);

            if (!isSafe && data.type) {
                const label = data.type === 'fake-message' ? 'premium rate' : data.type;
                categoryPill.textContent = 'Type: ' + label;
                categoryPill.style.display = 'inline-block';
            } else {
                categoryPill.style.display = 'none';
            }

            resultsContainer.style.display = 'flex';
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });

            prediction = data.prediction;
            confidence = `${(data.confidence * 100).toFixed(2)}%`;
            type = data.type;

            // ── Gradient SHAP highlighting ──
            const word_contributions = data.word_contributions || {};
            const positiveValues = Object.values(word_contributions).filter(v => v > 0);
            const maxContribution = positiveValues.length ? Math.max(...positiveValues) : 0;
            const threshold = maxContribution * 0.1;
            let words = textToSend.split(/[\s\-–—\/,;:.!?()]+/);
            const stopWords = new Set(['to', 'is', 'or', 'be', 'you', 'the', 'a', 'an', 'and', 'of', 'in',
                'it', 'for', 'on', 'we', 'i', 'this', 'that', 'your', 'my', 'are', 'was', 'if', 'no', 'not',
                'so', 'do', 're', 'am', 'as', 'at', 'by', 'from', 'with', 'our']);

            let highlightedText = words.map(word => {
                let cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
                const contribution = word_contributions[cleanWord];
                if (contribution && contribution > threshold && !stopWords.has(cleanWord)) {
                    const intensity = maxContribution > 0 ? Math.min(contribution / maxContribution, 1) : 0;
                    const alpha = (0.15 + intensity * 0.65).toFixed(2);
                    return `<span style="background-color: rgba(239, 68, 68, ${alpha}); border-radius: 3px; padding: 0 2px;">${word}</span>`;
                }
                return word;
            }).join(' ');
            shapped.innerHTML = highlightedText;
            analyzed.style.display = 'flex';

            if (!isSafe) {
                renderDescription(data.type);
            } else {
                description.style.display = 'none';
            }

            if (prediction == 'ham') {
                incorrect.style.display = 'block';
                cancel.style.display = 'block';
                report.style.display = 'none';
            }
            if (prediction == 'spam' || prediction == 'smishing') {
                incorrect.style.display = 'block';
                report.style.display = 'block';
                cancel.style.display = 'block';
            }
        }
        catch (error) {
            console.error(error);
            alert('Error Submitting Form' + error.message);
        }
        setTimeout(() => {
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 500);
    }

    function reset() {
        spam.value = '';
        ocrtext = '';
        img.value = null;
        report.style.display = 'none';
        cancel.style.display = 'none';
        incorrect.style.display = 'none';
        resultsContainer.style.display = 'none';
        description.style.display = 'none';
        analyzed.style.display = 'none';
        prediction = '';
        confidence = '';
        type = '';
        circleVerdictEl.textContent = '';
        circlePercentEl.textContent = '';
        categoryPill.style.display = 'none';
        currentMessage = '';
    }

    incorrect.addEventListener('click', async function () {
        let storeText = currentMessage;
        let correctMessage = '';
        if (prediction == 'ham') {
            correctMessage = 'spam or smishing';
        } else {
            correctMessage = 'ham';
        }
        await addDoc(collection(db, 'incorrect-messages'), {
            message: storeText,
            prediction: prediction,
            correct: correctMessage,
            model: MODEL_NAME
        });
        alert('Thank you for your feedback!');
    });

    button.addEventListener('click', async function () {
        await detect(spam);
        let storeText = spam.value;

        await addDoc(collection(db, "spam-messages"), {
            message: storeText,
            prediction: prediction,
            model: MODEL_NAME
        });
    });

    customButton.addEventListener('click', () => {
        reset();
        img.click();
    });

    img.addEventListener('change', function () {
        if (img.files.length > 0) {
            fileNameDisplay.textContent = img.files[0].name;
        } else {
            fileNameDisplay.textContent = 'No file chosen';
        }
        shapped.textContent = '';
        process_img();
    });

    upload.addEventListener('click', async function () {
        if (ocrtext == '') {
            alert('Please upload a valid image');
        } else {
            await detect(ocrtext);
            resultsContainer.style.display = 'flex';
            let storeText = ocrtext;

            await addDoc(collection(db, "spam-mesages"), {
                message: storeText,
                prediction: prediction,
            });
        }
    });

    report.addEventListener('click', async () => {
        let textToReport = currentMessage;
        if (!textToReport) {
            alert('No message to report!');
            return;
        }
        try {
            await addDoc(collection(db, "reports"), {
                message: textToReport,
                prediction: prediction,
                confidence: confidence,
                type: type,
                timestamp: new Date().toISOString(),
                upvotes: 0,
                downvotes: 0
            });
            alert('Reported Successfully!');
            reset();
        }
        catch (error) {
            alert('Error reporting message' + error.message);
            console.error('Error reporting message', error);
            reset();
        }
    });

    cancel.addEventListener('click', function () {
        reset();
    });

    txtBtn.addEventListener('click', function () {
        txtForm.style.display = 'flex';
        txtForm.scrollIntoView({ behavior: 'smooth', block: 'end' });
        ocrForm.style.display = 'none';
        reset();
    });
});