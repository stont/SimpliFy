// webspeech.js - Web Speech API live transcription logic for auditory extension

let wsRecognition = null;
let wsIsRecording = false;
let wsTranscript = '';

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
    if (scribeText) scribeText.textContent = wsTranscript;
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

window.startWebSpeechTranscription = startWebSpeechTranscription;
window.stopWebSpeechTranscription = stopWebSpeechTranscription;
window.wsIsRecording = () => wsIsRecording;
