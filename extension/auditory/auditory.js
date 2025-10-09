// auditory.js - shared logic for auditory home and settings pages
import { geminiTranscribeFile } from '../shared/gemini.js';

document.addEventListener('DOMContentLoaded', () => {
  // Settings button navigation
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.location.href = 'settings.html';
    });
  }

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
    btn.addEventListener('click', function() {
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


// home.js - logic for auditory home page (index.html)
document.addEventListener('DOMContentLoaded', () => {
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
      if (idx === 0) window.scrollTo({top: 0, behavior: 'smooth'});
      if (idx === 1) window.location.href = 'settings.html';
    });
  });

  // Replace icon placeholders with SVGs
  import('./icons.js').then(({getIcon}) => {
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
    btn.addEventListener('click', function(evt) {
      openTab(evt, btn.getAttribute('data-tab'));
    });
  });

  // Set initial active tab (default to Home)
  document.querySelector('.tab-btn[data-tab="tab-home"]').classList.add('active');
  document.getElementById('tab-home').classList.add('active');
  document.getElementById('tab-scribe').classList.remove('active');
  document.getElementById('tab-settings').classList.remove('active');
});
