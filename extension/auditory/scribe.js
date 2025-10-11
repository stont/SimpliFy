// scribe.js - Handles Scribe tab logic and file transcription

// --- Web Speech API live mic transcription logic ---
let wsRecognition = null;
let wsIsRecording = false;
let wsTranscript = '';
let wsLastTranscript = '';
let transcriptSegments = []; // {text, timestamp}

function formatTimestamp(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function updateTranscriptUI(scribeText, currentInterim) {
  if (!scribeText) return;
  // Show all saved segments with timestamps, then the current interim below
  let html = transcriptSegments.map(seg => `<div><span style='color:#888;font-size:0.9em;'>[${seg.timestamp}]</span> ${seg.text}</div>`).join('');
  if (currentInterim) {
    html += `<div style='color:#1976d2;'><span style='color:#888;font-size:0.9em;'>[${formatTimestamp(new Date())}]</span> ${currentInterim}</div>`;
  }
  scribeText.innerHTML = html;
  scribeText.scrollTop = scribeText.scrollHeight;
}

function startWebSpeechTranscription(scribeText, startBtn, statusDiv) {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    if (statusDiv) statusDiv.textContent = 'Web Speech API not supported in this browser.';
    return;
  }
  if (wsRecognition) wsRecognition.stop();
  wsTranscript = '';
  if (scribeText) scribeText.textContent = '';
  wsRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  wsRecognition.continuous = true;
  wsRecognition.interimResults = true;
  wsRecognition.lang = 'en-US';

  wsRecognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    wsTranscript = transcript;
    // Detect new sentence (reset/shorter transcript)
    if (wsTranscript.length < wsLastTranscript.length && wsLastTranscript.length > 0) {
      // Save the last transcript segment with timestamp
      transcriptSegments.push({
        text: wsLastTranscript.trim(),
        timestamp: formatTimestamp(new Date())
      });
    }
    wsLastTranscript = wsTranscript;
    updateTranscriptUI(scribeText, wsTranscript);
    console.log('Interim Transcript:', wsTranscript);
    if (scribeText) scribeText.scrollTop = scribeText.scrollHeight;
  };

  wsRecognition.onerror = (event) => {
    if (statusDiv) statusDiv.textContent = `Error: ${event.error}. Ensure offline language pack is downloaded.`;
    wsIsRecording = false;
    if (startBtn) startBtn.textContent = 'Start Transcribing';
  };

  wsRecognition.onstart = () => {
    wsIsRecording = true;
    if (statusDiv) statusDiv.textContent = 'Listening (Web Speech API)... Speak now!';
    if (startBtn) startBtn.textContent = 'Stop Transcribing';
  };
  wsRecognition.onend = () => {
    wsIsRecording = false;
    // Save the last segment if not empty
    if (wsLastTranscript.trim()) {
      transcriptSegments.push({
        text: wsLastTranscript.trim(),
        timestamp: formatTimestamp(new Date())
      });
      wsLastTranscript = '';
    }
    // Prompt to download transcript
    if (transcriptSegments.length > 0) {
      const allText = transcriptSegments.map(seg => `[${seg.timestamp}] ${seg.text}`).join('\n');
      const blob = new Blob([allText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transcript.txt';
      a.style.display = 'none';
      document.body.appendChild(a);
      setTimeout(() => {
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
    if (statusDiv) statusDiv.textContent = 'Stopped.';
    if (startBtn) startBtn.textContent = 'Start Transcribing';
  };
  wsRecognition.start();

  // Request mic permission if needed
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    // Stream not used directly, but ensures permission
  }).catch(err => {
    if (statusDiv) statusDiv.textContent = 'Mic access denied.';
    wsRecognition.stop();
    wsIsRecording = false;
    if (startBtn) startBtn.textContent = 'Start Transcribing';
  });
}

function stopWebSpeechTranscription(statusDiv, startBtn) {
  if (wsRecognition && wsIsRecording) {
    wsRecognition.stop();
    wsIsRecording = false;
    if (statusDiv) statusDiv.textContent = 'Stopped.';
    if (startBtn) startBtn.textContent = 'Start Transcribing';
  }
}

// Scribe tab logic
function setupScribeTab() {
  // Add file input if not present
  let fileInput = document.getElementById('audioFileInput');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.id = 'audioFileInput';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
  }

  // Select File button logic
  const selectFileBtn = document.getElementById('selectFileBtn');
  if (selectFileBtn) {
    selectFileBtn.addEventListener('click', () => {
      fileInput.value = '';
      fileInput.click();
    });
  }

  // Handle file selection (playback only, no Gemini)
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Switch to Scribe tab
    const scribeTabBtn = document.querySelector('.tab-btn[data-tab="tab-scribe"]');
    if (scribeTabBtn) scribeTabBtn.click();
    const scribeText = document.getElementById('scribeText');
    if (scribeText) {
      scribeText.textContent = 'Playing audio...';
      const audio = new Audio(URL.createObjectURL(file));
      audio.play();
      // Optionally, you can try to use Web Speech API on the played audio, but browser support is limited
      scribeText.textContent = 'Please use the mic for live captions. File transcription is not supported offline.';
    }
  });

  // Live recording logic for 'Start Transcribing' button
  const startTranscribeBtn = document.getElementById('startTranscribeBtn');
  const statusDiv = document.getElementById('liveTranscribeStatus');
  if (startTranscribeBtn) {
    startTranscribeBtn.addEventListener('click', async () => {
      // Switch to Scribe tab
      const scribeTabBtn = document.querySelector('.tab-btn[data-tab="tab-scribe"]');
      if (scribeTabBtn) scribeTabBtn.click();
      const scribeText = document.getElementById('scribeText');
      if (!wsIsRecording) {
        startWebSpeechTranscription(scribeText, startTranscribeBtn, statusDiv);
      } else {
        stopWebSpeechTranscription(statusDiv, startTranscribeBtn);
      }
    });
  }

  // Ensure scribeText is scrollable and multi-line
  const scribeText = document.getElementById('scribeText');
  if (scribeText) {
    scribeText.style.overflowY = 'auto';
    scribeText.style.maxHeight = '400px'; // Limit height for scrolling
  }
}

document.addEventListener('DOMContentLoaded', setupScribeTab);
