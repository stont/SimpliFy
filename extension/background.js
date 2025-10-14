// Placeholder for background logic (if needed)
// All processing is local/offline

// Enable auto-opening of the side panel when the extension icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));


chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'summarizeText',
    title: 'Generate summary',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, _tab) => {
  if (info.menuItemId === 'summarizeText' && info.selectionText) {
    // Relay to content script in the active tab
    chrome.runtime.sendMessage({
      action: 'summarize-text',
      text: info.selectionText
    });
  }
});

// Relay messages from extension pages to content scripts in the active tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'update-dom-text' && message.text) {
    console.log('Background received text to update DOM:', message.text);
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'update-dom-text',
          text: message.text
        });
      }
    });
  }
});