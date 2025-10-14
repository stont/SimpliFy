// Handles autism settings form

// Logic for the clear cache button
const clearBtn = document.getElementById('clearCacheBtn');
const msg = document.getElementById('clearCacheMsg');
if (clearBtn) {
  clearBtn.addEventListener('click', function() {
    localStorage.clear();
    if (msg) {
      msg.textContent = 'Local cache cleared.';
      msg.style.display = 'block';
      setTimeout(() => { msg.style.display = 'none'; }, 2000);
    }
    // Notify content script to clear cache in main world
   sendClearStorage();
  });
}

// Use the correct IDs from the HTML
const simplificationSlider = document.getElementById('simplifyLevel');
const simplificationValue = document.getElementById('simplifyLevelValue');

function getSimplificationLabel(val) {
  if (val == 0) return '0 (No Change)';
  if (val >= 10 && val <= 40) return val + ' (Slightly Simple)';
  if (val == 50) return '50 (Medium)';
  if (val >= 60) return val + ' (Super Simple)';
  return val;
}

function initializeSimplificationSlider() {
  if (simplificationSlider && simplificationValue) {
    const saved = getSimplificationLevel();
    if (saved !== null) {
      simplificationSlider.value = saved;
      simplificationValue.textContent = getSimplificationLabel(Number(saved));
    } else {
      simplificationSlider.value = 50;
      simplificationValue.textContent = getSimplificationLabel(50);
    }
  }
}

if (simplificationSlider && simplificationValue) {
  initializeSimplificationSlider();
  // Only send on slider change, not on load
  simplificationSlider.addEventListener('input', function() {
    simplificationValue.textContent = getSimplificationLabel(Number(this.value));
    localStorage.setItem('autismSimplificationLevel', this.value);
    // Send message to content script to update simplify level
    sendSimplificationLevel();
  });
}

// Listen for settings page being shown and re-initialize slider/label
const settingsBtn = document.getElementById('settingsBtn');
const settingsPage = document.getElementById('settingsPage');
if (settingsBtn && settingsPage) {
  settingsBtn.addEventListener('click', function() {
    initializeSimplificationSlider();
  });
}

// Helper to get current simplification level
function getSimplificationLevel() {
  return Number(localStorage.getItem('autismSimplificationLevel') || 50);
}

// On page load, auto-send
window.addEventListener('DOMContentLoaded', sendSimplificationLevel);

function sendSimplificationLevel() {
  const level = getSimplificationLevel();
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        data: {
          type: 'autism-simplify-panel',
          simplifyLevel: level
        }
      });
    }
  });
}

function sendClearStorage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        data: {
          type: 'autism-simplify-panel',
          clearCache: true
        }
      });
    }
  });
}