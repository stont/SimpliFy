// Handles auditory settings form

document.getElementById('auditorySettingsForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const settings = {
    transcribeMedia: this.transcribeMedia.value,
    filterWords: this.filterWords.value,
    liveTranscribe: this.liveTranscribe.value
  };
  localStorage.setItem('auditorySettings', JSON.stringify(settings));
  alert('Settings saved!');
});
