console.log('SimpliFy contentScript.js injected!');

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'update-dom-text' && message.text) {
    console.log('Content script received text to update DOM:', message.text);
    const selection = window.getSelection();
    
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    // Replace the selected text with the summary
    range.deleteContents();
    range.insertNode(document.createTextNode(message.text));
  }
});
