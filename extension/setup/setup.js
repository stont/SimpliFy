async function checkAiAvailability() {
    if (!'Summarizer' in self && !'Rewriter' in self) {
        //Navigate to extension\autism\setup\setup.html
        // window.location.href = 'setup/setup.html';
    }
    
    //If both exists, check for availability.
    if ('Summarizer' in self && 'Rewriter' in self) {
        // The Summarizer and Rewriter APIs are supported.

        let availability = await Summarizer.availability();
        //downloading,available,unavailable
        const summarizerStatus = document.getElementById('summarizerStatus');
        if (availability === 'downloadable') {
            summarizerStatus.textContent  = 'Unavailable';
            summarizerStatus.classList.add('text-red-500');
        } else if (availability === 'available') {
            summarizerStatus.textContent  = 'Available';
            summarizerStatus.classList.add('text-green-500');
            document.getElementById('summarizerBtn').disabled = true;
            setProgress(100, true);
        }

        availability = await Rewriter.availability();
        const rewriterStatus = document.getElementById('rewriterStatus');
        if (availability === 'downloadable') {
            rewriterStatus.textContent  = 'Unavailable';
            rewriterStatus.classList.add('text-red-500');
        } else if (availability === 'available') {
            rewriterStatus.textContent  = 'Available';
            rewriterStatus.classList.add('text-green-500');
            document.getElementById('rewriterBtn').disabled = true;
            setProgress(100, false);
        }


    }
}

function setProgress(percentage, isSummarizer) {
    const svg = document.getElementById(!isSummarizer ? 'rewriterProgress' : 'summarizerProgress');
    debugger
    const circle = svg.querySelector('circle.text-blue-500');
    const radius = 22; // r attribute from the circle
    const circumference = 2 * Math.PI * radius;

    // Calculate the dash offset based on percentage
    const offset = circumference - (percentage / 100) * circumference;

    circle.setAttribute('stroke-dasharray', circumference);
    circle.setAttribute('stroke-dashoffset', offset);
}

document.addEventListener('DOMContentLoaded', () => {
    const download = document.getElementById('btn-download-gemini')
    const screens = {
        notDetected: document.getElementById('screen-not-detected'),
        downloading: document.getElementById('screen-downloading'),
        complete: document.getElementById('screen-complete')
    };

    const buttons = {
        download: document.getElementById('btn-download-gemini'),
        retry: document.getElementById('btn-retry-download'),
        continue: document.getElementById('btn-continue'),
        summarizerBtn: document.getElementById('summarizerBtn'),
        rewriterBtn: document.getElementById('rewriterBtn'),
    };

    const progressBar = document.getElementById('progress-bar');
    const downloadPercent = document.getElementById('download-percent');

    // Function to show a specific screen
    const showScreen = (screenId) => {
        Object.values(screens).forEach(screen => {
            screen.style.display = 'none';
        });
        screens[screenId].style.display = 'flex';
    };



    let progressInterval;

    // Start the download simulation
    const startDownload = async (isSummarizer) => {
        if (navigator.userActivation.isActive) {
            if (isSummarizer) {
                const summarizer = await Summarizer.create({
                    monitor(m) {
                        m.addEventListener('downloadprogress', (e) => {
                            setProgress(e.loaded * 100, true);
                        });
                    }
                });
            } else {
                const rewriter = await Rewriter.create({
                    monitor(m) {
                        m.addEventListener('downloadprogress', (e) => {
                            setProgress(e.loaded * 100, false);
                        });
                    }
                });
            }
        }
    };



    // Event Listeners for screen transitions
    buttons.rewriterBtn.addEventListener('click', () => { startDownload(true) });
    buttons.summarizerBtn.addEventListener('click', () => { startDownload(true) });
    buttons.download.addEventListener('click', () => {
        showScreen('downloading')
        checkAiAvailability();
    });

    // buttons.retry.addEventListener('click', () => {
    //     // In a real app, this would restart the download logic
    //     // For this demo, it just restarts the simulation from 75%
    //     startDownload();
    // });

    buttons.continue.addEventListener('click', () => {
        // In a real app, this would close the screen or redirect to the extension
        alert('Proceeding to use the extension...');
        showScreen('notDetected'); // Reset for demo purposes
    });

    // Initialize to the first screen
    showScreen('notDetected');
});