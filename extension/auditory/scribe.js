// scribe.js - Handles Scribe tab logic and file transcription

// Utility: check if LanguageModel is available
async function isLanguageModelAvailable() {
  if (typeof LanguageModel === 'undefined') {
    console.error('LanguageModel is not defined.');
    return { available: false, reason: 'LanguageModel is not defined in this context.' };
  }
  let availability;
  try {
    availability = await LanguageModel.availability();
    console.log('LanguageModel.availability() returned:', availability);
  } catch (e) {
    console.error('Error checking LanguageModel availability:', e);
    return { available: false, reason: 'Error checking LanguageModel availability: ' + e.message };
  }
  if (availability !== 'available') {
    return { available: false, reason: `Model capability is not available (status: ${availability})` };
  }
  return { available: true };
}

// Utility: transcribe audio file using LanguageModel
async function transcribeAudioFile(file, onChunk, onError) {
  try {
    if (!file.type.startsWith('audio/')) {
      throw new Error('Selected file is not an audio file.');
    }
    const modelStatus = await isLanguageModelAvailable();
    if (!modelStatus.available) {
      throw new Error('Transcription model is not available. ' + (modelStatus.reason || ''));
    }
    // Specify expectedInputs and expectedOutputs with language
    const session = await LanguageModel.create({
      expectedInputs: [
        { type: 'audio', languages: ['en'] }
      ],
      expectedOutputs: [
        { type: 'text', languages: ['en'] }
      ]
    });
    const stream = session.promptStreaming([
      {
        role: 'user',
        content: [
          { type: 'text', value: 'transcribe this audio' },
          { type: 'audio', value: file }
        ]
      }
    ]);
    for await (const chunk of stream) {
      onChunk(chunk);
    }
  } catch (err) {
    console.error('Transcription error:', err);
    onError(err);
  }
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
