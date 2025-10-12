// request-mic.js: Requests microphone access in a user-initiated tab

document.getElementById('requestMicBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.textContent = 'Requesting microphone access...';
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    status.textContent = 'Microphone access granted! You can now close this tab.';
  } catch (err) {
    status.textContent = 'Microphone access denied: ' + err.message;
  }
});
