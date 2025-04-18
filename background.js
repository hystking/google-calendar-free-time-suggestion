// background.js
// サービスワーカー: メッセージを受信し、LLM呼び出しや空き時間計算を行う
// Handles processing events via LLM and calculating free time slots
// メッセージを受信して、適切なアクションを処理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 'processEvents' アクションでイベントの解析を開始
  if (message.action === 'processEvents') {
    const { events, rule } = message;
    // 保存されたAPIキーをChromeストレージから取得
    chrome.storage.local.get('apiKey', data => {
      const apiKey = data.apiKey;
      if (!apiKey) {
        console.error('API key not set');
        sendResponse({ excluded: [], freeSlots: [] });
        return;
      }
      // LLM（Chat API）へのプロンプトを組み立て
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
      // OpenAI Chat APIへリクエストを送信
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
        // LLMの出力をパースして除外候補リストを取得
        let excluded = [];
        try {
          const text = data.choices[0].message.content;
          excluded = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse LLM output', e);
        }
        // 除外候補を適用して空き時間スロットを計算
        const freeSlots = calculateFreeSlots(events, excluded);
        sendResponse({ excluded, freeSlots });
      })
      .catch(err => {
        console.error('LLM request failed', err);
        sendResponse({ excluded: [], freeSlots: [] });
      });
    });
    // 非同期処理の完了後にsendResponseを呼ぶため、trueを返してチャネルを開放しない
    return true;
  }
});

// 指定されたイベントリストから空き時間スロットを計算する関数
// Calculates free time slots given events and excluded events
function calculateFreeSlots(events, excluded) {
  // 除外リストに含まれるタイトルのイベントを除外
  // Filter out excluded events by title
  const kept = events.filter(e => !excluded.some(x => x.title === e.title));
  if (kept.length === 0) return [];
  // 残ったイベントの開始/終了時刻をDateオブジェクトに変換
  // Parse event intervals
  const intervals = kept.map(e => {
    const s = new Date(e.start);
    const t = new Date(e.end);
    return { start: s, end: t };
  })
  .filter(iv => !isNaN(iv.start) && !isNaN(iv.end))
  // 開始時刻順にソート
  .sort((a, b) => a.start - b.start);
  // 一日の範囲（00:00〜23:59:59）を設定
  const dayStart = new Date(intervals[0].start);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(intervals[intervals.length - 1].end);
  dayEnd.setHours(23, 59, 59, 999);
  const freeSlots = [];
  let cursor = dayStart;
  // 各イベント間の隙間を探索して空き時間をfreeSlotsに追加
  intervals.forEach(iv => {
    if (iv.start > cursor) {
      freeSlots.push({ start: cursor.toISOString(), end: iv.start.toISOString() });
    }
    if (iv.end > cursor) cursor = iv.end;
  });
  // 最後のイベント後に残る空き時間を追加
  if (cursor < dayEnd) {
    freeSlots.push({ start: cursor.toISOString(), end: dayEnd.toISOString() });
  }
  return freeSlots;
}