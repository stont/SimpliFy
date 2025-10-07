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

document.addEventListener('DOMContentLoaded', function () {
    const homebtn = document.getElementById('homeBtn');
    const settingsButton = document.getElementById('settingsButton');
    const usageExpandBtn = document.getElementById('usageExpandBtn');
    const consumptionExpandBtn = document.getElementById('consumptionExpandBtn');
    const navigationExpandBtn = document.getElementById('navigationExpandBtn');
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