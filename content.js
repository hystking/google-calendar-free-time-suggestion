// content.js
// Extracts visible calendar events from Google Calendar DOM
// コンテンツスクリプト: GoogleカレンダーのDOMから表示中の予定を取得
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 'getEvents' アクションを受け取った場合に処理を実行
  if (message.action === 'getEvents') {
    // ログ送信用ヘルパー
    function log(msg) {
      chrome.runtime.sendMessage({type: 'log', message: msg});
    }
    log('イベント取得を開始しました');
    // 取得した予定を格納する配列
    const events = [];
    // Select common event elements (may need adjustment if DOM changes)
    const eventEls = document.querySelectorAll('[data-event-chip-id], .fc-event');
    eventEls.forEach(el => {
      // タイトルはaria-label属性かテキストコンテンツから取得
      const title = el.getAttribute('aria-label') || el.textContent.trim();
      // 開始・終了時刻はdata属性から取得（環境により要調整）
      let start = el.dataset.start || el.dataset.eventStart || '';
      let end = el.dataset.end || el.dataset.eventEnd || '';
      // participants and organizer detection not implemented
      // イベント情報を配列に追加（参加者情報は未実装）
      events.push({ title, start, end, participants: [] });
    });
    // 取得したイベント数をログ出力
    log(`${events.length} 件のイベントを取得しました`);
    // 抽出した予定情報をレスポンスとして返却
    sendResponse({ events });
  }
});