// Listen for messages from the extension and forward to page (MAIN world)
chrome.runtime.onMessage.addListener((message) => {
  window.postMessage({ type: 'summary-panel', ...message.data }, '*');
});

// Listen for messages from the page (MAIN world) and forward to extension
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'audio-scribe') {
    chrome.runtime.sendMessage({ data: event.data });
  }
});