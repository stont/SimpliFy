function handleSwitchView(index) {
    if (Number(index) === 0) {
        document.getElementById('homePageContent').style.display = 'block';
        document.getElementById('settingsPageContent').style.display = 'none';
    } else {
        document.getElementById('homePageContent').style.display = 'none';
        document.getElementById('settingsPageContent').style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const homebtn = document.getElementById('homeBtn');
    const settingsButton = document.getElementById('settingsButton');
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
});