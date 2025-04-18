# Google Calendar Free Time Suggestion

This Chrome extension helps you discover free time slots in your Google Calendar by using an LLM to suggest unimportant events for exclusion and calculating available times around your remaining events.

## Features
- Extracts visible events from the current Google Calendar view.
- Uses the OpenAI API to identify potentially unimportant events based on optional natural language rules.
- Calculates free time slots before, between, and after the filtered events.
- Displays excluded events (with reasons) and lists recommended free time slots.

## Installation
1. Clone or download this repository:
   ```bash
   git clone <repository_url>
   ```
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** and select the directory containing this extension (the folder with `manifest.json`).
5. The extension **Google Calendar Free Time Suggestion** will now appear in your extensions list.

## Usage
1. Go to your Google Calendar page at `https://calendar.google.com/`.
2. Click the extension icon in the Chrome toolbar to open the popup.
3. Enter your OpenAI API key (this will be stored securely in your browser).
4. (Optional) Enter any exclusion rules in natural language (e.g., “Exclude lunch and casual chats”).
5. Click **提案を取得** to fetch suggestions.
6. The extension will:
   - Extract the visible events from the calendar DOM.
   - Send the events and your rules to the OpenAI Chat API to identify unimportant events.
   - Compute free time slots based on the remaining events.
7. View the **Excluded Events** (with reasons) and **Free Time Slots** in the popup UI.

## Configuration
- The OpenAI API key is stored in Chrome's local storage for this extension.
- By default, the extension uses the `gpt-3.5-turbo` model. To change this, edit the API call in `background.js`.

## Limitations
- Only events visible in the current calendar view are processed.
- If Google Calendar’s DOM structure changes, you may need to update selectors in `content.js`.
- Ensure your OpenAI API key has the necessary permissions and quota for chat completions.

## Extension Structure
- **manifest.json**: Extension configuration (permissions, scripts, popup).
- **content.js**: Content script for extracting event data from the page.
- **background.js**: Service worker handling LLM calls and free slot computation.
- **popup.html** & **popup.js**: UI and logic for user interaction.

For detailed design and specifications, see `BRIEF.md`.