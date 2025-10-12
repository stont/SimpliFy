let summarizer;

function handleSwitchView(index) {
    if (Number(index) === 0) {
        document.getElementById('homePage').style.display = 'block';
        document.getElementById('settingsPage').style.display = 'none';
        document.getElementById('homeBtn').classList.add('text-[#13a4ec]');
        document.getElementById('homeBtn').classList.remove('text-[#5b6b75]', 'dark:text-[#a1b1bd]');
        document.getElementById('settingsBtn').classList.remove('text-[#13a4ec]');
        document.getElementById('settingsBtn').classList.add('text-[#5b6b75]', 'dark:text-[#a1b1bd]');
    } else {
        document.getElementById('homePage').style.display = 'none';
        document.getElementById('settingsPage').style.display = 'block';
        document.getElementById('settingsBtn').classList.add('text-[#13a4ec]');
        document.getElementById('settingsBtn').classList.remove('text-[#5b6b75]', 'dark:text-[#a1b1bd]');
        document.getElementById('homeBtn').classList.remove('text-[#13a4ec]');
        document.getElementById('homeBtn').classList.add('text-[#5b6b75]', 'dark:text-[#a1b1bd]');
    }
}

async function generateSummary(text, options) {
    try {
        const availability = await Summarizer.availability();
        if (availability === 'unavailable') {
            console.log('Summarizer API is not available')
        }
        if (availability === 'available') {
            summarizer = await Summarizer.create(options);
        }
        else {
            summarizer = await Summarizer.create(options);
            if (typeof summarizer.addEventListener === 'function') {
                summarizer.addEventListener('downloadprogress', (e) => {
                    console.log(`Downloaded ${e.loaded * 100}%`);
                });
            }
            if (summarizer.ready) {
                await summarizer.ready;
            }
        }
        const summary = await summarizer.summarize(text);
        summarizer.destroy();
        return summary;
    } catch (e) {
        console.log('Summary generation failed');
        console.error(e);
        return 'Error: ' + e.message;
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const homebtn = document.getElementById('homeBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const backButton = document.getElementById('backBtn');

    if (backButton) {
        backButton.onclick = function () {
            // Clear navigation storage before navigating back
            localStorage.removeItem('accessibilityCondition');
            window.location.href = '../onboard/index.html';
        };
    }
    if (homebtn) {
        homebtn.onclick = function () {
            handleSwitchView(0);
        };
    }
    if (settingsBtn) {
        settingsBtn.onclick = function () {
            handleSwitchView(1);
        };
    }

    // Subscriber
    chrome.runtime.onMessage.addListener(async function (request) {
        if (request.action === 'summarize-text') {
            const text = request.text;
            console.log('Received text for summarization:', text);

            const options = {
                sharedContext: 'this is a website',
                type: 'tldr',
                length: 'medium'
            };

            generateSummary(text, options).then((summary) => {
                console.log('Generated summary:', summary);

                // const selection = window.getSelection();
                // console.log('Current selection range count:', selection.rangeCount);
                // if (!selection.rangeCount) return;

                // const range = selection.getRangeAt(0);
                // range.deleteContents();
                // range.insertNode(document.createTextNode(summary));

                // Send message to background, which will relay to content script in active tab
                chrome.runtime.sendMessage({
                    action: 'update-dom-text',
                    text: summary
                });
            })
        }
    });
});