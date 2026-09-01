<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <p>
    <picture>
      <source srcset="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap-night/ic_launcher.png?raw=true" media="(prefers-color-scheme: dark)" />
      <img src="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap/ic_launcher.png?raw=true" alt="autojs6-plugin-ace-editor-ic-launcher" border="0" width="128" />
    </picture>
  </p>

  <p>言語サービスを備えた組み込み Ace コードエディター</p>

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
| Java | 対応 | 対応 | 対応 | 対応 | 単一ファイル診断 |
| Kotlin | 対応 | 対応 | 対応 | P2+ | なし |

Ace 1.4.12 の TSX は TypeScript mode を使うため JSX タグのハイライトは一部対応です. Python は Python 3.12 標準ライブラリ stub を含む完全オフラインの Pyright 1.1.413 Worker を既定で使い, 古い WebView の非互換や runtime 障害時は通知なしで P2 に戻ります. Lua は arm64-v8a, armeabi-v7a, x86_64 で完全オフラインの LuaLS 3.18.2 コンパニオンプロセスを既定で使い, ネイティブ runtime が利用不能または障害時は通知なしで P2 に戻ります. Java は分離された標準ライブラリと現在文書の P2 補完に ECJ 単一ファイル診断を組み合わせます. Kotlin はセマンティック Provider なしで P2+ 補完を提供します.

AutoJs6 のコードエディタ設定は同じ 9-mode matrix を表示します. グローバル LSP switch がすべてのセマンティックサービスを制御し, TypeScript/JavaScript, Python, Lua, Java には言語別 switch があります; Kotlin は表示されますが利用できません. ファイル種類リストが最初に判定されます: 認識済み suffix を外すとそのセマンティック機能は無効になり, custom suffix の追加はファイルを LSP path に通すだけで別言語への再分類や Provider 作成は行いません.

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
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.20-universal.apk
```

次に AutoJs6 のプラグインセンターで `ace-editor` を有効にし, AutoJs6 を完全に終了してから再起動します. プラグインのインストール, 更新, またはロールバック後はホストを再起動してください.

本番環境へのインストールでは, AutoJs6 が信頼する署名を使用してください. インプロセスのプラグインコードはホストプロセスの権限を継承するため, 入手元が不明な APK や監査されていない APK をインストールしないでください.

******

### リリース履歴

******

# v1.1.20

###### 2026/09/01

* `改善` 内蔵のメインアプリ宣言と生成された LSP グループで Previewer の命名を同期

# v1.1.19

###### 2026/09/01

* `修正` ホストテーマと初期ドキュメントが反映される前に Ace WebView が純白ページを短時間表示し, ダークエディタテーマで目立つ点滅が発生する問題; 初回表示は固定遅延ではなく, テーマ適用済み, ドキュメント送信済み, 安定描画の明示的なシグナルを待機
* `改善` 約 1.3 MiB の完全な AutoJs6 補完インデックスを初回表示の同期経路から外し, 最初のコード画面が表示された後のアイドル時間に読み込んでブートストラップインデックスをシームレスに置換; Android 9-15 の 5 環境すべてで 400 グローバル項目と 80 モジュールを復元
* `改善` README のレイアウトと Gradle プラットフォームのバージョン管理方式を統一
* `改善` プラグインの説明を簡潔にし, 多言語リソースの句読点を統一

# v1.1.18

###### 2026/08/31

* `機能` AutoJs6 `4.6.0` のリソース安全な PNG 量子化宣言と再生成した main-app LSP グループを同梱: 設定可能な `maxPixels` と `maxMemoryBytes` の予算超過は型付き詳細で失敗し, 結果は `peakWorkingMemoryBytes` を公開し, キャンセル API は明示要求とスクリプト終了に対応
* `機能` Python Lua Java Kotlin のオフライン P1 言語サポートを追加: 拡張子ごとの Ace mode で構文ハイライト キーワード スニペット 文書単語補完を提供; Lua は worker 構文診断も有効化し 4 言語すべてを AutoJs6/TypeScript 候補から分離
* `機能` Python, Lua, Java, Kotlin のオフライン P2 補完を追加: 固定バージョンの標準ライブラリ索引を必要時に読み込み, 現在の文書から import, 関数, クラス, メソッド, 引数, 変数を抽出し, 言語間の分離と既存の JavaScript/TypeScript 動作を維持
* `機能` 8 能力の差し替え可能なセマンティック Provider, 汎用 JSON-RPC/LSP コア, WebWorker/端末内 stdio トランスポートを追加; TypeScript は回帰なく移行し, provider 障害時は P2 にフォールバックし, 4 言語のセマンティック切り替えは既定で無効
* `機能` 固定した Pyright 1.1.413 Worker と 271 ファイルの typeshed サブセットで完全オフラインの Python 3.12 セマンティック機能を内蔵; 型補完, hover, signature help, diagnostics, 定義ジャンプを既定で有効化し, 非対応の古い WebView や runtime 障害時は通知なしで P2 にフォールバック
* `機能` 固定した端末内 LuaLS 3.18.2 コンパニオンプロセスで完全オフラインの Lua セマンティック機能を内蔵; arm64-v8a, armeabi-v7a, x86_64 では補完, hover, signature help, diagnostics, 定義ジャンプを既定で有効化し, ネイティブアセットの欠落や破損, 非対応 ABI, プロセス障害時は通知なしで P2 に戻り有限バックオフで復旧
* `機能` 固定した ECJ 3.26.0 と削減済み Android API 36 stubs により完全オフラインの Java 単一ファイル診断を内蔵; 構文エラーと未解決シンボルを既定で正確な範囲に表示し, JDT Code Assist が ART では利用できない Eclipse Workspace/OSGi 環境を必要とするため補完は P2 を維持
* `機能` Kotlin 2.2.21 のインスタンス API, 現在のファイルの保守的な型推定, safe-call, 再利用した Java/Android 索引によるオフライン Kotlin P2+ 補完を追加; 端末内 compiler はサイズ, ART 実行, メモリ, 最低 SDK の検証に失敗したため Kotlin compiler とセマンティック runtime は同梱しない
* `機能` AutoJs6 のコードエディタ設定に同じ 9-mode 言語サポート matrix を表示し, TypeScript/JavaScript, Python, Lua, Java の言語別セマンティック switch を追加; Kotlin は P2+ の利用不可状態で表示を保ち, ファイル種類のカスタマイズは言語再分類ではなく allowlist であることを明記

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
