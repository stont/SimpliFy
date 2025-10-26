function handleSwitchView(index) {
    if (Number(index) === 0) {
        document.getElementById('homePageContent').style.display = 'block';
        document.getElementById('settingsPageContent').style.display = 'none';
    } else {
        document.getElementById('homePageContent').style.display = 'none';
        document.getElementById('settingsPageContent').style.display = 'block';
    }
}

function handleExpandUsagePatternContent() {
    const content = document.getElementById('usagePatternsContent');
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
    } else {
        content.style.display = 'none';
    }
}

function handleExpandConsumptionContent() {
    const content = document.getElementById('contentConsumptionContent');
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
    } else {
        content.style.display = 'none';
    }
}

function handleExpandNavigationContent() {
    const content = document.getElementById('navigationEfficiencyContent');
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
    } else {
        content.style.display = 'none';
    }
}

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

  recognition.onerror = (err) => console.error("Speech error:", err);
  recognition.onend = () => recognition.start(); // auto restart

  recognition.start();
}


document.addEventListener('DOMContentLoaded', function () {
    // Initialize speech recognition
    initSpeechRecognition();
    const homebtn = document.getElementById('homeBtn');
    const settingsButton = document.getElementById('settingsButton');
    const usageExpandBtn = document.getElementById('usageExpandBtn');
    const consumptionExpandBtn = document.getElementById('consumptionExpandBtn');
    const navigationExpandBtn = document.getElementById('navigationExpandBtn');
    const backButton = document.getElementById('backButton');

    if (backButton) {
        backButton.onclick = function () {
            // Clear navigation storage before navigating back
            localStorage.removeItem('accessibilityCondition');
            window.location.href = '../onboard/index.html';
        };
    }
    if (homebtn) {
        homebtn.onclick = function () {
            handleSwitchView(0);
        };
    }
    if (settingsButton) {
        settingsButton.onclick = function () {
            handleSwitchView(1);
        };
    }
    if (usageExpandBtn) {
        usageExpandBtn.onclick = function () {
            handleExpandUsagePatternContent();
        };
    }
    if (consumptionExpandBtn) {
        consumptionExpandBtn.onclick = function () {
            handleExpandConsumptionContent();
        };
    }
    if (navigationExpandBtn) {
        navigationExpandBtn.onclick = function () {
            handleExpandNavigationContent();
        };
    }
});