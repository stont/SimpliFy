let summarizer;

// Tab navigation logic (W3Schools pattern, CSP-compliant)
function openTab(evt, tabId) {
  const tabcontent = document.getElementsByClassName('tab-content');
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].classList.remove('active');
    tabcontent[i].style.display = 'none';
  }
  const tablinks = document.getElementsByClassName('tab-btn');
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove('active');
  }
  document.getElementById(tabId).classList.add('active');
  document.getElementById(tabId).style.display = '';
  evt.currentTarget.classList.add('active');
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

    // Remove old view switching logic
    // Add tab logic like auditory.js
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', function(evt) {
        openTab(evt, btn.getAttribute('data-tab'));
      });
    });
    // Set initial active tab (default to Home)
    document.querySelector('.tab-btn[data-tab="tab-home"]').classList.add('active');
    document.getElementById('tab-home').classList.add('active');
    document.getElementById('tab-home').style.display = '';
    document.getElementById('tab-settings').classList.remove('active');
    document.getElementById('tab-settings').style.display = 'none';

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

            const summary = await generateSummary(text, options)
            console.log('Generated summary:', summary);

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                console.log('The tab: ', tabs);
                if (tabs && tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { data: { type: 'summary-panel', message: summary } });
                }
            });
        }
    });
});