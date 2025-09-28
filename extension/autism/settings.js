// Handles autism settings form

document.getElementById('autismSettingsForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const settings = {
    simplifyPosts: this.simplifyPosts.value,
    disableAnimations: this.disableAnimations.value,
    readAloud: this.readAloud.value,
    toneGuidance: this.toneGuidance.value
  };
  localStorage.setItem('autismSettings', JSON.stringify(settings));
  alert('Settings saved!');
});
