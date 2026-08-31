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
- 必要時に起動する Pyright 1.1.413 WebWorker で Python 3.12 セマンティック解析を内蔵し, 型補完, hover, signature help, diagnostics, 定義ジャンプを提供します. 非対応の古い WebView は通知なしで P2 を維持します.
- 端末内 LuaLS 3.18.2 コンパニオンプロセスで完全オフラインの Lua セマンティック機能を内蔵し, arm64-v8a, armeabi-v7a, x86_64 では補完, hover, signature help, diagnostics, 定義ジャンプを既定で有効にします. 非対応 ABI と runtime 障害時は通知なしで P2 を維持します.
- CRLF の保持, 増分テキスト同期, 大容量テキストのチャンク読み込み, 非常に長い行向けの軽量モード, IME 対応, ランタイムの健全性監視, ホストのネイティブエディタへのフォールバック通知に対応します.
- テーマと表示設定に加え, 署名付きカタログの検証, SHA-256/WOFF2 検証, ダウンロード, キャッシュ, インストール, 削除を備えたフォント管理を提供します.
- プラグインメタデータ, README, CHANGELOG のコンテンツをスペイン語, フランス語, ロシア語, アラビア語, 日本語, 韓国語, 英語, 簡体字中国語, 香港繁体字中国語, 台湾繁体字中国語にローカライズしています.

******

### プログラミング言語サポート

******

次の表は現在同梱されている言語機能を示します. セマンティックサポートには型を考慮した補完 型診断 hover シグネチャヘルプが含まれます:

| 言語 | 構文ハイライト | キーワード補完 | スニペット | ローカル補完 | セマンティックサポート |
|---|---:|---:|---:|---:|---:|
| JavaScript | 対応 | 対応 | 対応 | 対応 | 対応 |
| JSX | 対応 | なし | なし | 対応 | 対応 |
| TypeScript | 対応 | 対応 | 対応 | 対応 | 対応 |
| TSX | 一部対応 | 対応 | 対応 | 対応 | 対応 |
| JSON | 対応 | なし | なし | なし | 構文診断のみ |
| Python | 対応 | 対応 | 対応 | 対応 | 対応 |
| Lua | 対応 | 対応 | 対応 | 対応 | 対応 |
| Java | 対応 | 対応 | 対応 | 対応 | なし |
| Kotlin | 対応 | 対応 | 対応 | 対応 | なし |

Ace 1.4.12 の TSX は TypeScript mode を使うため JSX タグのハイライトは一部対応です. Python は Python 3.12 標準ライブラリ stub を含む完全オフラインの Pyright 1.1.413 Worker を既定で使い, 古い WebView の非互換や runtime 障害時は通知なしで P2 に戻ります. Lua は arm64-v8a, armeabi-v7a, x86_64 で完全オフラインの LuaLS 3.18.2 コンパニオンプロセスを既定で使い, ネイティブ runtime が利用不能または障害時は通知なしで P2 に戻ります. Java と Kotlin は言語ごとに分離された標準ライブラリと現在の文書による遅延読込 P2 補完を維持し, 変数の型推論は行いません. TypeScript の既存セマンティック動作は維持され, Java と Kotlin のセマンティック切り替えは後続マイルストーンまで既定で無効です.

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

`tools/ace-lsp/generate-language-indices.mjs` の Python, Lua, Java, Kotlin 静的索引ソースを変更した後は, このタスクでコミット対象アセットを再生成します:

```powershell
.\gradlew.bat :app:generateAutoJs6LanguageIndices
```

ジェネレーターは各言語の基準バージョンを固定し, `autojs6/indices` に言語別の決定的なアセットを出力します; エディターは最初に使う言語だけを読み込みます. `verifyAutoJs6LanguageIndices` は古い生成物を検出し通常の検証チェーンに含まれます.

固定した Pyright Worker ソースを変更した場合, このタスクでコミット対象の Python セマンティックアセットを明示的に再生成します:

```powershell
.\gradlew.bat :app:generateAutoJs6PythonWorker
```

コミット済み Worker のバージョン, typeshed とライセンスのハッシュ, サイズ予算, セマンティック動作, フォールバック, ライフサイクルを次で検証します:

```powershell
.\gradlew.bat :app:verifyAutoJs6PythonWorker
```

通常の APK ビルドはコミット済みで検証済みの Worker を梱包し, ダウンロードや再生成は行いません. セマンティックアセットは 4.822 MiB で 8 MiB のオプション配布しきい値未満です; ES2022 構文を解析できない古い WebView はエラーダイアログなしで P2 を継続します.

固定した LuaLS ソースまたはビルドロックを変更した場合, 次のコマンドでコミット対象の Android runtime を明示的に再ビルドします:

```powershell
.\tools\ace-lsp\build-luals-android.ps1 `
  -NdkRoot <android-sdk>\ndk\29.0.14206865 `
  -OutputRoot build\luals-android\dist
```

コミット済み LuaLS のバージョン, runtime と ELF のハッシュ, ライセンス一覧, セマンティック動作, ABI フォールバック, ライフサイクルを次で検証します:

```powershell
.\gradlew.bat :app:verifyAutoJs6LuaLanguageServer
```

通常の APK ビルドはコミット済みで検証済みの LuaLS 配布物を梱包し, ダウンロードや再ビルドは行いません. 7.900 MiB のペイロードは言語別 8 MiB 配布しきい値未満で, arm64-v8a, armeabi-v7a, x86_64 をサポートします; 非対応 ABI はエラーダイアログなしで P2 を継続します.

******

### インストール

******

ビルド後に生成された APK をインストールします:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.18-universal.apk
```

次に AutoJs6 のプラグインセンターで `ace-editor` を有効にし, AutoJs6 を完全に終了してから再起動します. プラグインのインストール, 更新, またはロールバック後はホストを再起動してください.

本番環境へのインストールでは, AutoJs6 が信頼する署名を使用してください. インプロセスのプラグインコードはホストプロセスの権限を継承するため, 入手元が不明な APK や監査されていない APK をインストールしないでください.

******

### リリース履歴

******

# v1.1.18

###### 2026/08/31

* `機能` AutoJs6 `4.6.0` のリソース安全な PNG 量子化宣言と再生成した main-app LSP グループを同梱: 設定可能な `maxPixels` と `maxMemoryBytes` の予算超過は型付き詳細で失敗し, 結果は `peakWorkingMemoryBytes` を公開し, キャンセル API は明示要求とスクリプト終了に対応
* `機能` Python Lua Java Kotlin のオフライン P1 言語サポートを追加: 拡張子ごとの Ace mode で構文ハイライト キーワード スニペット 文書単語補完を提供; Lua は worker 構文診断も有効化し 4 言語すべてを AutoJs6/TypeScript 候補から分離
* `機能` Python, Lua, Java, Kotlin のオフライン P2 補完を追加: 固定バージョンの標準ライブラリ索引を必要時に読み込み, 現在の文書から import, 関数, クラス, メソッド, 引数, 変数を抽出し, 言語間の分離と既存の JavaScript/TypeScript 動作を維持
* `機能` 8 能力の差し替え可能なセマンティック Provider, 汎用 JSON-RPC/LSP コア, WebWorker/端末内 stdio トランスポートを追加; TypeScript は回帰なく移行し, provider 障害時は P2 にフォールバックし, 4 言語のセマンティック切り替えは既定で無効
* `機能` 固定した Pyright 1.1.413 Worker と 271 ファイルの typeshed サブセットで完全オフラインの Python 3.12 セマンティック機能を内蔵; 型補完, hover, signature help, diagnostics, 定義ジャンプを既定で有効化し, 非対応の古い WebView や runtime 障害時は通知なしで P2 にフォールバック
* `機能` 固定した端末内 LuaLS 3.18.2 コンパニオンプロセスで完全オフラインの Lua セマンティック機能を内蔵; arm64-v8a, armeabi-v7a, x86_64 では補完, hover, signature help, diagnostics, 定義ジャンプを既定で有効化し, ネイティブアセットの欠落や破損, 非対応 ABI, プロセス障害時は通知なしで P2 に戻り有限バックオフで復旧

# v1.1.17

###### 2026/08/31

* `機能` AutoJs6 `4.5.0` の色を正しく扱う PNG 量子化宣言と再生成した main-app LSP グループを同梱: `images.quantizeToFile` はファイルへ直接書き込みサイズと品質指標を返し, `preserveAlpha` は透明または不透明な出力を制御

# v1.1.16

###### 2026/08/30

* `機能` AutoJs6 `4.4.0` の PNG 量子化結果宣言と再生成した main-app LSP グループを同梱: `images.quantize` はエンコード済みバイト列, サイズ, 実際の品質, 量子化誤差を返し, 明示した品質下限を満たせない場合は型付き `QualityTooLowException` を公開

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
