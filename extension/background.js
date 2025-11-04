// Placeholder for background logic (if needed)
// All processing is local/offline

// Global AI task queue
let aiTaskQueue = [];
let isProcessing = false;
let isSpeaking = false;
let currentTabId = '';
let ttsState = 'stopped'; // 'playing', 'paused', 'stopped'

// Helper: Remove all tasks for a given tabId
function removeTasksForTab(tabId) {
  aiTaskQueue = aiTaskQueue.filter(task => task.tabId !== tabId);
}

// Helper: Find the next eligible task (optionally prioritize active tab)
async function getNextTask() {
  // Optionally, prioritize active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    const activeTabId = tabs[0].id;
    const activeTask = aiTaskQueue.find(task => task.tabId === activeTabId);
    if (activeTask) return activeTask;
  }
  // Otherwise, FIFO
  return aiTaskQueue[0];
}

// Main message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message: ' + JSON.stringify(message));
  console.log('Message listener', message);
  if (message.type === 'request-ai-task') {
    // Enqueue the task
    const tabId = sender.tab?.id || message.tabId;
    if (!tabId) {
      sendResponse({ error: 'No tabId' });
      return true;
    }
    // Prevent duplicate tasks for same tab
    if (!aiTaskQueue.some(task => task.tabId === tabId)) {
      aiTaskQueue.push({ tabId, requestId: message.requestId });
    }
    processQueue();
    sendResponse({ queued: true });
    return true;
  }
  if (message.type === 'ai-task-complete') {
    // Remove the completed task
    const tabId = sender.tab?.id || message.tabId;
    aiTaskQueue = aiTaskQueue.filter(task => task.tabId !== tabId);
    isProcessing = false;
    processQueue();
    sendResponse({ ok: true });
    return true;
  }
  // Existing listeners...
  if (message.action === 'summarize-text') {
    // Handle summarize-text
  }

  if (message.type === 'from-main-bridge') {
    chrome.tts.stop();
    const chunks = Array.isArray(message.data) ? message.data : [message.data];
    speakChunks(chunks, {});
  }
  if (message.type === 'SPACE_BAR_CLICKED') {
    if (ttsState === 'playing') {
      chrome.tts.pause();
      ttsState = 'paused';
    } else if (ttsState === 'paused') {
      chrome.tts.resume();
      ttsState = 'playing';
    }
  }
  if (message.type === 'STOP_TTS') {
    chrome.tts.stop();
    ttsState = 'stopped';
    isSpeaking = false;
  }
  if (message.type === 'VOICE_RESUME') {
    chrome.tts.resume();
    ttsState = 'playing';
  }
  if (message.type === 'VOICE_PAUSE') {
    chrome.tts.pause();
    ttsState = 'paused';
  }
  if (message.type === 'get-voices') {
    chrome.tts.getVoices(function(voices) {
<<<<<<< HEAD
      const englishVoices = voices.filter(voice => voice.lang && voice.lang.startsWith('en'));
      sendResponse(englishVoices);
=======
      sendResponse(voices);
>>>>>>> 990c9a89923e60fef793fafc617a778beddc6280
    });
    return true; // Required for async sendResponse
  }
});

///Can speak chunks via TTS. Can only work in the background script
async function speakChunks(chunks, options) {
  const result = await chrome.storage.local.get(['voiceSettings']);
  const voiceSettings = result.voiceSettings || {};

  // default options
  const voiceName = voiceSettings.voiceName;
  const rate = voiceSettings.rate || 1.0;
  const pitch = voiceSettings.pitch || 1.0;
  const volume = voiceSettings.volume || 1.0;

  console.log("speakChunks called with chunks: ", Array.isArray(chunks), "options:", {voiceName, rate, pitch, volume});
  if (!Array.isArray(chunks) || chunks.length === 0) return;

  ttsState = 'playing';
  // speak each chunk sequentially using enqueue
  chunks.forEach((chunk, i) => {
    // Ensure chunk is not empty and under API per-utterance limit (32,768)
    const utterance = (chunk || '').slice(0, 32768);

    chrome.tts.speak(utterance, {
      voiceName: voiceName,
      rate,
      pitch,
      volume,
      enqueue: i > 0
    }, function (event) {
      if (chrome.runtime.lastError) {
        console.warn('TTS error:', chrome.runtime.lastError.message);
        ttsState = 'stopped';
        isSpeaking = false;
      }
      if (event.type === 'start') {
        console.log('The started speech');
        isSpeaking = true;
        ttsState = 'playing';
      }
      if (event.type === 'end') {
        console.log('Finished speaking chunk:', i + 1, 'of', chunks.length);
        if (i === chunks.length - 1) {
            isSpeaking = false;
            ttsState = 'stopped';
        }
      }
      if (event.type === 'interrupted' || event.type === 'cancelled') {
        console.log('Speech interrupted or cancelled');
        ttsState = 'stopped';
        isSpeaking = false;
      }
    });

    isSpeaking = true;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const currentTab = tabs[0];
        console.log('Current active tab ID for TTS:', currentTab.id);
        currentTabId = currentTab.id
      }
    });
  });
}

async function processQueue() {
  if (isProcessing || aiTaskQueue.length === 0) return;
  const nextTask = await getNextTask();
  if (!nextTask) return;
  isProcessing = true;
  // Send start-ai-task to the tab
  try {
    await chrome.tabs.sendMessage(nextTask.tabId, { type: 'start-ai-task', requestId: nextTask.requestId });
  } catch (e) {
    // Tab may be closed, remove task and try next
    removeTasksForTab(nextTask.tabId);
    isProcessing = false;
    processQueue();
  }
}

// Release AI permission if the active tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  // Remove tasks for closed tabs
  removeTasksForTab(tabId);
  isProcessing = false;
  processQueue();
  console.log('Tab closed:', tabId, 'Current speaking tab:', currentTabId, 'Is speaking:', isSpeaking);
  if (isSpeaking && tabId === currentTabId) {
    isSpeaking = false;
    chrome.tts.stop();
    ttsState = 'stopped';
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
