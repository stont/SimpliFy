// Placeholder for background logic (if needed)
// All processing is local/offline

// Enable auto-opening of the side panel when the extension icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));


chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'scribeAudio',
    title: 'Generate transcript from audio',
    contexts: ['audio']
  });
});


chrome.contextMenus.onClicked.addListener(async (info, _tab) => {
  if (info.menuItemId === 'scribeAudio' && info.srcUrl) {
    try {
      const response = await fetch(info.srcUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      chrome.runtime.sendMessage({
        action: 'scribe-audio-blob',
        buffer: arrayBuffer,
        mimeType: blob.type,
        fileName: info.srcUrl.split('/').pop() || 'audio',
      });
    } catch (error) {
      console.error('Error fetching audio from URL:', error);
      chrome.runtime.sendMessage({
        action: 'scribe-audio',
        text: error.message
      });
    }
  }
});