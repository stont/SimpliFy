// Placeholder for background logic (if needed)
// All processing is local/offline

// Global AI permission to prevent concurrent AI operations across tabs
let isAIActive = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message listener', message)
  if (message.type === 'request-ai-permission') {
    if (!isAIActive) {
      isAIActive = true;
      sendResponse({ granted: true });
    } else {
      sendResponse({ granted: false });
    }
  } else if (message.type === 'release-ai-permission') {
    isAIActive = false;
    sendResponse({ ok: true });
  }
  // Existing listeners...
  if (message.action === 'summarize-text') {
    // Handle summarize-text
  }
  if (message.type === 'from-main-bridge') {
    console.log('[BACKGROUND] Received from main-bridge:', message.data);
    // chrome.tts.speak(message.data, { rate: 1.0 });
    const chunks = Array.isArray(message.data) ? message.data : [message.data];
    speakChunks(chunks, { rate: 1.0 });
  }
  if (message.type === 'VOICE_RESUME') {
    chrome.tts.resume();
  }
  if (message.type === 'VOICE_PAUSE') {
    chrome.tts.pause();
  }
});

function speakChunks(chunks, options) {
  // default options
  const voiceName = 'Nate'//options.voiceName || '';
  const rate = options.rate || 1.0;
  const pitch = options.pitch || 1.0;
  const volume = typeof options.volume === 'number' ? options.volume : 1.0;
  console.log("speakChunks called with chunks: ", Array.isArray(chunks), "options:", options);
  if (!Array.isArray(chunks) || chunks.length === 0) return;
  // speak each chunk sequentially using enqueue
  chunks.forEach((chunk, i) => {
    // Ensure chunk is not empty and under API per-utterance limit (32,768)
    const utterance = (chunk || '').slice(0, 32768);
    chrome.tts.speak(utterance, {
      voiceName: voiceName || undefined,
      rate,
      pitch,
      volume,
      enqueue: i > 0
    }, function () {
      if (chrome.runtime.lastError) {
        console.warn('TTS error:', chrome.runtime.lastError.message);
      }
    });
  });
}

// Release AI permission if the active tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  // If AI was active and the tab closed, release the permission
  if (isAIActive) {
    isAIActive = false;
    // Notify other tabs to retry their AI queues immediately
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      if (tab.id !== tabId) { // Don't send to the closed tab
        chrome.tabs.sendMessage(tab.id, { type: 'retry-ai-queue' }).catch(() => { }); // Ignore errors
      }
    });
  }
});

// Enable auto-opening of the side panel when the extension icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));


chrome.runtime.onInstalled.addListener(() => {
  console.log('[BACKGROUND] Creating context menus');
  chrome.contextMenus.create({
    id: 'summarizeText',
    title: 'Generate summary',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'simplifyText',
    title: 'Simplify text',
    contexts: ['selection']
  });
  console.log('[BACKGROUND] Context menus created');
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('[BACKGROUND] Context menu clicked:', info.menuItemId, 'selectionText:', !!info.selectionText, 'tabId:', tab?.id);
  if (!tab || !tab.id) {
    console.error('[BACKGROUND] No valid tab information');
    return;
  }
  if (info.menuItemId === 'summarizeText' && info.selectionText) {
    console.log('[BACKGROUND] Sending summarize-text message with text length:', info.selectionText.length);
    // Relay to content script in the active tab
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'summarize-text',
        text: info.selectionText
      });
      console.log('[BACKGROUND] Message sent successfully');
    } catch (error) {
      console.error('[BACKGROUND] Failed to send message:', error);
    }
  }
  else if (info.menuItemId === 'simplifyText' && info.selectionText) {
    console.log('[BACKGROUND] Sending simplify-text message with text length:', info.selectionText.length);
    // Relay to content script in the active tab
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'simplify-text',
        text: info.selectionText
      });
      console.log('[BACKGROUND] Message sent successfully');
    } catch (error) {
      console.error('[BACKGROUND] Failed to send message:', error);
    }
  } else {
    console.log('[BACKGROUND] Context menu click ignored - no selection or unknown menu item');
  }
});
