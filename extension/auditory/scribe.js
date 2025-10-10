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

async function startMicTranscription(scribeText, startBtn, statusDiv) {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    liveTranscript = '';
    if (scribeText) scribeText.textContent = '';
    recorder = new MediaRecorder(micStream);
    recorder.ondataavailable = async (e) => {
      if (e.data && e.data.size > 0) {
        const chunkBlob = new Blob([e.data], { type: recorder.mimeType });
        chunkBlob.name = 'mic-chunk.webm';
        if (chunkBlob.size === 0) {
          if (statusDiv) statusDiv.textContent = 'Microphone is not accessible or no audio was captured. Please try granting permission in a tab.';
          if (scribeText) scribeText.textContent = '[No audio captured. Please check microphone permissions.]';
          return;
        }
        if (statusDiv) statusDiv.textContent = 'Transcribing chunk...';
        try {
          const partial = await window.geminiTranscribeFile(chunkBlob);
          liveTranscript += (liveTranscript ? '\n' : '') + partial;
          if (scribeText) scribeText.textContent = liveTranscript;
        } catch (err) {
          if (scribeText) scribeText.textContent = (liveTranscript ? liveTranscript + '\n' : '') + '[Chunk failed: ' + err.message + ']';
        }
      }
    };
    recorder.onstop = () => {
      if (statusDiv) statusDiv.textContent = 'Stopped.';
      micStream.getTracks().forEach(track => track.stop());
      micStream = null;
      recorder = null;
      isRecording = false;
      if (startBtn) startBtn.textContent = 'Start Transcribing';
    };
    recorder.start(5000); // 5 seconds per chunk
    isRecording = true;
    if (startBtn) startBtn.textContent = 'Stop Transcribing';
    if (statusDiv) statusDiv.textContent = 'Listening... Speak now.';
  } catch (err) {
    if (statusDiv) statusDiv.textContent = 'Microphone error: ' + (err && err.message ? err.message : err);
    isRecording = false;
    if (startBtn) startBtn.textContent = 'Start Transcribing';
    // Option 1: open request-mic.html in a new tab to prompt for permission
    if (window.chrome && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('request-mic.html') });
    } else {
      window.open('request-mic.html', '_blank');
    }
  }
}

function stopMicTranscription(statusDiv, startBtn) {
  if (recorder && isRecording) {
    recorder.stop();
    if (statusDiv) statusDiv.textContent = 'Stopped.';
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

  // Live recording logic for 'Start Transcribing' button
  const startTranscribeBtn = document.getElementById('startTranscribeBtn');
  const statusDiv = document.getElementById('liveTranscribeStatus');
  if (startTranscribeBtn) {
    startTranscribeBtn.addEventListener('click', async () => {
      console.log('[Mic] startTranscribeBtn clicked, isRecording:', isRecording);
      // Switch to Scribe tab
      const scribeTabBtn = document.querySelector('.tab-btn[data-tab="tab-scribe"]');
      if (scribeTabBtn) scribeTabBtn.click();
      const scribeText = document.getElementById('scribeText');
      if (!isRecording) {
        await startMicTranscription(scribeText, startTranscribeBtn, statusDiv);
      } else {
        stopMicTranscription(statusDiv, startTranscribeBtn);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', setupScribeTab);
