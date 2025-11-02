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

function filterProfanity(text) {
  // Simple placeholder, replace with a real filter as needed
  const profane = ["fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy", "cunt", "damn", "crap", "slut", "fag", "cock", "douche", "bollocks", "bugger", "arse", "wank", "prick", "twat", "tit", "piss", "cum", "suck", "whore", "nigger", "nigga", "spic", "chink", "gook", "kike", "wop", "dyke", "tranny", "faggot", "retard", "homo", "queer", "spastic", "tard", "bimbo", "skank", "slag", "tart", "tosser", "wanker", "jerk", "jackass", "motherfucker", "son of a bitch", "arsehole", "bollocks", "shag", "git", "twit", "pillock", "minger", "munter", "numpty", "plonker", "scrubber", "git", "berk", "div", "nonce", "ponce", "slag", "tart", "twat", "wazzock", "yob", "yobbo"]; // etc.
  let filtered = text;
  profane.forEach(word => {
    const re = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(re, '****');
  });
  return filtered;
}

function updateTranscriptUI(scribeText, currentInterim) {
  const settings = getScribeSettings();
  if (!scribeText) return;
  let html = transcriptSegments.map(seg => {
    let txt = settings.filterWords ? filterProfanity(seg.text) : seg.text;
    return settings.showTimestamps
      ? `<div><span style='color:#888;font-size:0.9em;'>[${seg.timestamp}]</span> ${txt}</div>`
      : `<div>${txt}</div>`;
  }).join('');
  if (currentInterim) {
    let interimTxt = settings.filterWords ? filterProfanity(currentInterim) : currentInterim;
    html += settings.showTimestamps
      ? `<div style='color:#1976d2;'><span style='color:#888;font-size:0.9em;'>[${formatTimestamp(new Date())}]</span> ${interimTxt}</div>`
      : `<div style='color:#1976d2;'>${interimTxt}</div>`;
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
  //log the type of wsRecognition
  console.log('wsRecognition type:', Object.prototype.toString.call(wsRecognition));

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
    if (wsLastTranscript.trim()) {
      transcriptSegments.push({
        text: wsLastTranscript.trim(),
        timestamp: formatTimestamp(new Date())
      });
      wsLastTranscript = '';
    }
    // Auto download if enabled
    const settings = getScribeSettings();
    if (settings.autoDownload && transcriptSegments.length > 0) {
      downloadTranscript();
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

// Settings: load and save user preferences
function getScribeSettings() {
  return {
    autoDownload: localStorage.getItem('autoDownload') === 'on',
    showTimestamps: localStorage.getItem('showTimestamps') === 'on',
    filterWords: localStorage.getItem('filterWords') === 'on',
  };
}
function setScribeSetting(key, value) {
  localStorage.setItem(key, value ? 'on' : 'off');
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

  // Handle file selection (playback and live transcription)
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Switch to Scribe tab
    const scribeTabBtn = document.querySelector('.tab-btn[data-tab="tab-scribe"]');
    if (scribeTabBtn) scribeTabBtn.click();
    const scribeText = document.getElementById('scribeText');
    const audioPlayer = document.getElementById('scribeAudioPlayer');
    if (audioPlayer) {
      audioPlayer.src = URL.createObjectURL(file);
      audioPlayer.style.display = 'block';
      audioPlayer.load();
      audioPlayer.play();
      // When audio finishes, stop transcription and auto-download if enabled
      audioPlayer.onended = () => {
        stopWebSpeechTranscription(null, null);
        const settings = getScribeSettings();
        if (settings.autoDownload && transcriptSegments.length > 0) {
          downloadTranscript();
        }
      };
      //stop live transcription when player is stopped or paused
      audioPlayer.onpause = () => {
        console.log('Audio playback paused. Stopping transcription.');
        stopWebSpeechTranscription(null, null);
      };
      audioPlayer.onplay = () => {
        console.log('Audio playback started. Starting transcription.');
        if (!wsIsRecording) {
          startWebSpeechTranscription(scribeText, null, null);
        }
    };
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

  // Settings switches
  const autoDownloadSwitch = document.getElementById('autoDownloadSwitch');
  const showTimestampsSwitch = document.getElementById('showTimestampsSwitch');
  const filterWordsSwitch = document.getElementById('filterWordsSwitch');
  if (autoDownloadSwitch) {
    autoDownloadSwitch.checked = localStorage.getItem('autoDownload') === 'on';
    autoDownloadSwitch.addEventListener('change', e => setScribeSetting('autoDownload', e.target.checked));
  }
  if (showTimestampsSwitch) {
    showTimestampsSwitch.checked = localStorage.getItem('showTimestamps') === 'on';
    showTimestampsSwitch.addEventListener('change', e => setScribeSetting('showTimestamps', e.target.checked));
  }
  if (filterWordsSwitch) {
    filterWordsSwitch.checked = localStorage.getItem('filterWords') === 'on';
    filterWordsSwitch.addEventListener('change', e => setScribeSetting('filterWords', e.target.checked));
  }

  // Download Transcript button
  const downloadBtn = document.getElementById('downloadTranscriptBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', manualDownloadTranscript);
  }

  // Ensure scribeText is scrollable and multi-line
  const scribeText = document.getElementById('scribeText');
  if (scribeText) {
    scribeText.style.overflowY = 'auto';
  }
}

function getTranscriptFilename() {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `transcript_${ts}.txt`;
}

function manualDownloadTranscript() {
  downloadTranscript();
}

function downloadTranscript() {
  const settings = getScribeSettings();
  if (!transcriptSegments.length) return;
  const allText = transcriptSegments.map(seg =>
    settings.showTimestamps ? `[${seg.timestamp}] ${settings.filterWords ? filterProfanity(seg.text) : seg.text}` : (settings.filterWords ? filterProfanity(seg.text) : seg.text)
  ).join('\n');
  const blob = new Blob([allText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = getTranscriptFilename();
  a.style.display = 'none';
  document.body.appendChild(a);
  setTimeout(() => {
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

document.addEventListener('DOMContentLoaded', setupScribeTab);
