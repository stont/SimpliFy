// main-bridge.js - Runs in MAIN world, can access DOM

// Global settings variables, initialized with defaults
let currentSimplificationLevel = 50;
let currentDisableAnimations = false;
let currentBlockBadWords = false;
let currentAutomaticSimplification = false;

// Helper to get current simplification level
function getSimplificationLevel() {
    return currentSimplificationLevel;
}

//Get current value of disable animations and block bad words in boolean form
function getDisableAnimations() {
    return currentDisableAnimations;
}
function getBlockBadWords() {
    return currentBlockBadWords;
}
function getAutomaticSimplification() {
    return currentAutomaticSimplification;
}

// Helper to generate AI prompt based on slider value
function getSimplificationPrompt(level) {
    level = Number(level);
    if (level === 0) return 'Do not change the text.';
    if (level > 0 && level < 50) return 'Slightly simplify the text for someone with autism to easily understand.';
    if (level === 50) return 'Simplify the text to a medium level for accessibility.';
    if (level > 50) return 'Make the text as simple and clear as possible, suitable for maximum accessibility.';
    return 'Simplify the text.';
}

// Utility: DFS to collect all text nodes
function collectTextNodes(root) {
    const nodes = [];
    function dfs(node) {
        for (let child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim()) {
                nodes.push(child);
            } else {
                dfs(child);
            }
        }
    }
    dfs(root);
    return nodes;
}

// FIFO queue for AI rewrite requests (client-side)
const aiRewriteQueue = [];
let aiRewriteActive = false;

function enqueueAIRewrite(task) {
    return new Promise((resolve, reject) => {
        aiRewriteQueue.push({ task, resolve, reject });
        processAIRewriteQueue();
    });
}

async function processAIRewriteQueue() {
    if (aiRewriteActive || aiRewriteQueue.length === 0) return;
    aiRewriteActive = true;
    const { task, resolve, reject } = aiRewriteQueue.shift();
    try {
        const result = await task();
        resolve(result);
    } catch (e) {
        reject(e);
    } finally {
        aiRewriteActive = false;
        processAIRewriteQueue();
    }
}

// AI/caching logic: request rewrite using Gemini Nano Rewriter API directly in client, now queued
let sharedRewriter = null;
let sharedRewriterOptions = null;
let sharedAbortController = null;

async function rewriteTextViaAI(original, simplifyLevel, filterBadWords) {
    return enqueueAIRewrite(async () => {
        if (!('Rewriter' in self)) {
            console.error('[CLIENT] Gemini Nano Rewriter API not available.');
            return '[AI ERROR] Gemini Nano Rewriter API not available.';
        }
        const available = await Rewriter.availability();
        if (available === 'unavailable') {
            console.error('[CLIENT] Rewriter API is not usable.');
            return '[AI ERROR] Rewriter API is not usable.';
        }
        // Use the prompt from the slider
        let prompt = getSimplificationPrompt(simplifyLevel);
        const options = {
            tone: 'as-is',
            length: 'as-is',
            format: 'plain-text',
            sharedContext: prompt
        };

        if (filterBadWords) {
            prompt += ' Also, filter out any bad words (cursed words).';
        }
        console.log('prompt:', prompt);
        if (!sharedRewriter || JSON.stringify(sharedRewriterOptions) !== JSON.stringify(options)) {
            if (sharedRewriter) sharedRewriter.destroy();
            sharedAbortController = new AbortController();
            sharedRewriter = await Rewriter.create({ ...options, signal: sharedAbortController.signal });
            sharedRewriterOptions = options;
        }
        try {
            const rewrittenText = await sharedRewriter.rewrite(original, { context: prompt });
            return rewrittenText;
        } catch (error) {
            console.error('[CLIENT] Rewrite error:', error);
            return '[AI ERROR] Rewrite failed: ' + error.message;
        }
    });
}

// Replace all text nodes with AI/cached rewrite (calls AI directly)
async function replaceAllTextNodesWithAI(simplifyLevel, filterBadWords) {
    if (simplifyLevel === 0) {
        return;
    }
    let cache = {};
    let cacheChanged = false;
    try { cache = JSON.parse(localStorage.getItem('rewriteCacheV1')) || {}; } catch { }
    const nodes = collectTextNodes(document.body);
    for (const node of nodes) {
        const key = `${simplifyLevel}:${node.nodeValue}`;
        if (cache[key]) {
            node.nodeValue = cache[key];
        } else {
            const rewritten = await rewriteTextViaAI(node.nodeValue, simplifyLevel, filterBadWords);
            node.nodeValue = rewritten;
            cache[key] = rewritten;
            cacheChanged = true;
        }
    }
    if (cacheChanged) {
        localStorage.setItem('rewriteCacheV1', JSON.stringify(cache));
    }
}

async function removeAnimationsFromPage() {
    const style = document.createElement('style');
    style.textContent = `
    * {
      animation: none !important;
      transition: none !important;
    }
    `;
    document.head.appendChild(style);

    // 2. Remove GIFs
    document.querySelectorAll('img[src$=".gif"]').forEach(img => img.remove());

    // 3. Stop and remove <lottie-player> components
    document.querySelectorAll('lottie-player').forEach(player => {
        if (typeof player.stop === 'function') player.stop();
        player.remove();
    });

    // 4. Stop and destroy lottie-web animations (if any)
    if (window.lottie && typeof window.lottie.getRegisteredAnimations === 'function') {
        const animations = window.lottie.getRegisteredAnimations();
        animations.forEach(anim => {
            if (typeof anim.stop === 'function') anim.stop();
            if (typeof anim.destroy === 'function') anim.destroy();
        });
    }

    // 5. Remove <canvas> elements (used by Lottie or other animations)
    document.querySelectorAll('canvas').forEach(canvas => canvas.remove());

    // 6. Remove SVG elements containing <animateTransform>
    document.querySelectorAll('svg').forEach(svg => {
        if (svg.querySelector('animateTransform')) {
            svg.remove();
        }
    });
}

// On page load, use the saved simplification level
window.addEventListener('DOMContentLoaded', () => {
    // Delay automatic actions until settings are received via message
});

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'autism-settings-init') {
        // Set global variables from chrome.storage data
        if (event.data.data.autismSimplificationLevel !== undefined) {
            currentSimplificationLevel = Number(event.data.data.autismSimplificationLevel);
        }
        if (event.data.data.autismDisableAnimations !== undefined) {
            currentDisableAnimations = event.data.data.autismDisableAnimations;
        }
        if (event.data.data.autismBlockBadWords !== undefined) {
            currentBlockBadWords = event.data.data.autismBlockBadWords;
        }
        if (event.data.data.autismAutomaticSimplification !== undefined) {
            currentAutomaticSimplification = event.data.data.autismAutomaticSimplification;
        }
        // Apply settings after loading
        if (currentDisableAnimations) {
            removeAnimationsFromPage();
        }
        if (currentAutomaticSimplification && currentSimplificationLevel > 0) {
            replaceAllTextNodesWithAI(currentSimplificationLevel, currentBlockBadWords);
        }
        return;
    }
    if (event.data && event.data.type === 'autism-settings-update') {
        // Update global variables from storage changes
        if (event.data.data.autismSimplificationLevel !== undefined) {
            currentSimplificationLevel = Number(event.data.data.autismSimplificationLevel);
        }
        if (event.data.data.autismDisableAnimations !== undefined) {
            currentDisableAnimations = event.data.data.autismDisableAnimations;
            if (currentDisableAnimations) {
                removeAnimationsFromPage();
            }
        }
        if (event.data.data.autismBlockBadWords !== undefined) {
            currentBlockBadWords = event.data.data.autismBlockBadWords;
        }
        if (event.data.data.autismAutomaticSimplification !== undefined) {
            currentAutomaticSimplification = event.data.data.autismAutomaticSimplification;
        }
        return;
    }
    if (event.data && event.data.type === 'autism-simplify-panel') {
        if (event.data.clearCache) {
            localStorage.removeItem('rewriteCacheV1');
            return;
        }
        return;
    }
    if (event.data && event.data.type === 'summary-panel') {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        // Replace the selected text with the summary
        range.deleteContents();
        range.insertNode(document.createTextNode(event.data.message));
    }
});