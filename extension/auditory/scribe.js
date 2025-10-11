// scribe.js - Handles Scribe tab logic and file transcription

// Utility: transcribe audio file using Gemini only
function transcribeAudioFile(file, onChunk, onError) {
  onChunk('Transcribing with Gemini...\n');
  window.geminiTranscribeFile(file)
    .then(function(transcript) {
      onChunk(transcript);
    })
    .catch(function(err) {
      console.error('Transcription error:', err);
      onError(err);
    });
}

// --- Live mic transcription logic ---
let micStream = null;
let recorder = null;
let isRecording = false;
let liveTranscript = '';

// Track transcription mode: 'gemini' or 'webspeech'
let transcriptionMode = localStorage.getItem('transcriptionMode') || 'gemini';

// Load webspeech.js
const script = document.createElement('script');
script.src = 'webspeech.js';
document.head.appendChild(script);

function updateTranscriptionModeUI() {
  const modeSelect = document.getElementById('transcriptionMode');
  if (modeSelect) modeSelect.value = transcriptionMode;
}

function saveTranscriptionMode(mode) {
  transcriptionMode = mode;
  localStorage.setItem('transcriptionMode', mode);
}

async function startMicTranscriptionUnified(scribeText, startBtn, statusDiv) {
  if (transcriptionMode === 'webspeech') {
    window.startWebSpeechTranscription(scribeText, startBtn, statusDiv);
  } else {
    await startMicTranscription(scribeText, startBtn, statusDiv);
  }
}

function stopMicTranscriptionUnified(statusDiv, startBtn) {
  if (transcriptionMode === 'webspeech') {
    window.stopWebSpeechTranscription(statusDiv, startBtn);
  } else {
    stopMicTranscription(statusDiv, startBtn);
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

  // Handle file selection
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Switch to Scribe tab
    const scribeTabBtn = document.querySelector('.tab-btn[data-tab="tab-scribe"]');
    if (scribeTabBtn) scribeTabBtn.click();
    const scribeText = document.getElementById('scribeText');
    if (scribeText) {
      scribeText.textContent = 'Transcribing...';
      await transcribeAudioFile(
        file,
        chunk => scribeText.textContent += chunk,
        err => scribeText.textContent = 'Error: ' + err.message
      );
    }
  });

  // Transcription mode dropdown logic
  const modeSelect = document.getElementById('transcriptionMode');
  if (modeSelect) {
    updateTranscriptionModeUI();
    modeSelect.addEventListener('change', (e) => {
      saveTranscriptionMode(e.target.value);
    });
  }

  // Live recording logic for 'Start Transcribing' button
  const startTranscribeBtn = document.getElementById('startTranscribeBtn');
  const statusDiv = document.getElementById('liveTranscribeStatus');
  if (startTranscribeBtn) {
    startTranscribeBtn.addEventListener('click', async () => {
      // Switch to Scribe tab
      const scribeTabBtn = document.querySelector('.tab-btn[data-tab="tab-scribe"]');
      if (scribeTabBtn) scribeTabBtn.click();
      const scribeText = document.getElementById('scribeText');
      let currentlyRecording = false;
      if (transcriptionMode === 'webspeech') {
        currentlyRecording = window.wsIsRecording && window.wsIsRecording();
      } else {
        currentlyRecording = isRecording;
      }
      if (!currentlyRecording) {
        await startMicTranscriptionUnified(scribeText, startTranscribeBtn, statusDiv);
      } else {
        stopMicTranscriptionUnified(statusDiv, startTranscribeBtn);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', setupScribeTab);
