// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const ruleInput = document.getElementById('ruleInput');
  const suggestButton = document.getElementById('suggestButton');
  const loadingDiv = document.getElementById('loading');
  const resultsDiv = document.getElementById('results');
  // Load stored API key
  chrome.storage.local.get('apiKey', data => {
    if (data.apiKey) apiKeyInput.value = data.apiKey;
  });
  suggestButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      alert('OpenAI API Key を入力してください');
      return;
    }
    chrome.storage.local.set({apiKey});
    loadingDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
    // Get events from content script
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      if (!tabs || tabs.length === 0) {
        loadingDiv.style.display = 'none';
        resultsDiv.innerText = 'No active tab';
        return;
      }
      const tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabId, {action: 'getEvents'}, eventsResponse => {
        const events = (eventsResponse && eventsResponse.events) || [];
        const rule = ruleInput.value.trim();
        // Process events in background
        chrome.runtime.sendMessage({action: 'processEvents', events, rule}, result => {
          loadingDiv.style.display = 'none';
          if (!result) {
            resultsDiv.innerText = 'Error processing events';
            return;
          }
          const {excluded = [], freeSlots = []} = result;
          // Display excluded events
          const exDiv = document.createElement('div');
          exDiv.innerHTML = '<h2>Excluded Events</h2>';
          excluded.forEach(ev => {
            const p = document.createElement('p');
            p.innerText = `${ev.title} (${ev.reason || ''})`;
            exDiv.appendChild(p);
          });
          resultsDiv.appendChild(exDiv);
          // Display free time slots
          const freeDiv = document.createElement('div');
          freeDiv.innerHTML = '<h2>Free Time Slots</h2>';
          freeSlots.forEach(slot => {
            const p = document.createElement('p');
            p.innerText = `${slot.start} - ${slot.end}`;
            freeDiv.appendChild(p);
          });
          resultsDiv.appendChild(freeDiv);
        });
      });
    });
  });
});