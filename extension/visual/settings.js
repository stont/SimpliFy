// Handles visual settings form
const shouldAutoReadPageCheckBox = document.getElementById('shouldAutoReadPageCheckBox');
const enableVoiceCommandReadingCheckBox = document.getElementById('enableVoiceCommandReadingCheckBox');

// Voice settings
const voiceSelector = document.getElementById('voiceSelector');
const voiceSpeed = document.getElementById('voiceSpeed');
const pitch = document.getElementById('pitch');
const pitchValue = document.getElementById('pitchValue');
const volume = document.getElementById('volume');
const volumeValue = document.getElementById('volumeValue');


async function initializeSettingsAsync() {
  const result = await chrome.storage.local.get(['shouldAutoReadPage', 'enableVoiceCommandReading', 'voiceSettings']);
  console.log('The result:: ', result)
  if (result.shouldAutoReadPage !== undefined) {
    shouldAutoReadPageCheckBox.checked = result.shouldAutoReadPage;
  }
  if (result.enableVoiceCommandReading !== undefined) {
    if(enableVoiceCommandReadingCheckBox)
    enableVoiceCommandReadingCheckBox.checked = result.enableVoiceCommandReading;
  }

  const voiceSettings = result.voiceSettings || {};

  // Populate voices
  chrome.runtime.sendMessage({ type: 'get-voices' }, (voices) => {
    if (voices) {
      voiceSelector.innerHTML = '';
      voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.voiceName;
        option.textContent = `${voice.voiceName} (${voice.lang})`;
        if (voice.voiceName === voiceSettings.voiceName) {
          option.selected = true;
        }
        voiceSelector.appendChild(option);
      });
    }
  });

  if (voiceSettings.rate) {
    voiceSpeed.value = voiceSettings.rate;
  }
  if (voiceSettings.pitch) {
    pitch.value = voiceSettings.pitch;
    pitchValue.textContent = voiceSettings.pitch;
  }
  if (voiceSettings.volume) {
    volume.value = voiceSettings.volume;
    volumeValue.textContent = voiceSettings.volume;
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

  function saveVoiceSettings() {
    const voiceSettings = {
      voiceName: voiceSelector.value,
      rate: parseFloat(voiceSpeed.value),
      pitch: parseFloat(pitch.value),
      volume: parseFloat(volume.value),
    };
    chrome.storage.local.set({ voiceSettings });
  }

  voiceSelector.addEventListener('change', saveVoiceSettings);
  voiceSpeed.addEventListener('change', saveVoiceSettings);

  pitch.addEventListener('input', () => {
    pitchValue.textContent = pitch.value;
    saveVoiceSettings();
  });

  volume.addEventListener('input', () => {
    volumeValue.textContent = volume.value;
    saveVoiceSettings();
  });
});