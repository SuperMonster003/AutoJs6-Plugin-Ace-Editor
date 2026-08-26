<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <h1>AutoJs6 Ace Editor Plugin</h1>

  <p>AutoJs6 用スタンドアロン Ace コードエディタプラグイン</p>

  <p>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/SuperMonster003/AutoJs6-Plugin-Ace-Editor?label=Release"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/issues"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=A24232&label=Issues"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE"><img alt="GitHub License" src="https://img.shields.io/github/license/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=534BAE&label=License"/></a>
  </p>
</div>

******

### 言語 (Languages)

******

現在の README.md は次の言語に対応しています:

- [简体中文 [zh-Hans]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hans.md)
- [繁體中文 (香港) [zh-Hant-HK]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-HK.md)
- [繁體中文 (台灣) [zh-Hant-TW]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-TW.md)
- [English [en]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-en.md)
- [Français [fr]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-fr.md)
- [Español [es]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-es.md)
- 日本語 [ja] # 現在
- [한국어 [ko]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ko.md)
- [Русский [ru]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ru.md)
- [العربية [ar]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ar.md)

******

### 概要

******

AutoJs6 Ace Editor Plugin は, Ace WebView ランタイム, JavaScript ブリッジ, 入力メソッド対応, 組み込み言語サービス, エディタアセットをホスト APK から分離します. 通常の Android APK としてインストールされ, 型付き Editor API を介して AutoJs6 プロセス内で動作します.

******

### 機能

******

- プラグイン ID `ace-editor`, エンジン `editor`, バリアント `ace` を提供し, `org.autojs.plugin.INFO` と `org.autojs.plugin.EDITOR` を介した検出に対応します.
- Editor API コントラクト 1 を使用し, AutoJs6 `6.8.0 Alpha7` build `5235` 以降および Android API 24 以降が必要です.
- テキスト編集, 元に戻す/やり直し, 検索と置換, 正規表現検索と単語単位検索, カーソルと選択範囲の移動, 行操作, ブレークポイント, コメントの切り替え, コード整形に対応します.
- JavaScript/TypeScript 言語サービスと AutoJs6 型宣言を内蔵し, 補完, hover, diagnostics, signature help を提供します. JSON には syntax diagnostics のみを提供します.
- CRLF の保持, 増分テキスト同期, 大容量テキストのチャンク読み込み, 非常に長い行向けの軽量モード, IME 対応, ランタイムの健全性監視, ホストのネイティブエディタへのフォールバック通知に対応します.
- テーマと表示設定に加え, 署名付きカタログの検証, SHA-256/WOFF2 検証, ダウンロード, キャッシュ, インストール, 削除を備えたフォント管理を提供します.
- プラグインメタデータ, README, CHANGELOG のコンテンツをスペイン語, フランス語, ロシア語, アラビア語, 日本語, 韓国語, 英語, 簡体字中国語, 香港繁体字中国語, 台湾繁体字中国語にローカライズしています.

******

### ビルド

******

同梱の Gradle Wrapper を JDK 17 以降および Android SDK 36 とともに使用します:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Release ビルド:

```powershell
.\gradlew.bat :app:assembleRelease
```

ビルドパラメータとバージョンは `version.properties` から取得されます. 現在の最小 SDK は 24, ターゲット SDK は 36 です.

`autojs6/types/**/*.d.ts` を更新または追加した後は, 次のタスクを単独で実行できます:

```powershell
.\gradlew.bat :app:generateAutoJs6LspDeclarations
```

このタスクは宣言の参照と TypeScript 6 の構文を検証し, `core`, `android`, `libraries`, `resources`, `main-app` の 5 つの LSP アセットと manifest を生成します. `assemble` と `mergeAssets` は既にこのタスクに依存しているため, 通常のビルドで追加操作は不要です; 外部スクリプトから直接呼び出すこともできます. 生成結果は `app/build/generated/aceLspAssets` のみに書き込まれ, `src/main/assets` 内の完全なソース宣言を上書きまたは削除しません. Node が `PATH` にない場合は `-Pautojs6.nodeExecutable=<node-path>` を指定してください.

******

### インストール

******

ビルド後に生成された APK をインストールします:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.13-universal.apk
```

次に AutoJs6 のプラグインセンターで `ace-editor` を有効にし, AutoJs6 を完全に終了してから再起動します. プラグインのインストール, 更新, またはロールバック後はホストを再起動してください.

本番環境へのインストールでは, AutoJs6 が信頼する署名を使用してください. インプロセスのプラグインコードはホストプロセスの権限を継承するため, 入手元が不明な APK や監査されていない APK をインストールしないでください.

******

### リリース履歴

******

# v1.1.13

###### 2026/08/26

* `機能` AutoJs6 `4.1.0` の最終的なプラグイン専用 AI 宣言を同梱: セレクター省略時は公式 3-Stone AI の既定ターゲットを使用し, すべての要求はプラグインの `target` ルーティングと標準 `timeout` のみを受け付け, ホスト側の直接接続, 認証情報, 移行用イベント型を削除

# v1.1.12

###### 2026/08/26

* `機能` AutoJs6 の統一 AI ターゲット宣言を内蔵: `ai.catalog`, `target` による厳密なルーティング, ローカルおよびオンラインターゲット, 完全なレスポンス/セッションメタデータ, reasoning 出力, フォールバックしない安定エラーを網羅し, 未公開の旧 AI カタログ API と互換エイリアスをすべて削除

# v1.1.11

###### 2026/08/25

* `機能` AutoJs6 型宣言と生成 LSP グループに `ScriptRuntime.loadJarWithR8` の 3 つの明示的オーバーロードを同梱し, keep rules, 順序付き classpath, consumer-rule ordinal 対応を網羅

##### その他のリリース履歴

* [CHANGELOG.md](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/assets/doc/CHANGELOG-ja.md)

******

### リソース構成

******

```text
.readme/lang_*.json
.changelog/lang_*.json
.python/generate_markdown.py
app/src/main/res/values-*/strings.xml
app/src/main/assets/doc/CHANGELOG*.md
```

`strings.xml` にはローカライズされたプラグインメタデータとエディタ UI テキストが含まれます. README と CHANGELOG は `.python/generate_markdown.py` により JSON ソースから生成され, 最新のローカライズ済み変更履歴も APK の `assets/doc` ディレクトリに書き込まれます.

******

### リンク

******

- AutoJs6 プロジェクト: https://github.com/SuperMonster003/AutoJs6
- Ace 公式サイト: https://ace.c9.io
- サードパーティ通知: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/THIRD_PARTY_NOTICES.md
- プロジェクトライセンス: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE
