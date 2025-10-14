// main-bridge.js - Runs in MAIN world, can access DOM

// Helper to get current simplification level
function getSimplificationLevel() {
    return Number(localStorage.getItem('autismSimplificationLevel') || 50);
}
// Helper to generate AI prompt based on slider value
function getSimplificationPrompt(level) {
    if (level == 0) return 'Do not change the text.';
    if (level >= 10 && level <= 40) return 'Slightly simplify the text for someone with autism to easily understand.';
    if (level == 50) return 'Simplify the text to a medium level for accessibility.';
    if (level >= 60) return 'Make the text super simple and easy, suitable for kids or those needing maximum clarity.';
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

async function rewriteTextViaAI(original, simplifyLevel) {
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
        const prompt = getSimplificationPrompt(simplifyLevel);
        const options = {
            tone: 'as-is',
            length: 'as-is',
            format: 'plain-text',
            sharedContext: prompt
        };
        console.log('[CLIENT] Rewriter options:', options.sharedContext);
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
async function replaceAllTextNodesWithAI(simplifyLevel) {
    if (simplifyLevel === 0) {
        return;
    }
    let cache = {};
    try { cache = JSON.parse(localStorage.getItem('rewriteCacheV1')) || {}; } catch { }
    const nodes = collectTextNodes(document.body);
    for (const node of nodes) {
        const key = `${simplifyLevel}:${node.nodeValue}`;
        if (cache[key]) {
            console.log(`[CACHE HIT] Before: "${node.nodeValue}" | After: "${cache[key]}"`);
            node.nodeValue = cache[key];
            console.log(`[CACHE RETRIEVED] Key: ${key}`);
        } else {
            console.log(`[AI REWRITE] Processing: "${node.nodeValue}" at time ${new Date().toISOString()}`);
            const rewritten = await rewriteTextViaAI(node.nodeValue, simplifyLevel);
            console.log(`[AI REWRITE] Before: "${node.nodeValue}" | After: "${rewritten}"`);
            node.nodeValue = rewritten;
            cache[key] = rewritten;
            localStorage.setItem('rewriteCacheV1', JSON.stringify(cache));
            console.log(`[CACHE SAVED] Key: ${key}`);
        }
    }
}

// On page load, use the saved simplification level
window.addEventListener('DOMContentLoaded', () => {    
    const simplifyLevel = getSimplificationLevel();
    replaceAllTextNodesWithAI(simplifyLevel);
});

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'autism-simplify-panel') {
        if (event.data.clearCache) {
            localStorage.removeItem('rewriteCacheV1');
            return;
        }
        // Handle initial value sync from settings and Save the value to storage immediately
        localStorage.setItem('autismSimplificationLevel', event.data.simplifyLevel);
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