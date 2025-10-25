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

function handleSwitchView(index) {
    if (Number(index) === 0) {
        document.getElementById('homePage').style.display = 'block';
        document.getElementById('settingsPage').style.display = 'none';
        document.getElementById('homeBtn').classList.add('text-[#13a4ec]');
        document.getElementById('homeBtn').classList.remove('text-[#5b6b75]');
        document.getElementById('settingsBtn').classList.remove('text-[#13a4ec]');
        document.getElementById('settingsBtn').classList.add('text-[#5b6b75]');
    } else {
        document.getElementById('homePage').style.display = 'none';
        document.getElementById('settingsPage').style.display = 'block';
        document.getElementById('settingsBtn').classList.add('text-[#13a4ec]');
        document.getElementById('settingsBtn').classList.remove('text-[#5b6b75]');
        document.getElementById('homeBtn').classList.remove('text-[#13a4ec]');
        document.getElementById('homeBtn').classList.add('text-[#5b6b75]');
    }
}

async function CheckAiAvailability(params) {

  if (!'Summarizer' in self && !'Rewriter' in self) {
    //Navigate to extension\autism\setup\setup.html
    window.location.href = 'setup/setup.html';
  }

  //If both exists, check for availability.
  if ('Summarizer' in self && 'Rewriter' in self) {
    // The Summarizer and Rewriter APIs are supported.

    const summerizerAvailability = await Summarizer.availability();
    const rewriterAvailability = await Summarizer.availability();
    //downloading,available,unavailable
    if (summerizerAvailability === 'downloadable' || rewriterAvailability === 'downloadable') {
      window.location.href = 'setup/setup.html';
    }
    
  }
}

document.addEventListener('DOMContentLoaded', function () {

  CheckAiAvailability()

  const homebtn = document.getElementById('homeBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const backButton = document.getElementById('backBtn');
  const backButton2 = document.getElementById('backBtn2');

  if (backButton) {
    backButton.onclick = function () {
      // Clear navigation storage before navigating back
      localStorage.removeItem('accessibilityCondition');
      window.location.href = '../onboard/index.html';
    };
  }
  if (backButton2) {
    backButton2.onclick = function () {
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
    btn.addEventListener('click', function (evt) {
      openTab(evt, btn.getAttribute('data-tab'));
    });
  });
  // Set initial active tab (default to Home)
  document.getElementById('tab-home').classList.add('active');
  document.getElementById('tab-home').style.display = '';
  document.getElementById('tab-settings').classList.remove('active');
  document.getElementById('tab-settings').style.display = 'none';

  // Subscriber
  chrome.runtime.onMessage.addListener(async function (request) {
    // Removed summarize-text and simplify-text handling, now handled in main-bridge.js
  });
});