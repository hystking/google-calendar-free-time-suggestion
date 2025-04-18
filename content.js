// content.js
// Extracts visible calendar events from Google Calendar DOM
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getEvents') {
    const events = [];
    // Select common event elements (may need adjustment if DOM changes)
    const eventEls = document.querySelectorAll('[data-event-chip-id], .fc-event');
    eventEls.forEach(el => {
      const title = el.getAttribute('aria-label') || el.textContent.trim();
      // Try to get start/end from data attributes
      let start = el.dataset.start || el.dataset.eventStart || '';
      let end = el.dataset.end || el.dataset.eventEnd || '';
      // participants and organizer detection not implemented
      events.push({ title, start, end, participants: [] });
    });
    sendResponse({ events });
  }
});