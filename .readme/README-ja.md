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
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.4-universal.apk
```

次に AutoJs6 のプラグインセンターで `ace-editor` を有効にし, AutoJs6 を完全に終了してから再起動します. プラグインのインストール, 更新, またはロールバック後はホストを再起動してください.

本番環境へのインストールでは, AutoJs6 が信頼する署名を使用してください. インプロセスのプラグインコードはホストプロセスの権限を継承するため, 入手元が不明な APK や監査されていない APK をインストールしないでください.

******

### リリース履歴

******

# v1.1.4

###### 2026/08/20

* `機能` AutoJs6 AI プラグインの `Ask`, `Chat`, `Stream` 型宣言を同期し, 公式/サードパーティープラグインの選択, ローカル生成パラメータ, ルート応答, ストリーミングイベント型に対応

# v1.1.1

###### 2026/07/28

* `修正` `App.CHROME` と大規模な `R.string.text_*` リソースを含むオプション宣言グループの静的メンバー補完を修正し, Ace の切り詰められた補完候補リストをプレフィックスの変更時にデバウンス更新するよう改善
* `修正` 通常の大きなドキュメントが超長行と誤判定されてプレーンテキストモードへ切り替わり, JavaScript のハイライト, 補完, セマンティックサービスが無効になる問題を修正. 実際に非常に長い単一行には引き続きセーフモードを適用
* `修正` Ace のシグネチャ/パラメータヒント用バブルが常に明るい背景になる問題を修正し, エディタテーマの背景色と前景色を動的に反映. テーマ切り替え時には, 既に開いているオートコンプリート候補ポップアップも別個に更新
* `修正` システムのテキスト選択 ActionMode をエディタ独自のパレット対応選択ツールバーに置き換え, 選択操作, 押下状態, オーバーフローパネルが各 Android バージョンで現在の Ace 配色に追従するよう修正

# v1.1.0

###### 2026/07/27

* `機能` 完全な元の宣言を保持したまま, 選択可能な AutoJs6 LSP 宣言グループを追加: `core` は常に有効で, `android`, `libraries`, `resources`, `main-app` は既定で無効. `libraries` を選択すると `android` も有効になり, `main-app` を選択すると `android`, `libraries`, `resources` も有効化
* `機能` 宣言を検証して 5 つの LSP グループと manifest を生成する Gradle タスク `:app:generateAutoJs6LspDeclarations` を追加. 通常のアセットマージから自動的に実行され, 外部スクリプトから直接呼び出すことも可能
* `依存関係` 組み込みの TypeScript 言語サービスと標準ライブラリ宣言を `4.2.4` から `6.0.3` にアップグレード

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
