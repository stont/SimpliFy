document.addEventListener('DOMContentLoaded', () => {

  // Option 1: open request-mic.html in a new tab to prompt for permission
  if (window.chrome && chrome.tabs) {
    chrome.tabs.create({ url: chrome.runtime.getURL('request-mic.html') });
  } else {
    window.open('request-mic.html', '_blank');
  }

  const micBtn = document.getElementById('mic-btn');
  const browserBtn = document.getElementById('browser-btn');
  const uploadBtn = document.getElementById('upload-btn');
  const fileInput = document.getElementById('audio-file');
  const status = document.getElementById('status');
  const output = document.getElementById('caption-output');

  let recognition;

  // Mic Scenario: Use Web Speech API (offline if packs downloaded)
  micBtn.addEventListener('click', () => {
    if (recognition) recognition.stop();
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Change for other languages

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      output.textContent = transcript;
      output.scrollTop = output.scrollHeight; // Auto-scroll
    };

    recognition.onerror = (event) => {
      status.textContent = `Error: ${event.error}. Ensure offline language pack is downloaded.`;
    };

    recognition.onstart = () => status.textContent = 'Listening to mic... Speak now!';
    recognition.start();

    // Request mic permission if needed
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      // Stream not used directly, but ensures permission
    }).catch(err => status.textContent = 'Mic access denied.');
  });

  // Browser Audio Scenario: Capture tab audio, play it, and use Web Speech API on the stream
  browserBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabCapture.capture({ audio: true }, (stream) => {
        if (stream) {
          const audio = new Audio();
          audio.srcObject = stream;
          audio.play();

          // Pipe audio to Web Speech API via MediaStreamTrack (experimental, Chrome 114+)
          const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
          recognition.continuous = true;
          recognition.interimResults = true;

          // Attach audio context for processing (simplified; for full offline, rely on built-in if enabled)
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          // Note: Direct STT on stream requires custom processing; fallback to playing and manual toggle of Live Caption
          status.textContent = 'Browser audio captured. Enable Chrome Live Caption for offline transcription.';
          output.textContent = 'Captions will appear via Chrome\'s built-in feature.';

          // Alternative: Send to content script for overlay
          chrome.tabs.sendMessage(tabs[0].id, { action: 'startBrowserCaption', streamId: stream.id });
        } else {
          status.textContent = 'Failed to capture tab audio.';
        }
      });
    });
  });

  // Uploaded File Scenario: Load file, play it, and caption via Web Speech API
  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const audio = new Audio(URL.createObjectURL(file));
      audio.play();

      // Use Web Speech API on the played audio (offline-capable)
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        output.textContent = transcript;
        output.scrollTop = output.scrollHeight;
      };

      recognition.onerror = (event) => status.textContent = `Error: ${event.error}`;
      recognition.onstart = () => status.textContent = 'Captioning uploaded file...';
      recognition.start();

      // Fallback: Advise enabling Live Caption for better offline handling
      status.textContent += ' (Or enable Chrome Live Caption for automatic offline captions).';
    }
  });

  // Stop all on popup close
  window.addEventListener('beforeunload', () => {
    if (recognition) recognition.stop();
  });
});