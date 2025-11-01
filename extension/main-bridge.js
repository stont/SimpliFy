// main-bridge.js - Runs in MAIN world, can access DOM

// Global settings variables, initialized with defaults
let currentSimplificationLevel = 50;
let currentDisableAnimations = false;
let currentBlockBadWords = false;
let currentAutomaticSimplification = false;
let isAutomaticSimplificationActive = false;
let enableVoiceCommandReadingCurrent = false;
let shouldAutoReadPageCurrent = false;

// Autism text simplification logic
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
            if (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim() && /[a-zA-Z]/.test(child.nodeValue) && !/:\/|www\./.test(child.nodeValue) && (!child.parentNode || !['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'SVG'].includes(child.parentNode.nodeName))) {
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
let permissionRequestId = 0;

function requestAIPermission() {
    return new Promise((resolve) => {
        const id = ++permissionRequestId;
        window.postMessage({ type: 'request-ai-permission', id }, '*');
        const listener = (event) => {
            if (event.data.type === 'ai-permission-response' && event.data.id === id) {
                window.removeEventListener('message', listener);
                resolve(event.data.granted);
            }
        };
        window.addEventListener('message', listener);
    });
}

function releaseAIPermission() {
    const id = ++permissionRequestId;
    window.postMessage({ type: 'release-ai-permission', id }, '*');
}

function enqueueAIRewrite(task) {
    return new Promise((resolve, reject) => {
        aiRewriteQueue.push({ task, resolve, reject });
        console.log('[MAIN-BRIDGE] Task enqueued. Queue length:', aiRewriteQueue.length);
        processAIRewriteQueue();
    });
}

async function processAIRewriteQueue() {
    console.log('[MAIN-BRIDGE] processAIRewriteQueue called. Active:', aiRewriteActive, 'Queue length:', aiRewriteQueue.length);
    if (aiRewriteActive || aiRewriteQueue.length === 0) return;
    // Request permission from background to ensure only one AI operation globally
    const granted = await requestAIPermission();
    console.log('[MAIN-BRIDGE] AI permission granted:', granted);
    if (!granted) {
        // Permission denied, retry after a short delay
        setTimeout(processAIRewriteQueue, 1000);
        return;
    }
    aiRewriteActive = true;
    const { task, resolve, reject } = aiRewriteQueue.shift();
    try {
        const result = await task();
        resolve(result);
    } catch (e) {
        reject(e);
    } finally {
        aiRewriteActive = false;
        // Release permission
        releaseAIPermission();
        processAIRewriteQueue();
        console.log('[MAIN-BRIDGE] AI rewrite task completed. Queue length:', aiRewriteQueue.length);
    }
}

// AI/caching logic: request rewrite using Gemini Nano Rewriter API directly in client, now queued
let sharedRewriter = null;
let sharedRewriterOptions = null;
let sharedAbortController = null;

// AI rules for rewriting
const aiRules = "Do not change proper names, dates, numbers, or technical terms. Preserve the original meaning and structure as much as possible. If the text is already simple, leave it unchanged. Do not define terms, explain concepts, or summarize content. Only simplify words and phrases within the existing sentences. Ignore code snippets, programming code, or technical code.";

let summarizer;

async function simplifySelectedText(original, simplifyLevel, filterBadWords) {
    console.log('[MAIN-BRIDGE] simplifySelectedText called with text length:', original?.length, 'level:', simplifyLevel, 'filterBadWords:', filterBadWords);
    if (!('Rewriter' in self)) {
        console.error('[CLIENT] Gemini Nano Rewriter API not available.');
        return original;
    }
    const available = await Rewriter.availability();
    console.log('[MAIN-BRIDGE] Rewriter availability:', available);
    if (available === 'unavailable') {
        console.error('[CLIENT] Rewriter API is not usable.');
        console.error('[CLIENT] Rewriter API is not usable.');
        return original;
    }
    // Use the prompt from the slider
    let prompt = getSimplificationPrompt(simplifyLevel);
    const options = {
        tone: 'as-is',
        length: 'as-is',
        format: 'plain-text',
        sharedContext: aiRules
    };

    if (filterBadWords) {
        prompt += ' Also, filter out any bad words (cursed words).';
    }
    console.log('prompt:', prompt);
    const rewriter = await Rewriter.create(options);
    try {
        const rewrittenText = await rewriter.rewrite(original, { context: prompt });
        console.log('[AI Transform]\nOriginal:', original, '\nRewritten:', rewrittenText);
        return rewrittenText;
    } catch (error) {
        console.error('[CLIENT] Rewrite error:', error);
        return original;
    } finally {
        rewriter.destroy();
    }
}

async function generateSummary(text, options) {
    console.log('[MAIN-BRIDGE] generateSummary called with text length: ' + (text?.length || 0) + ', options: ' + JSON.stringify(options));
    console.log('[MAIN-BRIDGE] generateSummary called with text length:', text?.length, 'options:', options);
    try {
        const availability = await Summarizer.availability();
        console.log('[MAIN-BRIDGE] Summarizer availability:', availability);
        if (availability === 'unavailable') {
            console.log('Summarizer API is not available');
            return 'Summarizer API is not available';
        }
        if (availability === 'available') {
            summarizer = await Summarizer.create(options);
        } else {
            summarizer = await Summarizer.create(options);
            if (typeof summarizer.addEventListener === 'function') {
                summarizer.addEventListener('downloadprogress', (e) => {
                    console.log(`Downloaded ${e.loaded * 100}%`);
                });
            }
            if (summarizer.ready) {
                await summarizer.ready;
            }
        }
        const summary = await summarizer.summarize(text);
        console.log('[MAIN-BRIDGE] Summary generation completed successfully');
        summarizer.destroy();
        return summary;
    } catch (e) {
        console.log('Summary generation failed');
        console.error(e);
        return 'Error: ' + e.message;
    }
}

async function rewriteTextViaAI(original, simplifyLevel, filterBadWords) {
    return enqueueAIRewrite(async () => {

        console.log('[MAIN-BRIDGE] rewriteTextViaAI called with text length:', original?.length, 'level:', simplifyLevel, 'filterBadWords:', filterBadWords);
        if (!isAutomaticSimplificationActive) {
            throw new Error('Cancelled');
        }
        if (!('Rewriter' in self)) {
            console.error('[CLIENT] Gemini Nano Rewriter API not available.');
            return original;
        }
        const available = await Rewriter.availability();
        if (available === 'unavailable') {
            console.error('[CLIENT] Rewriter API is not usable.');
            return original;
        }
        // Use the prompt from the slider
        let prompt = getSimplificationPrompt(simplifyLevel);
        const options = {
            tone: 'as-is',
            length: 'as-is',
            format: 'plain-text',
            sharedContext: aiRules
        };

        if (filterBadWords) {
            prompt += ' Also, filter out any bad words (cursed words).';
        }
        //console.log('prompt:', prompt);
        if (!isAutomaticSimplificationActive) {
            throw new Error('Cancelled');
        }
        if (!sharedRewriter || JSON.stringify(sharedRewriterOptions) !== JSON.stringify(options)) {
            if (sharedRewriter) sharedRewriter.destroy();
            sharedAbortController = new AbortController();
            sharedRewriter = await Rewriter.create({ ...options, signal: sharedAbortController.signal });
            sharedRewriterOptions = options;
            console.log('[MAIN-BRIDGE] Created new shared Rewriter instance with options:', options);
        }
        try {
            const rewrittenText = await sharedRewriter.rewrite(original, { context: prompt });
            //console.log('[AI Transform]\nOriginal:', original, '\nRewritten:', rewrittenText);
            if (rewrittenText.includes('[AI ERROR]')) {
                console.error('AI returned an error message:: ', rewrittenText);
                return original;
            }
            return rewrittenText;
        } catch (error) {
            console.error('[CLIENT] Rewrite error:', error);
            return original;
        }
    });
}


async function replaceAllTextNodesWithAI(simplifyLevel, filterBadWords) {
    console.log('[MAIN-BRIDGE] replaceAllTextNodesWithAI called with level:', simplifyLevel, 'filterBadWords:', filterBadWords);
    if (!document.body) {
        console.warn("Body not yet available. Retrying...");
        setTimeout(() => {
            replaceAllTextNodesWithAI(simplifyLevel, filterBadWords);
        }, 300);
        return;
    }

    if (simplifyLevel === 0) {
        return;
    }
    let cache = {};
    let cacheChanged = false;
    try { cache = JSON.parse(localStorage.getItem('rewriteCacheV1')) || {}; } catch { }
    const nodes = collectTextNodes(document.body);
    for (const node of nodes) {
        if (!isAutomaticSimplificationActive) break;
        const key = `${simplifyLevel}:${node.nodeValue}`;
        if (cache[key]) {
            node.nodeValue = cache[key];
        } else {
            try {
                const rewritten = await rewriteTextViaAI(node.nodeValue, simplifyLevel, filterBadWords);
                if (isAutomaticSimplificationActive) {
                    node.nodeValue = rewritten;
                    cache[key] = rewritten;
                    cacheChanged = true;
                }
            } catch (e) {
                if (e.message === 'Cancelled') {
                    // Do not update the node
                } else {
                    console.error('[CLIENT] Rewrite error:', e);
                    if (isAutomaticSimplificationActive) {
                        node.nodeValue = '[AI ERROR] ' + e.message;
                        cache[key] = node.nodeValue;
                        cacheChanged = true;
                    }
                }
            }
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

});

// Visual content summarization
let sharedVisualAbortController = null;
let sharedPromptSession = null;
async function promptText(pageContent) {
    console.log('abount to prompt text:: ', pageContent)
    if (!sharedPromptSession) {
        sharedVisualAbortController = new AbortController();
        sharedPromptSession = await LanguageModel.create({
            initialPrompts: [
                {
                    role: 'system',
                    content:
                        `You are a skilled analyst who correlates patterns across multiple images.
                    Your task:
                        1. Identify the main purpose of the page (e.g., article, news story, product page, blog post, documentation, etc.).
                        2. Summarize the most important information in a clear and conversational tone.
                        3. Describe any key images, links, or buttons (if mentioned in the text).
                        4. Ignore ads, navigation menus, sidebars, or footers.
                        5. Use simple, natural English suitable for text-to-speech.
                        6. Limit response to about 250 words unless the page is very detailed.

                        When responding:
                        - Start with a short overview: "This page is about..."
                        - Then describe main content sections in a logical order.
                        - End with: "Thats the main content of the page."

                        

                    `,
                },
            ],
            expectedInputs: [
                { type: "text", languages: ["en"] }
            ],
            expectedOutputs: [
                { type: "text", languages: ["en"] }
            ]
        });
        console.log('Prompt session created')
    }
    let result = ''
    const usage = await sharedPromptSession.measureInputUsage(promptText);
    console.log('Input usage:: ', usage)
    // Check session token qouta 
    const pageTextChunks = chunkTextByQuota(pageContent, sharedPromptSession, usage)
    try {
        for (const chunk of pageTextChunks) {
            result += await sharedPromptSession.prompt(`Here is the extracted text content of the page:
                            ---
                            ${chunk}
                            ---
                            Now, generate your response.`, {
                signal: sharedVisualAbortController.signal
            });
        }

        console.log('============ Prompt result======= ', result)
        const chunks = chunkText(result);
        sendToExtension(chunks)
    } catch (error) {
        console.error('[CLIENT] Prompt error:', error);
        return
    }
    // for await (const chunk of stream) {
    // console.log(chunk);

    // }


}

function chunkText(text, maxChars = 700) {
    const paragraphs = text.split(/\n{1,}/).map(p => p.trim()).filter(Boolean);
    const chunks = [];
    let cur = '';
    for (const p of paragraphs) {
        if ((cur + '\n\n' + p).length > maxChars) {
            if (cur) { chunks.push(cur.trim()); cur = p; }
            else {
                // paragraph itself large: slice
                for (let i = 0; i < p.length; i += maxChars) {
                    chunks.push(p.slice(i, i + maxChars));
                }
                cur = '';
            }
        } else {
            cur = cur ? (cur + '\n\n' + p) : p;
        }
    }
    if (cur) chunks.push(cur.trim());
    console.log("final chunk:::", chunks)
    return chunks;
}

function safeGetVisibleText() {
    try {
        // Ensure DOM is ready
        if (!document.body) {
            console.warn("Body not yet available. Retrying...");
            setTimeout(safeGetVisibleText, 300);
            return;
        }

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    // Filter out invisible, script, style, and irrelevant nodes
                    const parent = node.parentNode;
                    if (
                        !parent ||
                        ["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "OBJECT"].includes(parent.nodeName)
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    const text = node.nodeValue?.trim() || "";
                    if (text.length === 0) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                },
            }
        );

        let textContent = "";
        let node;
        while ((node = walker.nextNode())) {
            textContent += node.nodeValue.trim() + " ";
        }


        return textContent;
    } catch (err) {
        console.error("❌ Error using TreeWalker:", err);
        return "";
    }
}

function getEstimatedTokens(text) {
    // Approximation based on average English tokenization
    if (!text) return 0;

    // Trim whitespace and normalize
    const cleanText = text.trim();

    // 1 token ≈ 4 characters (as per OpenAI tiktoken average)
    const charCount = cleanText.length;
    console.log('Character count for token estimation:', charCount);

    // Calculate estimated tokens
    const estimatedTokens = Math.ceil(charCount / 4);

    return estimatedTokens;
}

function chunkTextByQuota(text, session, usage) {

    // const estimatedTokens = getEstimatedTokens(text);
    console.log('Estimated tokens for text:', estimatedTokens);
    console.log('Session quota:', session.inputQuota, 'currnet usage:', session.inputUsage, 'measured usage:', usage);
    const maxTokens = session.inputQuota - (session.inputUsage + usage + 500); // leave room for response
    console.log('Max tokens available for input:', maxTokens);

    if (estimatedTokens <= maxTokens) {
        return [text];
    }
    console.log('Text exceeds quota, chunking required.');
    const words = text.split(/\s+/);
    const wordsPerChunk = Math.floor(maxTokens / 1.3);
    const chunks = [];
    console.log('Chunking text into pieces of approx', wordsPerChunk, 'words each.');
    for (let i = 0; i < words.length; i += wordsPerChunk) {
        chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
    }
    console.log('Text chunked into', chunks.length, 'chunks due to quota limits.');
    return chunks;
}

// // Run safely after DOM is ready
// if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", safeGetVisibleText);
// } else {
//     safeGetVisibleText();
// }


// main-bridge.js
function sendToExtension(data) {
    console.log('[MAIN-BRIDGE] Sending data to extension, length:', data?.length);
    window.postMessage({
        type: "from-main-bridge",
        message: data
    }, "*");
}


window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'settings-init') {
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
            isAutomaticSimplificationActive = currentAutomaticSimplification;
        }
        if (event.data.data.enableVoiceCommandReading !== undefined) {
            enableVoiceCommandReadingCurrent = event.data.data.enableVoiceCommandReading;
        }
        if (event.data.data.shouldAutoReadPage !== undefined) {
            shouldAutoReadPageCurrent = event.data.data.shouldAutoReadPage;
        }
        // Apply settings after loading
        if (currentDisableAnimations) {
            removeAnimationsFromPage();
        }
        if (currentAutomaticSimplification && currentSimplificationLevel > 0) {
            replaceAllTextNodesWithAI(currentSimplificationLevel, currentBlockBadWords);
        }
        if (shouldAutoReadPageCurrent) {
            const pageContent = safeGetVisibleText();
            console.log('Page content:: ', pageContent)
            console.log('[MAIN] Extracted page content length for auto-read:', pageContent.length);
            promptText(pageContent);
        }
        return;
    }
    if (event.data && event.data.type === 'settings-update') {
        console.log('Settings update received: ', event.data.data.autismSimplificationLevel);
        console.log('Settings update received: ', event.data.data);
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
            const wasActive = currentAutomaticSimplification;
            if (!event.data.data.autismAutomaticSimplification) {
                // Disabling automatic simplification: abort ongoing AI operations and clean up
                isAutomaticSimplificationActive = false;
                if (sharedAbortController) {
                    sharedAbortController.abort();
                }
                if (sharedRewriter) {
                    sharedRewriter.destroy();
                    sharedRewriter = null;
                }
                sharedRewriterOptions = null;
                // Clear the queue to stop pending tasks
                aiRewriteQueue.length = 0;
                aiRewriteActive = false;
            } else {
                isAutomaticSimplificationActive = true;
                if (!wasActive && currentSimplificationLevel > 0) {
                    replaceAllTextNodesWithAI(currentSimplificationLevel, currentBlockBadWords);
                }
            }
            currentAutomaticSimplification = event.data.data.autismAutomaticSimplification;
        }

        if (event.data.data.shouldAutoReadPage !== undefined) {
            const newValue = event.data.data.shouldAutoReadPage;
            console.log('shouldAutoReadPage changed:', shouldAutoReadPageCurrent, '->', newValue);
            if (shouldAutoReadPageCurrent !== newValue) {
                shouldAutoReadPageCurrent = newValue
                console.log('Updated shouldAutoReadPageCurrent to:', shouldAutoReadPageCurrent);
                if (shouldAutoReadPageCurrent) {
                    const pageContent = safeGetVisibleText();
                    console.log('[MAIN] Extracted page content length for auto-read:', pageContent.length);
                    promptText(pageContent);
                } else {
                    if (sharedVisualAbortController) {
                        sharedVisualAbortController.abort();
                    }
                    if (sharedPromptSession) {
                        sharedPromptSession.destroy();
                        sharedPromptSession = null;
                    }
                }
            }
        }
        if (event.data.data.enableVoiceCommandReading !== undefined) {
            enableVoiceCommandReadingCurrent = event.data.data.enableVoiceCommandReading;
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
    if (event.data && event.data.type === 'summarize-text') {
        console.log('[MAIN-BRIDGE] Handling summarize-text, text length:', event.data.text?.length);
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            console.log('[MAIN-BRIDGE] No selection range for summarize-text');
            return;
        }
        const range = selection.getRangeAt(0);
        const text = event.data.text;
        const options = {
            sharedContext: 'this is a website',
            type: 'tldr',
            length: 'medium'
        };
        console.log('[MAIN-BRIDGE] Calling generateSummary');
        generateSummary(text, options).then(summary => {
            console.log('[MAIN-BRIDGE] Summary generated, replacing selection');
            range.deleteContents();
            range.insertNode(document.createTextNode(summary));
        }).catch((error) => {
            console.error('[MAIN-BRIDGE] Summary generation failed:', error);
            // Leave original on error
        });
    }
    if (event.data && event.data.type === 'simplify-text') {
        console.log('[MAIN-BRIDGE] Handling simplify-text, text length:', event.data.text?.length);
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            console.log('[MAIN-BRIDGE] No selection range for simplify-text');
            return;
        }
        const range = selection.getRangeAt(0);
        const text = event.data.text;
        console.log('[MAIN-BRIDGE] Calling simplifySelectedText with level:', currentSimplificationLevel, 'blockBadWords:', currentBlockBadWords);
        simplifySelectedText(text, currentSimplificationLevel, currentBlockBadWords).then(simplified => {
            console.log('[MAIN-BRIDGE] Text simplified, replacing selection');
            range.deleteContents();
            range.insertNode(document.createTextNode(simplified));
        }).catch((error) => {
            console.error('[MAIN-BRIDGE] Text simplification failed:', error);
            // Leave original on error
        });
    }
    if (event.data && event.data.type === 'retry-ai-queue') {
        processAIRewriteQueue();
    }
    if (event.data && event.data.type === 'ai-permission-response') {
        // handled in requestAIPermission
    }
    if (event.data && event.data.type === 'ai-permission-released') {
        // handled
    }
});

//Key logger
document.addEventListener("keydown", (event) => {
    // Spacebar toggles reading
    if (event.code === "Space") {
       // event.preventDefault(); // stop page scroll
        console.log('[MAIN-BRIDGE] Space bar event to bridge');
        window.postMessage({
            type: "SPACE_BAR_CLICKED",
        }, "*");
    }
});

