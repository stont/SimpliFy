// Handles visual settings form

document.getElementById('visualSettingsForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const settings = {
    summarizeLongTexts: this.summarizeLongTexts.value,
    summarizeTerms: this.summarizeTerms.value,
    voiceMode: this.voiceMode.value,
    voiceSpeed: this.voiceSpeed.value,
    voiceTone: this.voiceTone.value
  };
  localStorage.setItem('visualSettings', JSON.stringify(settings));
  alert('Settings saved!');
});
