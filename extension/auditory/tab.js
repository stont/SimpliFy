// tab.js - Material Web tab and toggle logic for auditory/index.html

document.addEventListener('DOMContentLoaded', () => {
  // Material Tabs logic
  const tabs = document.querySelector('md-tabs#auditory-tabs');
  const panels = [
    document.getElementById('tab-home'),
    document.getElementById('tab-settings')
  ];
  if (tabs && panels[0] && panels[1]) {
    tabs.addEventListener('change', (e) => {
      const idx = tabs.activeTabIndex;
      panels.forEach((p, i) => p.classList.toggle('hidden', i !== idx));
    });
    // Show first tab by default
    panels[0].classList.remove('hidden');
    panels[1].classList.add('hidden');
  }

  // Material segmented button logic for settings
  const saved = JSON.parse(localStorage.getItem('auditorySettings') || '{}');
  const defaultSettings = {
    transcribeMedia: 'ondemand',
    filterWords: 'on',
    liveTranscribe: 'on',
  };
  const settings = { ...defaultSettings, ...saved };

  ['transcribeMedia', 'filterWords', 'liveTranscribe'].forEach(setting => {
    const value = settings[setting];
    document.querySelectorAll(`md-outlined-segmented-button[data-setting='${setting}']`).forEach(btn => {
      btn.selected = (btn.dataset.value === value);
    });
  });

  document.querySelectorAll('md-outlined-segmented-button').forEach(btn => {
    btn.addEventListener('click', function() {
      const setting = this.dataset.setting;
      const value = this.dataset.value;
      document.querySelectorAll(`md-outlined-segmented-button[data-setting='${setting}']`).forEach(b => {
        b.selected = false;
      });
      this.selected = true;
      settings[setting] = value;
      localStorage.setItem('auditorySettings', JSON.stringify(settings));
    });
  });

  // Material switch logic (audio alerts)
  const audioSwitch = document.querySelector('md-switch');
  if (audioSwitch) {
    audioSwitch.addEventListener('input', () => {
      localStorage.setItem('audioAlerts', audioSwitch.selected ? 'on' : 'off');
    });
    // Restore state
    const audioAlerts = localStorage.getItem('audioAlerts');
    if (audioAlerts === 'off') audioSwitch.selected = false;
    else audioSwitch.selected = true;
  }
});
