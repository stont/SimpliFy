// Handles visual settings form
const shouldAutoReadPageCheckBox = document.getElementById('shouldAutoReadPageCheckBox');
const enableVoiceCommandReadingCheckBox = document.getElementById('enableVoiceCommandReadingCheckBox');

async function initializeSettingsAsync() {
  const result = await chrome.storage.local.get(['shouldAutoReadPage', 'enableVoiceCommandReading']);
  console.log('The result:: ', result)
  if (result.shouldAutoReadPage !== undefined) {
    shouldAutoReadPageCheckBox.checked = result.shouldAutoReadPage;
  }
  if (result.enableVoiceCommandReading !== undefined) {
    enableVoiceCommandReadingCheckBox.checked = result.enableVoiceCommandReading;
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  await initializeSettingsAsync();

  if (shouldAutoReadPageCheckBox) {
    shouldAutoReadPageCheckBox.addEventListener('change', function () {
      chrome.storage.local.set({ 'shouldAutoReadPage': this.checked });
      //disable automatic simplification if auto read is enabled
      if (this.checked) {
        chrome.storage.local.set({ 'autismAutomaticSimplification': false });
      }
    });
  }
  if (enableVoiceCommandReadingCheckBox) {
    enableVoiceCommandReadingCheckBox.addEventListener('change', function () {
      chrome.storage.local.set({ 'enableVoiceCommandReading': this.checked });
    });
  }
});
