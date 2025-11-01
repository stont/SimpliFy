# Setup and Installation Instructions

Follow these steps to set up a fresh Chrome browser instance and load the SimpliFy extension.

## 1. Build the Extension

First, you need to build the extension from the source code. This process requires installing dependencies in two separate locations and then running a build script from the project's root directory.

1.  **Install Dependencies:**
    -   Open your terminal in the project's root directory and run `npm install`.
    -   Next, navigate to the `extension` sub-directory (`cd extension`) and run `npm install` again to install the extension's specific dependencies.

    ```bash
    # In your terminal, starting from the project's root directory
    npm install
    
    # Navigate into the extension directory
    cd extension

    # Install dependencies for the extension
    npm install
    ```

2.  **Run the Build Script:**
    -   After installing all dependencies, navigate back to the **root directory** (`cd ..`).
    -   From the root directory, run the build command:

    ```bash
    # Make sure you are in the project's root directory before running this command
    npm run build
    ```
    This command executes the build process and creates a `dist` folder inside the `/extension` directory. This `dist` folder is what you will load into Chrome.

## 2. Configure Chrome for Gemini Nano

To use the on-device AI features, you need to enable the following experimental flags in Chrome:

1.  Open a new tab in Chrome and navigate to `chrome://flags`.
2.  In the search bar, enable each of the following flags:
    - **Summarization API for Gemini Nano** (`chrome://flags/#summarization-api-for-gemini-nano`)
    - **Rewriter API for Gemini Nano** (`chrome://flags/#rewriter-api-for-gemini-nano`)
    - **Writer API for Gemini Nano** (`chrome://flags/#writer-api-for-gemini-nano`)
3.  For each flag, select "Enabled" from the dropdown.
4.  A "Relaunch" button will appear at the bottom of the screen. Click it to restart Chrome for the changes to take effect.

## 3. Load the Unpacked Extension

Now, with Chrome configured, you can load the extension.

1.  Navigate to `chrome://extensions`.
2.  Enable "Developer mode" using the toggle in the top-right corner.
3.  Click the "Load unpacked" button that appears on the top left.
4.  In the file selection dialog, select the `dist` folder located inside the `extension` directory.
5.  The SimpliFy extension will now appear in your list of extensions. Pin it to your toolbar for easy access.

You can now click the extension icon in the Chrome toolbar to open the SimpliFy side panel and start using the features.
