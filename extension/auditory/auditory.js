// auditory.js - shared logic for auditory home and settings pages

document.addEventListener('DOMContentLoaded', () => {
  // Settings button navigation
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.location.href = 'settings.html';
    });
  }

  chrome.runtime.onMessage.addListener(async function (request) {
    if (request.action === 'scribe-audio') {
      const text = request.text;
      //show the text in the scribe tab
      const scribeTabBtn = document.querySelector('.tab-btn[data-tab="tab-scribe"]');
      if (scribeTabBtn) scribeTabBtn.click();
      const scribeText = document.getElementById('scribeText');
      if (scribeText) scribeText.textContent = text;
    } else if (request.action === 'scribe-audio-blob') {
      // Reconstruct Blob from ArrayBuffer
      console.log('[Scribe] Received buffer length:', request.buffer ? request.buffer.byteLength : 'none');
      console.log('[Scribe] Received mimeType:', request.mimeType);
      console.log('[Scribe] Received fileName:', request.fileName);
      const blob = new Blob([request.buffer], { type: request.mimeType || 'audio/mpeg' });
      blob.name = request.fileName || 'audio';
      console.log('[Scribe] Blob size:', blob.size, 'type:', blob.type, 'name:', blob.name);
      // Show loading state
      const scribeTabBtn = document.querySelector('.tab-btn[data-tab="tab-scribe"]');
      if (scribeTabBtn) scribeTabBtn.click();
      const scribeText = document.getElementById('scribeText');
      if (scribeText) scribeText.textContent = 'Transcribing...';
      try {
        const transcript = await window.geminiTranscribeFile(blob);
        if (scribeText) scribeText.textContent = transcript;
      } catch (err) {
        if (scribeText) scribeText.textContent = 'Transcription failed: ' + err.message;
      }
    }
  });

  // Home button navigation (for settings page)
  const homeNav = document.querySelector('footer nav a[href$="index.html"]');
  if (homeNav) {
    homeNav.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'index.html';
    });
  }

  // Back button (for settings page)
  if (typeof setupBackButton === 'function') {
    setupBackButton();
  }
});



document.addEventListener('DOMContentLoaded', () => {
  // Material Tabs logic
  const tabs = document.querySelector('md-tabs#auditory-tabs');
  const panels = [
    document.getElementById('tab-home'),
    document.getElementById('tab-settings')
  ];
  if (tabs && panels[0] && panels[1]) {
    tabs.addEventListener('change', (e) => {
      const idx = tabs.activeTabIndex;
      panels.forEach((p, i) => p.classList.toggle('hidden', i !== idx));
    });
    // Show first tab by default
    panels[0].classList.remove('hidden');
    panels[1].classList.add('hidden');
  }

  // Material segmented button logic for settings
  const saved = JSON.parse(localStorage.getItem('auditorySettings') || '{}');
  const defaultSettings = {
    transcribeMedia: 'ondemand',
    filterWords: 'on',
    liveTranscribe: 'on',
  };
  const settings = { ...defaultSettings, ...saved };

  ['transcribeMedia', 'filterWords', 'liveTranscribe'].forEach(setting => {
    const value = settings[setting];
    document.querySelectorAll(`md-outlined-segmented-button[data-setting='${setting}']`).forEach(btn => {
      btn.selected = (btn.dataset.value === value);
    });
  });

  document.querySelectorAll('md-outlined-segmented-button').forEach(btn => {
    btn.addEventListener('click', function () {
      const setting = this.dataset.setting;
      const value = this.dataset.value;
      document.querySelectorAll(`md-outlined-segmented-button[data-setting='${setting}']`).forEach(b => {
        b.selected = false;
      });
      this.selected = true;
      settings[setting] = value;
      localStorage.setItem('auditorySettings', JSON.stringify(settings));
    });
  });

  // Material switch logic (audio alerts)
  const audioSwitch = document.querySelector('md-switch');
  if (audioSwitch) {
    audioSwitch.addEventListener('input', () => {
      localStorage.setItem('audioAlerts', audioSwitch.selected ? 'on' : 'off');
    });
    // Restore state
    const audioAlerts = localStorage.getItem('audioAlerts');
    if (audioAlerts === 'off') audioSwitch.selected = false;
    else audioSwitch.selected = true;
  }
});

// Update Scribe tab indicator when content exists
function updateScribeTabIndicator() {
  const scribeTab = document.querySelector('.tab-btn[data-tab="tab-scribe"]');
  const scribeText = document.getElementById('scribeText');
  const wordCount = document.getElementById('wordCount');

  if (scribeTab) {
    // Check if there's actual content (not just placeholder text)
    const hasContent = scribeText && scribeText.textContent.trim().length > 0 &&
      scribeText.textContent !== "This is where your transcribed text will appear. The area is scrollable and styled for readability." ||
      (wordCount && parseInt(wordCount.textContent) > 0);

    if (hasContent) {
      scribeTab.classList.add('has-content');
    } else {
      scribeTab.classList.remove('has-content');
    }
  }
}

async function checkMicrophonePermission() {
  try {
    // Check current microphone permission state
    const permissionStatus = await navigator.permissions.query({ name: 'microphone' });

    console.log('🎤 Microphone permission state:', permissionStatus.state);

    if (permissionStatus.state === 'granted') {
      console.log('✅ Mic already granted.');
      return 'granted';
    } else if (permissionStatus.state === 'denied') {
      console.warn('🚫 Mic access denied by user.');
      return 'denied';
    } else if (permissionStatus.state === 'prompt') {
      console.log('⚠️ Mic access not yet requested.');
      return 'prompt';
    }
  } catch (err) {
    console.error('Permission API not supported for microphone:', err);
    return 'unknown';
  }
}


// home.js - logic for auditory home page (index.html)
document.addEventListener('DOMContentLoaded', () => {
  const micStatus = checkMicrophonePermission();
  // Option 1: open request-mic.html in a new tab to prompt for permission
  if (micStatus === 'denied' || micStatus === 'prompt') {
    if (window.chrome && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('request-mic.html') });
    } else {
      window.open('request-mic.html', '_blank');
    }
  }

  // Monitor changes to scribe content
  const observer = new MutationObserver(updateScribeTabIndicator);
  const scribeText = document.getElementById('scribeText');
  const wordCount = document.getElementById('wordCount');

  if (scribeText) {
    observer.observe(scribeText, { childList: true, subtree: true, characterData: true });
  }
  if (wordCount) {
    observer.observe(wordCount, { childList: true, characterData: true });
  }

  // Initial check
  updateScribeTabIndicator();

  // Settings button navigation
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.location.href = 'settings.html';
    });
  }

  // Footer nav: Home/Settings
  const navLinks = document.querySelectorAll('footer nav a');
  navLinks.forEach((link, idx) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (idx === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
      if (idx === 1) window.location.href = 'settings.html';
    });
  });

  // Replace icon placeholders with SVGs
  import('./icons.js').then(({ getIcon }) => {
    document.querySelectorAll('[data-icon]').forEach(el => {
      el.innerHTML = getIcon(el.dataset.icon);
    });
  });

  // Tab navigation logic (W3Schools pattern, CSP-compliant)
  function openTab(evt, tabId) {
    const tabcontent = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabcontent.length; i++) {
      tabcontent[i].classList.remove('active');
    }
    const tablinks = document.getElementsByClassName('tab-btn');
    for (let i = 0; i < tablinks.length; i++) {
      tablinks[i].classList.remove('active');
    }
    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
  }

  // Attach event listeners to tab buttons (now includes Scribe)
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function (evt) {
      openTab(evt, btn.getAttribute('data-tab'));
    });
  });

  // Also update when transcript is updated (hook into existing functions if they exist)
  // This ensures compatibility with your existing code
  window.addEventListener('transcriptUpdated', updateScribeTabIndicator);

  // Set initial active tab (default to Home)
  document.querySelector('.tab-btn[data-tab="tab-home"]').classList.add('active');
  document.getElementById('tab-home').classList.add('active');
  document.getElementById('tab-scribe').classList.remove('active');
  document.getElementById('tab-settings').classList.remove('active');
});
