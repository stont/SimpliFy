// Listen for messages from the extension and forward to page (MAIN world)
chrome.runtime.onMessage.addListener((message) => {
  window.postMessage({ type: 'autism-simplify-panel', ...message.data }, '*');
});

// On load, send current settings to main-bridge
chrome.storage.local.get(['autismSimplificationLevel', 'autismDisableAnimations', 'autismBlockBadWords', 'autismAutomaticSimplification'], (result) => {
  window.postMessage({ type: 'autism-settings-init', data: result }, '*');
});

// Listen for storage changes and send updates to main-bridge
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    const updated = {};
    if (changes.autismSimplificationLevel) updated.autismSimplificationLevel = changes.autismSimplificationLevel.newValue;
    if (changes.autismDisableAnimations) updated.autismDisableAnimations = changes.autismDisableAnimations.newValue;
    if (changes.autismBlockBadWords) updated.autismBlockBadWords = changes.autismBlockBadWords.newValue;
    if (changes.autismAutomaticSimplification) updated.autismAutomaticSimplification = changes.autismAutomaticSimplification.newValue;
    if (Object.keys(updated).length > 0) {
      window.postMessage({ type: 'autism-settings-update', data: updated }, '*');
    }
  }
});