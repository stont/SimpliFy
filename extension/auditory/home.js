// home.js - logic for auditory home page (index.html)
document.addEventListener('DOMContentLoaded', () => {
  // Settings button navigation
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.location.href = 'settings.html';
    });
  }

  // Footer nav: Home/Settings
  const navLinks = document.querySelectorAll('footer nav a');
  navLinks.forEach((link, idx) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (idx === 0) window.scrollTo({top: 0, behavior: 'smooth'});
      if (idx === 1) window.location.href = 'settings.html';
    });
  });

  // Replace icon placeholders with SVGs
  import('./icons.js').then(({getIcon}) => {
    document.querySelectorAll('[data-icon]').forEach(el => {
      el.innerHTML = getIcon(el.dataset.icon);
    });
  });
});
