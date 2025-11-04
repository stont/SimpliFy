let recognition;

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true; // keep listening
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log("User said:", lastResult);

        if (lastResult.includes("stop") || lastResult.includes("pause")) {
            chrome.runtime.sendMessage({ type: "VOICE_PAUSE" });
        }

        if (lastResult.includes("start") || lastResult.includes("play")) {
            chrome.runtime.sendMessage({ type: "VOICE_RESUME" });
        }
    };

    recognition.onerror = (err) => {
        console.warn("Speech recognition error:", err.error);

        if (err.error === "no-speech") {
            console.log("No speech detected. Restarting...");
            restartRecognition();
        } else if (err.error === "network") {
            console.error("Network error. Check connection.");
        } else if (err.error === "not-allowed") {
            console.error("Microphone permission denied.");
        }
    };
    recognition.onend = () => recognition.start(); // auto restart

    recognition.start();
}

function restartRecognition() {
    // restart after a small delay to prevent infinite loop if mic unavailable
    setTimeout(() => {
        try {
            recognition.start();
        } catch (err) {
            console.error("Error restarting recognition:", err);
        }
    }, 1500);
}

document.addEventListener('DOMContentLoaded', function () { 
    chrome.storage.local.get(['enableVoiceCommandReading'], function(result) {
        if (result.enableVoiceCommandReading) {
            initSpeechRecognition();
        }
    });

    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.onclick = function () {
            // Clear navigation storage before navigating back
            localStorage.removeItem('accessibilityCondition');
            window.location.href = '../onboard/index.html';
        };
    }
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local' && changes.enableVoiceCommandReading) {
        if (changes.enableVoiceCommandReading.newValue) {
            initSpeechRecognition();
        } else {
            if (recognition) {
                recognition.stop();
            }
        }
    }
});