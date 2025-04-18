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
    // Google Calendar の実際のイベント要素を取得（data-eventchip 属性を使用）
    const eventEls = document.querySelectorAll('[data-eventchip]');
    eventEls.forEach(el => {
      // 最初の非 aria-hidden 属性を持つ div がイベント情報を含む
      const infoDiv = el.querySelector('div:not([aria-hidden])');
      const infoText = infoDiv ? infoDiv.textContent.trim() : el.textContent.trim();
      // 「、」で分割して [時間範囲, タイトル, 主催者, 参加状況, 場所, 日付] を抽出
      const parts = infoText.split('、').map(s => s.trim());
      const timeRange = parts[0] || '';
      const titlePart = parts[1] || '';
      // タイトルの日本語引用符「」を除去
      const title = titlePart.replace(/^「(.+)」$/, '$1') || titlePart;
      // 日付文字列は末尾の要素
      const datePart = parts[parts.length - 1] || '';
      // 「2025年 4月 16日」の形式をパース
      const dateMatch = datePart.match(/(\d+)年\s*(\d+)月\s*(\d+)日/);
      let start = '';
      let end = '';
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10);
        const day = parseInt(dateMatch[3], 10);
        // 時間範囲「午前11:30～午後12:30」をパース
        const times = timeRange.split('～').map(s => s.trim());
        function parseJapaneseTime(str) {
          let period = '';
          if (str.startsWith('午前')) {
            period = 'AM';
            str = str.replace('午前', '');
          } else if (str.startsWith('午後')) {
            period = 'PM';
            str = str.replace('午後', '');
          }
          const [h, m] = str.split(':');
          let hour = parseInt(h, 10);
          const minute = parseInt(m, 10);
          if (period === 'PM' && hour < 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          return { hour, minute };
        }
        if (times.length === 2) {
          const startTime = parseJapaneseTime(times[0]);
          const endTime = parseJapaneseTime(times[1]);
          const startDate = new Date(year, month - 1, day, startTime.hour, startTime.minute);
          const endDate = new Date(year, month - 1, day, endTime.hour, endTime.minute);
          start = startDate.toISOString();
          end = endDate.toISOString();
        }
      }
      events.push({ title, start, end, participants: [] });
    });
    // 取得したイベント数をログ出力
    log(`${events.length} 件のイベントを取得しました`);
    // 抽出した予定情報をレスポンスとして返却
    sendResponse({ events });
  }
});