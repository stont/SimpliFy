document.addEventListener('DOMContentLoaded', () => {
    const screens = {
        notDetected: document.getElementById('screen-not-detected'),
        downloading: document.getElementById('screen-downloading'),
        complete: document.getElementById('screen-complete')
    };

    const buttons = {
        download: document.getElementById('btn-download-gemini'),
        retry: document.getElementById('btn-retry-download'),
        continue: document.getElementById('btn-continue')
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
    const startDownload = () => {
        showScreen('downloading');
        let progress = 75; // Starting at 75% as per the image
        progressBar.style.width = `${progress}%`;
        downloadPercent.textContent = `${progress}%`;

        // Clear any existing interval
        if (progressInterval) clearInterval(progressInterval);

        progressInterval = setInterval(() => {
            if (progress < 100) {
                progress += Math.floor(Math.random() * 5) + 1; // Simulate progress
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(progressInterval);
                    setTimeout(() => {
                        showScreen('complete');
                    }, 500); // Wait a moment after reaching 100%
                }
                progressBar.style.width = `${progress}%`;
                downloadPercent.textContent = `${progress}%`;
            }
        }, 500);
    };

    // Event Listeners for screen transitions
    buttons.download.addEventListener('click', startDownload);

    buttons.retry.addEventListener('click', () => {
        // In a real app, this would restart the download logic
        // For this demo, it just restarts the simulation from 75%
        startDownload();
    });

    buttons.continue.addEventListener('click', () => {
        // In a real app, this would close the screen or redirect to the extension
        alert('Proceeding to use the extension...');
        showScreen('notDetected'); // Reset for demo purposes
    });

    // Initialize to the first screen
    showScreen('notDetected');
});