// Handles visual settings form
const shouldAutoReadPageCheckBox = document.getElementById('shouldAutoReadPageCheckBox');
const enableVoiceCommandReadingCheckBox = document.getElementById('enableVoiceCommandReadingCheckBox');
// document.getElementById('visualSettingsForm').addEventListener('submit', function (e) {
//   e.preventDefault();
//   const settings = {
//     summarizeLongTexts: this.summarizeLongTexts.value,
//     summarizeTerms: this.summarizeTerms.value,
//     voiceMode: this.voiceMode.value,
//     voiceSpeed: this.voiceSpeed.value,
//     voiceTone: this.voiceTone.value
//   };
//   localStorage.setItem('visualSettings', JSON.stringify(settings));
//   alert('Settings saved!');
// });

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
