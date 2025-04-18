// popup.js
// ポップアップスクリプト: UI操作とメッセージのやり取りを処理
// DOMの読み込み完了後に初期化処理を実行
document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const ruleInput = document.getElementById('ruleInput');
  const suggestButton = document.getElementById('suggestButton');
  const loadingDiv = document.getElementById('loading');
  const logsDiv = document.getElementById('logs');
  const resultsDiv = document.getElementById('results');
  // ログメッセージを受信して表示
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'log') {
      const p = document.createElement('p');
      p.style.margin = '2px 0';
      p.innerText = message.message;
      logsDiv.appendChild(p);
      // 常に最新のログが見えるようにスクロール
      logsDiv.scrollTop = logsDiv.scrollHeight;
    }
  });
  // Chromeストレージから保存済みのAPIキーをロード
  chrome.storage.local.get('apiKey', data => {
    if (data.apiKey) apiKeyInput.value = data.apiKey;
  });
  // 「提案を取得」ボタンがクリックされた時の処理
  suggestButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      alert('OpenAI API キーを入力してください');
      return;
    }
    // 入力されたAPIキーをChromeストレージに保存
    chrome.storage.local.set({apiKey});
    // ログクリア
    logsDiv.innerHTML = '';
    // 処理中のローディングインジケータを表示
    loadingDiv.style.display = 'block';
    // 前回の結果をクリア
    resultsDiv.innerHTML = '';
    // 表示中のタブから予定情報を取得するためにコンテンツスクリプトへメッセージ送信
    // アクティブなタブを取得してコンテンツスクリプトを呼び出し
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      if (!tabs || tabs.length === 0) {
        loadingDiv.style.display = 'none';
        resultsDiv.innerText = 'アクティブなタブがありません';
        return;
      }
      const tabId = tabs[0].id;
      // content.jsから予定情報を取得
      chrome.tabs.sendMessage(tabId, {action: 'getEvents'}, eventsResponse => {
        const events = (eventsResponse && eventsResponse.events) || [];
        const rule = ruleInput.value.trim();
        // 背景スクリプトでイベント解析と空き時間計算を実行
        chrome.runtime.sendMessage({action: 'processEvents', events, rule}, result => {
          loadingDiv.style.display = 'none';
          if (!result) {
            resultsDiv.innerText = 'イベント処理中にエラーが発生しました';
            return;
          }
          const {excluded = [], freeSlots = []} = result;
          // 除外候補となったイベントとその理由を表示
          const exDiv = document.createElement('div');
          exDiv.innerHTML = '<h2>除外されたイベント</h2>';
          excluded.forEach(ev => {
            const p = document.createElement('p');
            p.innerText = `${ev.title} (${ev.reason || ''})`;
            exDiv.appendChild(p);
          });
          resultsDiv.appendChild(exDiv);
          // 計算された空き時間スロットを表示
          const freeDiv = document.createElement('div');
          freeDiv.innerHTML = '<h2>空き時間スロット</h2>';
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