// Listen for messages from the extension and forward to page (MAIN world)

chrome.runtime.onMessage.addListener((message) => {
  console.log('[BRIDGE] Received runtime message:', message);
  if (message.type === 'retry-ai-queue') {
    console.log('[BRIDGE] Forwarding retry-ai-queue to page');
    window.postMessage({ type: 'retry-ai-queue' }, '*');
  }
  if (message.action === 'summarize-text') {
    console.log('[BRIDGE] Forwarding summarize-text to page, text length:', message.text?.length);
    console.log('[BRIDGE] Forwarding summarize-text to page, text length:', message.text?.length);
    window.postMessage({ type: 'summarize-text', text: message.text }, '*');
  }
  if (message.action === 'simplify-text') {
    console.log('[BRIDGE] Forwarding simplify-text to page, text length:', message.text?.length);
    window.postMessage({ type: 'simplify-text', text: message.text }, '*');
  }
  window.postMessage({ type: 'autism-simplify-panel', ...message.data }, '*');
});

// Handle AI permission requests from main-bridge
window.addEventListener('message', async (event) => {
  if (event.data.type === 'request-ai-permission') {
    const response = await chrome.runtime.sendMessage({ type: 'request-ai-permission' });
    window.postMessage({ type: 'ai-permission-response', granted: response.granted, id: event.data.id }, '*');
  } else if (event.data.type === 'release-ai-permission') {
    await chrome.runtime.sendMessage({ type: 'release-ai-permission' });
    window.postMessage({ type: 'ai-permission-released', id: event.data.id }, '*');
  }
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