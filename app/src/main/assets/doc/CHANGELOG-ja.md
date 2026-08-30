******

### リリース履歴

******

# v1.1.16

###### 2026/08/30

* `機能` AutoJs6 `4.4.0` の PNG 量子化結果宣言と再生成した main-app LSP グループを同梱: `images.quantize` はエンコード済みバイト列, サイズ, 実際の品質, 量子化誤差を返し, 明示した品質下限を満たせない場合は型付き `QualityTooLowException` を公開

# v1.1.15

###### 2026/08/30

* `機能` AutoJs6 `4.3.0` の PNG 量子化オプション宣言と再生成した main-app/resource LSP グループを同梱: `Images.PngQuantizationOptions` はパレット数, 速度, 品質範囲, ディザリング, posterize を網羅し, 数値 `quality` の互換性を維持

# v1.1.14

###### 2026/08/29

* `機能` F2 とモバイルの `名前を変更` からプロジェクト全体の TypeScript シンボル名変更を追加: Ace は正確なプロジェクトスナップショットから有界な複数ファイル編集を生成して AutoJs6 contract 5 の承認を要求し, プレビュー, 競合検査, アトミック公開, ロールバック, すべてのディスク書き込みは Host が全面的に担当します
* `機能` Ctrl/Command+. とモバイルの `クイック修正` から TypeScript auto-import と spelling correction を追加: Ace は active buffer の整列済み edit だけに制限し, AutoJs6 6.8.0 (5276) に contract 4 認可を要求して, 承認済み結果を 1 回の undo 可能な変更として適用します
* `機能` TypeScript の跨ファイル intelligence が project source と frozen dependency declaration の completion, hover, signature help, definition navigation を網羅しました; F12, Ctrl/Command-click, モバイルの `定義へ移動` は contract 3 target を送信し, AutoJs6 6.8.0 (5276) が開く前に独立検証して位置決めします
* `機能` ホスト提供の TypeScript プロジェクト診断を追加: Ace は完全かつ上限付きのソース snapshot を検証して読み込み, プロジェクト内ファイル間の import を解決し, 実行前コンパイルと同じ基準で欠落モジュールを強調表示します. AutoJs6 6.8.0 (5276) 以降が必要です
* `機能` TypeScript project type layer は編集を続ける前に native addon signal と install lifecycle hook を検出し, host と compiler と同じ安定した dependency-boundary error と pure JavaScript/WASM の案内を公開します
* `機能` Ace の依存型 authority を resolver policy revision 3 に同期し, lodash 4.17.21 と `@types/lodash` 4.17.25 の検証を追加して, runtime パッケージに宣言が同梱されない場合も Rhino と Node の診断一致を維持しました
* `機能` TypeScript compiler と共有する frozen project dependency type layer を追加: Ace は package `types`/`typings`, TypeScript 6 `typesVersions`, nested declaration, installed `@types` を解決し, Rhino/Node profile で dayjs completion, hover, strict diagnostic が一致
* `機能` AutoJs6 `4.2.0` の R8 宣言と生成済み LSP グループを同梱: `ScriptRuntime.loadJarWithR8` の 6 つのオーバーロードは検証済み mapping/seeds/usage/retrace metadata のエクスポートを追加し, `retraceR8Stack` はプロトコル 1.1 で来歴に結び付けたスタック復元を実行. Provider 選択失敗時はフォールバックしない

# v1.1.13

###### 2026/08/26

* `機能` AutoJs6 `4.1.0` の最終的なプラグイン専用 AI 宣言を同梱: セレクター省略時は公式 3-Stone AI の既定ターゲットを使用し, すべての要求はプラグインの `target` ルーティングと標準 `timeout` のみを受け付け, ホスト側の直接接続, 認証情報, 移行用イベント型を削除

# v1.1.12

###### 2026/08/26

* `機能` AutoJs6 の統一 AI ターゲット宣言を内蔵: `ai.catalog`, `target` による厳密なルーティング, ローカルおよびオンラインターゲット, 完全なレスポンス/セッションメタデータ, reasoning 出力, フォールバックしない安定エラーを網羅し, 未公開の旧 AI カタログ API と互換エイリアスをすべて削除

# v1.1.11

###### 2026/08/25

* `機能` AutoJs6 型宣言と生成 LSP グループに `ScriptRuntime.loadJarWithR8` の 3 つの明示的オーバーロードを同梱し, keep rules, 順序付き classpath, consumer-rule ordinal 対応を網羅

# v1.1.10

###### 2026/08/24

* `機能` Ace の TypeScript 診断をコンパイラープラグインの TypeScript 6.0.3 revision-2 Rhino/Node プロファイル (ES2018, strict, CommonJS/Node10 または NodeNext) に合わせ, Node プロジェクトのルーティングと .mts/.cts 宣言ファイルの既定サポートを追加しつつ静的フォールバックを維持

# v1.1.9

###### 2026/08/21

* `機能` `ai.ask`/`ai.chat`/`ai.stream` と永続 `ai.session` の明示的 backend profile 型宣言, `cpu`/`gpu`/`npu`, `ai.catalog` のデバイス可用性, 安定した使用不可理由, CPU フォールバック禁止を網羅

# v1.1.8

###### 2026/08/21

* `機能` `ai.ask`/`ai.chat`/`ai.stream` と永続 `ai.session` のネイティブ構造化 JSON 型宣言. `structuredJson`, JSON オブジェクト `responseSchema`, セッション固定 schema を含む

# v1.1.7

###### 2026/08/21

* `機能` `ai.session` の永続オンデバイス会話型宣言を追加し, 固定セッション設定, 各ターンで新しいプロンプトだけを受け取る `ask`/`chat`/`stream`, ライフサイクル状態, 明示的な終了セマンティクスに対応

# v1.1.6

###### 2026/08/21

* `機能` AutoJs6 ローカル AI プラグインの型宣言を拡充し, 複数ロールのメッセージ履歴, 公式/サードパーティー選択, 生成パラメータ, 正確な使用量とストリーミングペイロード, `ai.catalog` によるモデル探索に対応

# v1.1.5

###### 2026/08/21

* `機能` AutoJs6 の独立 YOLO プラグイン向け物体検出型宣言を同期し, 明示的な Provider コンポーネント, セッションと検出のオプション, 検出結果, 安定したエラーコードに対応

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

# v1.0.0

###### 2026/07/21

* `機能` プラグイン ID `ace-editor`, エンジン `editor`, バリアント `ace` を備えたスタンドアロン Ace エディタプラグインを追加
* `機能` `org.autojs.permission.PLUGIN` で保護された `org.autojs.plugin.INFO` および `org.autojs.plugin.EDITOR` コンポーネントを介した検出を追加し, Editor API コントラクト 1 と最小ホスト build `5234` に対応
* `機能` Ace `1.4.12` の編集機能を追加: 元に戻す/やり直し, 検索と置換, 正規表現検索と単語単位検索, カーソルと選択範囲の移動, 行操作, ブレークポイント, コメントの切り替え, コード整形
* `機能` 組み込みの JavaScript/TypeScript 言語サービスと AutoJs6 型宣言を追加し, 補完, hover, diagnostics, signature help に対応. JSON には syntax diagnostics のみを追加
* `機能` 増分テキスト同期, CRLF の保持, 大容量テキストのチャンク読み込み, 非常に長い行向けの軽量モード, IME 適応を追加
* `機能` テーマと表示設定に加え, 署名付きカタログとファイル整合性の検証を備えたフォントのダウンロード, キャッシュ, インストール, 削除機能を追加
* `機能` WebView ランタイムの健全性監視, ハートビート検出, ホストのネイティブエディタへのフォールバック通知を追加
* `機能` プラグインメタデータ, README, CHANGELOG のコンテンツに, スペイン語, フランス語, ロシア語, アラビア語, 日本語, 韓国語, 英語, 簡体字中国語, 香港繁体字中国語, 台湾繁体字中国語のローカライズを追加
