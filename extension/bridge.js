// Listen for messages from the extension and forward to page (MAIN world)
chrome.runtime.onMessage.addListener((message) => {
  window.postMessage({ type: 'autism-simplify-panel', ...message.data }, '*');
});