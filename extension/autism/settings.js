// Handles autism settings form

// Logic for the clear cache button
const clearBtn = document.getElementById('clearCacheBtn');
const msg = document.getElementById('clearCacheMsg');
if (clearBtn) {
  clearBtn.addEventListener('click', async function() {
    await chrome.storage.local.clear();
    await initializeSettings();
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
const disableAnimationsCheckbox = document.getElementById('disableAnimations');
const blockBadWordsCheckbox = document.getElementById('blockBadWords');
const automaticSimplificationCheckbox = document.getElementById('automaticSimplification');

function getSimplificationLabel(val) {
  val = Number(val);
  if (val === 0) return '0 (No Change)';
  if (val > 0 && val < 50) return val + ' (Slight Simplified)';
  if (val === 50) return '50 (Medium)';
  if (val > 50 && val < 100) return val + ' (Strongly Simplified)';
  if (val >= 100) return val + ' (Max Simplified)';
}

// Initialize settings from chrome.storage.local to form elements
async function initializeSettings() {
  const result = await chrome.storage.local.get(['autismSimplificationLevel', 'autismDisableAnimations', 'autismBlockBadWords', 'autismAutomaticSimplification']);
  // Simplification Level
  const savedLevel = result.autismSimplificationLevel;
  if (savedLevel !== undefined) {
    simplificationSlider.value = savedLevel;
    simplificationValue.textContent = getSimplificationLabel(Number(savedLevel));
  } else {
    simplificationSlider.value = 50;
    simplificationValue.textContent = getSimplificationLabel(50);
  }
  // Disable Animations
  const savedDisable = result.autismDisableAnimations;
  disableAnimationsCheckbox.checked = savedDisable !== undefined ? savedDisable : false;
  // Block Bad Words
  const savedBlock = result.autismBlockBadWords;
  blockBadWordsCheckbox.checked = savedBlock !== undefined ? savedBlock : false;
  // Automatic Simplification
  const savedAuto = result.autismAutomaticSimplification;
  automaticSimplificationCheckbox.checked = savedAuto !== undefined ? savedAuto : false;
}

if (simplificationSlider && simplificationValue) {
  initializeSettings();
  // Only send on slider change, not on load
  simplificationSlider.addEventListener('input', function() {
    simplificationValue.textContent = getSimplificationLabel(Number(this.value));
    chrome.storage.local.set({ 'autismSimplificationLevel': this.value });
  });
}
if (disableAnimationsCheckbox) {
  disableAnimationsCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ 'autismDisableAnimations': this.checked });
  });
}
if (blockBadWordsCheckbox) {
  blockBadWordsCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ 'autismBlockBadWords': this.checked });
  });
}
if (automaticSimplificationCheckbox) {
  automaticSimplificationCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ 'autismAutomaticSimplification': this.checked });
  });
}

// Listen for settings page being shown and re-initialize slider/label
const settingsBtn = document.getElementById('settingsBtn');
const settingsPage = document.getElementById('settingsPage');
if (settingsBtn && settingsPage) {
  settingsBtn.addEventListener('click', function() {
    initializeSettings();
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