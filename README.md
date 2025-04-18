# Google Calendar 空き時間提案ツール

このChrome拡張機能は、LLMを使用して重要でないイベントを除外し、残りのイベントの合間の空き時間を計算することで、Googleカレンダーの空き時間を発見するのに役立ちます。

## 機能
- 現在のGoogleカレンダービューから表示されているイベントを抽出します。
- OpenAI APIを使用して、自然言語ルールに基づいて重要でない可能性のあるイベントを識別します。
- フィルタリングされたイベントの前後および間の空き時間を計算します。
- 除外されたイベント（理由付き）とおすすめの空き時間スロットを表示します。

## インストール方法
1. このリポジトリをクローンまたはダウンロードします:
   ```bash
   git clone <repository_url>
   ```
2. Google Chromeを開き、`chrome://extensions`に移動します。
3. 右上の切り替えボタンで**デベロッパーモード**を有効にします。
4. **パッケージ化されていない拡張機能を読み込む**をクリックし、この拡張機能を含むディレクトリ（`manifest.json`のあるフォルダ）を選択します。
5. 拡張機能**Google Calendar 空き時間提案ツール**がリストに表示されます。

## 使用方法
1. `https://calendar.google.com/`でGoogleカレンダーページにアクセスします。
2. Chromeツールバーの拡張機能アイコンをクリックしてポップアップを開きます。
3. OpenAI APIキーを入力します（これはブラウザに安全に保存されます）。
4. （任意）自然言語で除外ルールを入力します（例：「ランチやカジュアルな雑談は除外」）。
5. **提案を取得**をクリックして提案を取得します。
6. 拡張機能は以下を実行します：
   - カレンダーのDOMから表示されているイベントを抽出します。
   - イベントとルールをOpenAI Chat APIに送信して、重要でないイベントを識別します。
   - 残りのイベントに基づいて空き時間スロットを計算します。
7. ポップアップUIで**除外されたイベント**（理由付き）と**空き時間スロット**を確認します。

## 設定
- OpenAI APIキーはこの拡張機能用にChromeのローカルストレージに保存されます。
- デフォルトでは、拡張機能は`gpt-3.5-turbo`モデルを使用します。これを変更するには、`background.js`のAPI呼び出しを編集してください。

## 制限事項
- 現在のカレンダービューに表示されているイベントのみが処理されます。
- GoogleカレンダーのDOM構造が変更された場合、`content.js`のセレクタを更新する必要があるかもしれません。
- OpenAI APIキーに必要な権限とチャット完了のためのクォータがあることを確認してください。

## 拡張機能の構造
- **manifest.json**: 拡張機能の設定（権限、スクリプト、ポップアップ）。
- **content.js**: ページからイベントデータを抽出するコンテンツスクリプト。
- **background.js**: LLM呼び出しと空きスロット計算を処理するサービスワーカー。
- **popup.html** & **popup.js**: ユーザーインタラクション用のUIとロジック。

詳細な設計と仕様については、`BRIEF.md`を参照してください。