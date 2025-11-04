# SimpliFy

Your accessibility companion. Supercharging everyday accessibility.

**Demo Site:** [https://sites.google.com/view/simplifydemo/home](https://sites.google.com/view/simplifydemo/home)

**Hackathon:** This project is a submission for the [Google AI Chrome Extension Hackathon](https://googlechromeai2025.devpost.com/).

## Features

SimpliFy is a Chrome extension that provides a suite of tools to enhance web accessibility for users with diverse needs. The extension is built using modern web technologies and leverages the power of Google's Gemini Nano API to provide intelligent features.

### Core Technologies

*   **Gemini Nano:** The extension utilizes the Gemini Nano API for a variety of tasks, including:
    *   **Audio Transcription:** The `geminiTranscribeFile` function in `extension/shared/gemini.js` uses the `gemini-2.5-flash` model to transcribe audio files. This is used in the Auditory Accessibility feature to provide transcripts for audio and video files.
    *   **Text Simplification:** The Autism & Cognitive Support feature uses a prompt-based approach with the Gemini API to simplify complex text, making it easier to understand.
    *   **Content Summarization:** The Visual Accessibility feature uses the Gemini API to summarize long articles, terms of service, and privacy policies.
*   **Chrome Extension APIs:** The extension makes use of various Chrome Extension APIs, including `sidePanel`, `contextMenus`, and `storage` to provide a seamless user experience.
*   **Chrome TTS API:** The extension uses the Chrome TTS API to provide text-to-speech functionality. This allows for a more natural and customizable reading experience.

### Auditory Accessibility

*   **Live Audio Transcribe:** Get real-time transcriptions of spoken content.
*   **Transcribe Media Files:** Upload video and audio files to receive a text transcription, powered by the Gemini API.
*   **Scribe:** A dedicated view for your transcriptions with the ability to download them.
*   **Customizable Settings:**
    *   Automatically download transcripts.
    *   Toggle timestamps in your transcriptions.
    *   Filter out adult or profane words.

### Autism & Cognitive Support

*   **Text Simplification:** Make complex text easier to understand using the Gemini API.
*   **Audio Simplification:** Upload an audio file and receive a simplified version.
*   **Animation Toggle:** Reduce distractions by turning off website animations.
*   **Adjustable Settings:**
    *   Control the level of text simplification.
    *   Adjust read-aloud speed and volume.
    *   Filter out adult or profane words from content.

### Visual Accessibility

*   **Text-to-Speech (TTS):** Have website text read aloud to you.
*   **Content Summarization:**
    *   Get summaries of long articles and text, powered by the Gemini API.
    *   Summarize lengthy Terms & Conditions and Privacy Policies.
*   **Personalized Voice Settings:**
    *   Choose between different voice genders, speeds, and tones.
*   **Accessibility Statistics:**
    *   Track your usage patterns, such as weekly screen reader use.
    *   Analyze your content consumption habits.
    *   Monitor your navigation efficiency and most-used voice commands.

## How to Use

1.  Install the SimpliFy extension.
2.  Click on the extension icon in your browser to open the side panel.
3.  Explore the different accessibility features and customize them to your liking.

For detailed setup and installation instructions, please see [readme-instructions.md](readme-instructions.md).