function handleSwitchView(index) {
    if (Number(index) === 0) {
        document.getElementById('homePage').style.display = 'block';
        document.getElementById('settingsPage').style.display = 'none';
        document.getElementById('homeBtn').classList.add('text-[#13a4ec]');
        document.getElementById('homeBtn').classList.remove('text-[#5b6b75]', 'dark:text-[#a1b1bd]');
        document.getElementById('settingsBtn').classList.remove('text-[#13a4ec]');
        document.getElementById('settingsBtn').classList.add('text-[#5b6b75]', 'dark:text-[#a1b1bd]');
    } else {
        document.getElementById('homePage').style.display = 'none';
        document.getElementById('settingsPage').style.display = 'block';
        document.getElementById('settingsBtn').classList.add('text-[#13a4ec]');
        document.getElementById('settingsBtn').classList.remove('text-[#5b6b75]', 'dark:text-[#a1b1bd]');
        document.getElementById('homeBtn').classList.remove('text-[#13a4ec]');
        document.getElementById('homeBtn').classList.add('text-[#5b6b75]', 'dark:text-[#a1b1bd]');
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const homebtn = document.getElementById('homeBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const backButton = document.getElementById('backBtn');

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
    if (settingsBtn) {
        settingsBtn.onclick = function () {
            handleSwitchView(1);
        };
    }
});