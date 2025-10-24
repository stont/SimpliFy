# Gemini Nano Accessibility Rewriter Extension

This Chrome extension demonstrates a robust, on-device AI-powered text rewriter for accessibility, using the Gemini Nano Rewriter API. It is designed to simplify and adapt web content for users with cognitive or reading challenges (e.g., autism), and features a modern UI, cache management, and a secure, efficient architecture.

---

## How It Works

- **Side Panel UI**: The extension provides a side panel with controls for the simplification level, a manual rewrite trigger, and cache management.
- **Content Script (main-bridge.js)**: Injected into every page, this script collects all visible text nodes, manages a rewrite cache, and coordinates AI rewriting.
- **AI Rewriting (Client-side)**: The Gemini Nano Rewriter API is called directly from the main world (client), with all rewrite requests queued to ensure only one AI operation runs at a time (FIFO).
- **Cache**: Rewritten results are cached in `localStorage` for efficiency. The cache can be cleared from the UI.
- **Logs**: All logs from the side panel are relayed to the main world for easy debugging.

---

## Implementation Details

### 1. Fetching Web Content Elements (Algorithm)

To rewrite all visible text on a page, we use a depth-first search (DFS) to collect all text nodes:

```js
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
```
- **Purpose**: This ensures we gather every visible text node, regardless of nesting, for AI rewriting.
- **Usage**: Called on `document.body` to get all text nodes for processing.

### 2. AI Rewriting Strategy

- **Queueing**: All AI rewrite requests are placed in a FIFO queue. Only one rewrite runs at a time, preventing overloading and ensuring order.
- **Rewriter Instance Reuse**: A single `Rewriter` instance is reused for all rewrites in a batch (as long as options don't change), improving efficiency.
- **Cache**: Before calling the AI, the extension checks a cache (`localStorage`). If a rewritten result exists, it is used immediately.
- **AI Call**: If not cached, the extension calls the Gemini Nano Rewriter API:

```js
async function rewriteTextViaAI(original, simplifyLevel) {
    return enqueueAIRewrite(async () => {
        if (!('Rewriter' in self)) return '[AI ERROR] Gemini Nano Rewriter API not available.';
        const available = await Rewriter.availability();
        if (available === 'unavailable') return '[AI ERROR] Rewriter API is not usable.';
        const options = {
            tone: 'as-is',
            length: 'as-is',
            format: 'plain-text',
            sharedContext: 'Simplify this text for people with autism. Level: ' + simplifyLevel
        };
        if (!sharedRewriter || JSON.stringify(sharedRewriterOptions) !== JSON.stringify(options)) {
            if (sharedRewriter) sharedRewriter.destroy();
            sharedAbortController = new AbortController();
            sharedRewriter = await Rewriter.create({ ...options, signal: sharedAbortController.signal });
            sharedRewriterOptions = options;
        }
        try {
            const rewrittenText = await sharedRewriter.rewrite(original, { context: 'User requested rewrite.' });
            return rewrittenText;
        } catch (error) {
            return '[AI ERROR] Rewrite failed: ' + error.message;
        }
    });
}
```
- **FIFO Queue**: The `enqueueAIRewrite` and `processAIRewriteQueue` functions ensure only one AI operation runs at a time.
- **Simplify Level**: If the simplify level is 0, AI rewriting is skipped.
- **Cache Update**: After a successful rewrite, the result is cached for future use.

### 3. UI and User Controls

- **Side Panel**: Users can set the simplification level, trigger rewriting, and clear the cache.
- **Logs**: All logs from the side panel are relayed to the main world and shown in the browser console for transparency and debugging.

### 4. Error Handling and Robustness

- **Graceful Fallbacks**: If the AI API is unavailable, the extension logs an error and skips rewriting for that node.
- **Abort Support**: If the user clears the cache or changes settings, any in-progress AI operations are aborted and the rewriter instance is reset.

---

## Summary

This extension demonstrates a robust, accessible, and efficient approach to rewriting web content using on-device AI. It is designed for real-world accessibility needs and follows best practices for Chrome extension development and AI API usage.

For more details, see the code in `main-bridge.js` and `sidepanel.js`.
