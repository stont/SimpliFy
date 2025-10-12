// Handle tabCapture permissions and cleanup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureTabAudio') {
    chrome.tabCapture.capture({ audio: true }, (stream) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ streamId: stream.id });
        // Cleanup after 30s (adjust as needed)
        setTimeout(() => stream.getTracks().forEach(track => track.stop()), 30000);
      }
    });
    return true; // Async response
  }
});