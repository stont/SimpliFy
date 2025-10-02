// auditory.js - shared logic for auditory home and settings pages

document.addEventListener('DOMContentLoaded', () => {
  // Settings button navigation
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.location.href = 'settings.html';
    });
  }

  // Home button navigation (for settings page)
  const homeNav = document.querySelector('footer nav a[href$="index.html"]');
  if (homeNav) {
    homeNav.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'index.html';
    });
  }

  // Back button (for settings page)
  if (typeof setupBackButton === 'function') {
    setupBackButton();
  }
});
