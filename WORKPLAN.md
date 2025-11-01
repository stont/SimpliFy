# SimpliFy

## Your accessibility companion

### Supercharging everyday accessibility.

# Work Plan: Universal Web Access Chrome Extension

## Architecture
- **Manifest V3 Chrome Extension**
- **Side Panel UI**: All features accessible from a persistent side panel
- **Pages**:
  - Homepages for Blindness, Deafness, Autism (see samples)
  - Settings/configuration pages for each mode
  - General settings page (language, accessibility options)
  - Saved/bookmarked content page
  - Audio upload/transcription page
  - Writer page for blind users
  - Gmail reading page
- **No backend**: All logic, storage, and processing is client-side (localStorage, IndexedDB)

## Flow
1. **User installs extension**
2. **Side panel opens on any webpage**
3. **User configures health condition and general settings**
4. **Extension adapts UI and features based on selected mode**
   - Blindness: Text-to-speech, audio playback, summarization, voice settings
   - Deafness: Media transcription, adult word filtering, live audio transcribe
   - Autism: Text simplification, emotional tone labeling, navigation aids
5. **User interacts with home/settings pages for each mode**
6. **User can save/bookmark content, upload audio, use writer, or read Gmail**

## UI/UX
- Sample HTML/CSS from `samples/` folder as reference for each page
- Images and icons for each accessibility mode
- Footer with accessibility options (read aloud, etc.)

## Data & APIs
- All APIs (Rewriter, Summarizer, Prompt, Proofreader) simulated locally
- No network requests; all processing is offline
- Use browser storage for user settings and saved content

## Development Steps
1. Scaffold Chrome extension (Manifest V3, basic side panel)
2. Implement config/home/settings pages for each mode using sample HTML/CSS
3. Add accessibility features (text simplification, TTS, transcription, etc.)
4. Implement local storage for settings and bookmarks
5. Polish UI/UX, test offline functionality
6. Document usage and accessibility features

## References
- See `samples/` for page layouts and design inspiration
- See `instructions.txt` for feature details and scenarios
