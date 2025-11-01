// Global results object to keep state for all models
const allModelResults = {}

// Utility to check model existence and availability
async function checkAllModelStates(onlyModel) {
    const models = [
        {
            name: 'Summarizer',
            flag: 'chrome://flags/#summarization-api-for-gemini-nano'
        },
        {
            name: 'Rewriter',
            flag: 'chrome://flags/#rewriter-api-for-gemini-nano'
        },
        {
            name: 'Writer',
            flag: 'chrome://flags/#writer-api-for-gemini-nano'
        }
    ];
    let results = {};
    const modelsToCheck = onlyModel ? models.filter(m => m.name === onlyModel) : models;
    for (const { name } of modelsToCheck) {
        if (!(name in self)) {
            results[name] = { exists: false, available: false, state: 'not found' };
            continue;
        }
        const model = self[name];
        if (typeof model === 'undefined') {
            results[name] = { exists: false, available: false, state: 'undefined' };
            continue;
        }
        if (typeof model.availability !== 'function') {
            results[name] = { exists: true, available: false, state: 'no availability fn' };
            continue;
        }
        try {
            const result = await model.availability({
                expectedInputLanguages: ["en-US"],
                outputLanguage: "en-US",
            });
            let state = '';
            if (typeof result === 'string') state = result;
            else if (result && typeof result === 'object') {
                state = result.state || result.status || result.availability || '';
            }
            results[name] = {
                exists: true,
                available: String(state).toLowerCase() === 'available',
                state: state
            };
        } catch (e) {
            results[name] = { exists: true, available: false, state: 'error' };
            console.warn(`${name} availability check failed:`, e);
        }
    }
    // Merge results into global allModelResults
    Object.assign(allModelResults, results);
    //Log the results
    console.log('Model availability results:', allModelResults);
    // Update the UI table with all models and the full results
    updateApiStatusTable(models, allModelResults);
    // If all APIs are available, navigate to onboard/index.html
    const allAvailable = models.every(({ name }) => allModelResults[name] && allModelResults[name].available);
    if (allAvailable) {
        window.location.href = '../onboard/index.html';
    }
    return allModelResults;
}

function updateApiStatusTable(models, results) {
    const table = document.getElementById('api-status-table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    // Get the instruction area
    const flagInstruction = document.getElementById('flag-instruction');
    if (flagInstruction) flagInstruction.style.display = 'none';
    for (const { name, flag } of models) {
        const res = results[name] || {};
        const tr = document.createElement('tr');
        // API Name
        const tdName = document.createElement('td');
        tdName.textContent = name;
        tr.appendChild(tdName);
        // Action
        const tdAction = document.createElement('td');
        if (!res.exists || res.state === 'undefined' || res.state === 'not found') {
            const btn = document.createElement('button');
            btn.textContent = 'Info';
            btn.className = 'button-primary';
            btn.setAttribute('data-action', 'info');
            btn.setAttribute('data-api', name);
            btn.setAttribute('data-flag', flag);
            tdAction.appendChild(btn);
        } else if (res.state === 'downloadable') {
            const btn = document.createElement('button');
            btn.textContent = 'Download Model';
            btn.className = 'button-primary';
            btn.setAttribute('data-action', 'download');
            btn.setAttribute('data-api', name);
            btn.setAttribute('data-flag', flag);
            btn.setAttribute('data-download-btn', 'true');
            tdAction.appendChild(btn);
        } else {
            tdAction.textContent = '';
        }
        tr.appendChild(tdAction);
        // Status
        const tdStatus = document.createElement('td');
        if (res.available) {
            tdStatus.textContent = '✔️ Available';
            tdStatus.style.color = 'green';
        } else if (res.state && String(res.state).toLowerCase().includes('downloading')) {
            let percent = '';
            const match = String(res.state).match(/(\d+)%/);
            if (match) percent = match[1] + '%';
            tdStatus.textContent = 'Downloading' + (percent ? ' ' + percent : '');
            tdStatus.style.color = 'orange';
        } else if (res.state === 'unavailable' || res.state === 'downloadable') {
            tdStatus.textContent = 'Not Available';
            tdStatus.style.color = 'red';
        } else {
            tdStatus.textContent = 'Not Available';
            tdStatus.style.color = 'red';
        }
        tr.appendChild(tdStatus);
        tbody.appendChild(tr);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const configureGeminiBtn = document.getElementById('btn-configure-gemini')
    if (configureGeminiBtn) {
        configureGeminiBtn.addEventListener('click', async () => {
            // Show the downloading/status screen
            document.getElementById('screen-not-detected').style.display = 'none';
            const downloadingScreen = document.getElementById('screen-downloading');
            if (downloadingScreen) downloadingScreen.style.display = 'flex';
            // Run the model checks
            await checkAllModelStates();
        });
    }
    // Event delegation for table action buttons
    const table = document.getElementById('api-status-table');
    if (table) {
        table.addEventListener('click', async (e) => {
            const btn = e.target.closest('.button-primary');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const api = btn.getAttribute('data-api');
            const flag = btn.getAttribute('data-flag');
            const flagInstruction = document.getElementById('flag-instruction');
            if (action === 'info') {
                if (flagInstruction) {
                    flagInstruction.innerHTML = `<b>To enable the ${api} API:</b><br>1. Open a new tab in Chrome.<br>2. Paste <code>${flag}</code> in the address bar and press Enter.<br>3. Set the flag to <b>Enabled</b>.<br>4. Restart Chrome for changes to take effect.`;
                    flagInstruction.style.display = 'block';
                }
            } else if (action === 'download') {
                if (!navigator.userActivation.isActive) {
                    alert('Please interact with the page (e.g., click) to activate model download.');
                    return;
                }
                const ModelCtor = self[api];
                const tdStatus = btn.parentElement.nextElementSibling;
                // Hide all Download Model buttons while downloading
                document.querySelectorAll('button[data-action="download"]').forEach(b => b.style.display = 'none');
                if (typeof ModelCtor.create === 'function') {
                    try {
                        await ModelCtor.create({
                            expectedInputLanguages: ["en-US"],
                            outputLanguage: "en-US",
                            monitor(m) {
                                m.addEventListener('downloadprogress', e => {
                                    if (tdStatus) {
                                        tdStatus.textContent = `Downloading ${(e.loaded * 100).toFixed(0)}%`;
                                        tdStatus.style.color = 'orange';
                                    }
                                });
                            }
                        });
                        // After download, update only the current model's state
                        await checkAllModelStates(api);
                    } catch (err) {
                        if (tdStatus) {
                            tdStatus.textContent = 'Download failed';
                            tdStatus.style.color = 'red';
                        }
                        // Unhide all Download Model buttons if download fails
                        document.querySelectorAll('button[data-action="download"]').forEach(b => b.style.display = '');
                        console.error(`Model download failed for ${api}:`, err);
                    }
                }
                // After checkAllModelStates, only the required download buttons will be shown
            }
        });
    }
});