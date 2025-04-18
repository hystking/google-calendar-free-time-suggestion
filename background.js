// background.js
// Handles processing events via LLM and calculating free time slots
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'processEvents') {
    const { events, rule } = message;
    // Retrieve API key
    chrome.storage.local.get('apiKey', data => {
      const apiKey = data.apiKey;
      if (!apiKey) {
        console.error('API key not set');
        sendResponse({ excluded: [], freeSlots: [] });
        return;
      }
      // Build prompt for LLM
      const lines = [];
      lines.push('以下の予定一覧から、重要ではない可能性のある予定をリストアップしてください。');
      if (rule) lines.push(`ルール: ${rule}`);
      lines.push('出力はJSON形式で、[{ "title": "...", "reason": "..." }, ...] の形にしてください。');
      lines.push(JSON.stringify(events));
      const body = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: lines.join('\n') }
        ]
      };
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify(body)
      })
      .then(res => res.json())
      .then(data => {
        let excluded = [];
        try {
          const text = data.choices[0].message.content;
          excluded = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse LLM output', e);
        }
        const freeSlots = calculateFreeSlots(events, excluded);
        sendResponse({ excluded, freeSlots });
      })
      .catch(err => {
        console.error('LLM request failed', err);
        sendResponse({ excluded: [], freeSlots: [] });
      });
    });
    // Return true to indicate asynchronous response
    return true;
  }
});

// Calculates free time slots given events and excluded events
function calculateFreeSlots(events, excluded) {
  // Filter out excluded events by title
  const kept = events.filter(e => !excluded.some(x => x.title === e.title));
  if (kept.length === 0) return [];
  // Parse event intervals
  const intervals = kept.map(e => {
    const s = new Date(e.start);
    const t = new Date(e.end);
    return { start: s, end: t };
  })
  .filter(iv => !isNaN(iv.start) && !isNaN(iv.end))
  .sort((a, b) => a.start - b.start);
  // Determine full day range
  const dayStart = new Date(intervals[0].start);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(intervals[intervals.length - 1].end);
  dayEnd.setHours(23, 59, 59, 999);
  const freeSlots = [];
  let cursor = dayStart;
  intervals.forEach(iv => {
    if (iv.start > cursor) {
      freeSlots.push({ start: cursor.toISOString(), end: iv.start.toISOString() });
    }
    if (iv.end > cursor) cursor = iv.end;
  });
  if (cursor < dayEnd) {
    freeSlots.push({ start: cursor.toISOString(), end: dayEnd.toISOString() });
  }
  return freeSlots;
}