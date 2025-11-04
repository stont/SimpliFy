// Listen for messages from the extension and forward to page (MAIN world)

chrome.runtime.onMessage.addListener((message) => {
  console.log('[BRIDGE] Received runtime message:', message);
  if (message.type === 'retry-ai-queue') {
    console.log('[BRIDGE] Forwarding retry-ai-queue to page');
    window.postMessage({ type: 'retry-ai-queue' }, '*');
  }
  if (message.type === 'start-ai-task') {
    // Forward start-ai-task to page
    window.postMessage({ type: 'start-ai-task', requestId: message.requestId }, '*');
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

// Handle AI queue protocol from main-bridge
window.addEventListener('message', async (event) => {
  if (event.data.type === 'request-ai-task') {
    // Forward to background
    const response = await chrome.runtime.sendMessage({ type: 'request-ai-task', requestId: event.data.requestId });
    window.postMessage({ type: 'ai-task-queued', requestId: event.data.requestId, queued: response?.queued }, '*');
  } else if (event.data.type === 'ai-task-complete') {
    await chrome.runtime.sendMessage({ type: 'ai-task-complete', requestId: event.data.requestId });
    window.postMessage({ type: 'ai-task-finished', requestId: event.data.requestId }, '*');
  } else if (event.data.type === "from-main-bridge") {
    console.log('[BRIDGE] Forwarding message to background:', event.data.message);
    // Forward to background
    chrome.runtime.sendMessage({ type: "from-main-bridge", data: event.data.message })
  } else if (event.data.type === "SPACE_BAR_CLICKED") {
    console.log('[BRIDGE] Forwarding SPACE_BAR_CLICKED to background');
    // Forward to background
    chrome.runtime.sendMessage({ type: "SPACE_BAR_CLICKED" })

  } else if (event.data.type === "STOP_TTS") {
    console.log('[BRIDGE] Forwarding STOP_TTS to background');
    // Forward to background
    chrome.runtime.sendMessage({ type: "STOP_TTS" })
  }
});

// On load, send current settings to main-bridge
chrome.storage.local.get(['autismSimplificationLevel', 'autismDisableAnimations', 'autismBlockBadWords', 'autismAutomaticSimplification', 'enableVoiceCommandReading', 'shouldAutoReadPage'], (result) => {
  window.postMessage({ type: 'settings-init', data: result }, '*');
});

// Listen for storage changes and send updates to main-bridge
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    console.log('Changes:: ', changes)
    const updatedSettings = {};
    if (changes.autismSimplificationLevel) updatedSettings.autismSimplificationLevel = changes.autismSimplificationLevel.newValue;
    if (changes.autismDisableAnimations) updatedSettings.autismDisableAnimations = changes.autismDisableAnimations.newValue;
    if (changes.autismBlockBadWords) updatedSettings.autismBlockBadWords = changes.autismBlockBadWords.newValue;
    if (changes.autismAutomaticSimplification) updatedSettings.autismAutomaticSimplification = changes.autismAutomaticSimplification.newValue;
    if (changes.shouldAutoReadPage) updatedSettings.shouldAutoReadPage = changes.shouldAutoReadPage.newValue;
    if (changes.enableVoiceCommandReading) updatedSettings.enableVoiceCommandReading = changes.enableVoiceCommandReading.newValue;
    if (Object.keys(updatedSettings).length > 0) {
      window.postMessage({ type: 'settings-update', data: updatedSettings }, '*');
    }
  }
});
