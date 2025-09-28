// Placeholder for background logic (if needed)
// All processing is local/offline

// Enable auto-opening of the side panel when the extension icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
