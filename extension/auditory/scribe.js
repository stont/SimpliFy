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

// --- MediaRecorder/Audio Prompt Demo Logic (from chrome.dev) ---
// This is a utility for future use, not yet wired to UI
async function recordAndTranscribeAudio(onChunk, onError) {
  let audioStream;
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    const recorder = new MediaRecorder(audioStream);
    recorder.ondataavailable = ({ data }) => {
      chunks.push(data);
    };
    recorder.start();
    await new Promise((r) => setTimeout(r, 5000)); // Record for 5 seconds
    recorder.stop();
    await new Promise((r) => (recorder.onstop = r));
    const blob = new Blob(chunks, { type: recorder.mimeType });
    await transcribeAudioFile(blob, onChunk, onError);
  } catch (error) {
    onError(error);
  } finally {
    audioStream?.getTracks().forEach((track) => track.stop());
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
  if (startTranscribeBtn) {
    startTranscribeBtn.addEventListener('click', async () => {
      // Switch to Scribe tab
      const scribeTabBtn = document.querySelector('.tab-btn[data-tab="tab-scribe"]');
      if (scribeTabBtn) scribeTabBtn.click();
      const scribeText = document.getElementById('scribeText');
      if (scribeText) {
        scribeText.textContent = 'Recording and transcribing...';
        await recordAndTranscribeAudio(
          chunk => scribeText.textContent += chunk,
          err => scribeText.textContent = 'Error: ' + err.message
        );
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', setupScribeTab);
