// onboard.js - onboarding logic for SimpliFy

document.querySelectorAll('.access-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const type = this.getAttribute('data-type');
    localStorage.setItem('accessibilityCondition', type);
    // Redirect to selected homepage
    window.location.href = `../${type}/index.html`;
  });
});

// Language selection is handled by shared.js
