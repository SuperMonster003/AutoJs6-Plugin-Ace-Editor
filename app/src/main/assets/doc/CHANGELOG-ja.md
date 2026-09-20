******

### リリース履歴

******

# v1.12.0

###### 2026/09/21

* `改善` 内蔵 AutoJs6 宣言を `4.19.0` に更新: Readium EPUB Reader プラグインの `epub` / `$epub` グローバルと `Internal.Epub` 名前空間 (書籍を開く操作と簡易層の同期および `Async` 形式, `Book` のメタデータ, 目次, 読み順, 本文抽出, 表紙とリソースの書き出しおよび検索メンバー, `ReaderSession` のイベントと制御メソッド, 閲覧設定, 位置オブジェクト, 結果ドキュメントとエラーコード) を追加し, エディタ補完と型チェックが EPUB API を対象に含むようになりました

# v1.11.0

###### 2026/09/20

* `改善` 内蔵 AutoJs6 宣言を `4.18.0` に更新: Angus Mail プラグインの `mail` / `$mail` グローバルと `Internal.Mail` 名前空間 (クライアントと転送メソッドの同期および `Async` 形式, 監視イベント, メール / 添付 / アドレスオブジェクト, アカウントオプションとプロバイダープリセット, 検索条件, 結果ドキュメントとエラーコード) を追加し, エディタ補完と型チェックがメール API を対象に含むようになりました
* `改善` エディタの補完インデックス `autojs6_indices.js` と集約宣言 `lib.autojs6.d.ts` をホストの `tools/ace-completion` で内蔵宣言 `4.18.0` から再生成: `mail`, `ai`, `tts`, `flow`, `pangu`, `settings`, `yolo`, `powerManager`, `workManager` モジュールの補完とシグネチャヘルプを追加し, 宣言インデックス `index.d.ts` と `BUNDLED_DECLARATIONS.md` をインポートスクリプトが生成する形式に戻しました; 4 つの検証スクリプトと補完テストがすべて通過

# v1.10.0

###### 2026/09/19

* `修正` 共有ビルドプラグイン 1.8.3 により, AGP 9.1 での SDK XML v4 解析警告と, JVM 単体テストの組み立て時に APK ネイティブライブラリのアラインメント検証が誤って実行される問題
* `改善` 内蔵 AutoJs6 宣言を `4.17.0` に更新: Level / LogConfigurator / LogManager のプロキシは内蔵の `org.autojs.autojs.core.console.log` クラスを指すようになり, ライブラリ宣言からホストで削除されたライブラリ (log4j, Flexmark, JavaMail, JUnit, github-api, Jackson, commons-io / lang3, kotlin-reflect, SpongyCastle, media3, Guava) を除外

# v1.9.0

###### 2026/09/16

* `機能` 座標クリック API と Flow タスクスタックの型宣言, LSP 補完とインデックスの同期

# v1.8.0

###### 2026/09/16

* `機能` Flow の条件付きステップ, 回数制限付きループと安定性スナップショットの型宣言および LSP 補完

# v1.7.2

###### 2026/09/16

* `改善` compileSdk に続き targetSdk を 37 (Android 17) に引き上げ, プラグインの動作は新しいターゲットの影響を受けない

# v1.7.1

###### 2026/09/15

* `改善` compileSdk を 37 (Android 17) に引き上げ, targetSdk はターゲット依存の動作を検証するまで 36 のまま

# v1.7.0

###### 2026/09/15

* `改善` images.matchFeatures の画像引数と RANSAC オプション, ObjectFrame の形状とマッチ統計, ImageFeatures の count と method に関する AutoJs6 4.16.0 型宣言を同期し, リソースと依存関係の宣言および LSP グループを再生成

# v1.6.0

###### 2026/09/14

* `改善` images.matchTemplate の scales オプション, テンプレートマッチの形状フィールド, MatchingResult の補助メソッドに関する AutoJs6 4.15.0 型宣言を同期し, リソースと依存関係の宣言および LSP グループを再生成

# v1.5.0

###### 2026/09/14

* `改善` images.countPointsByColor, images.getMeanColor, images.readPixels および colors.distance / invert / blend / contrast 系メソッドの AutoJs6 4.14.0 型宣言を同期し, リソースと依存関係の宣言および LSP グループを再生成

# v1.4.0

###### 2026/09/14

* `改善` LaunchConfig.requiresSharedStorage の AutoJs6 4.13.0 型宣言を同期し, リソースと依存関係の宣言および LSP グループを再生成

# v1.3.0

###### 2026/09/13

* `機能` `pangu` の文字間隔に関する型宣言と補完, `spaceText`, `hasProperSpacing` と型付きモジュール読み込みに対応; AutoJs6 型宣言 4.12.0 を同期して LSP グループを再生成

# v1.2.0

###### 2026/09/13

* `修正` Lua ワークスペースのパス処理, TypeScript 依存関係のスナップショット, 言語サーバーのテスト終了処理で Android 7 互換性を修正
* `修正` 購読者への失敗通知前にフォントの一時ダウンロードファイルとリースを解放
* `改善` リリース署名の設定, APK の構成, ドキュメントの再生成結果を検証
* `改善` 端末の ABI に対応する APK または universal APK を選択してください. Lua の意味解析は arm64-v8a, armeabi-v7a, x86_64 に対応し, x86 ではエディタと静的補完を利用できます.

# v1.1.28

###### 2026/09/13

* `修正` `runtime.requestPermissions` の型宣言を一般的な権限名と配列の例に対応させ, `access_local_network` をサポート; AutoJs6 宣言 4.11.1 と LSP グループを同期

# v1.1.27

###### 2026/09/13

* `改善` `device.pageSize` の読み取り専用の数値宣言と補完, AutoJs6 宣言 4.11.0 を同期して LSP グループを再生成

# v1.1.26

###### 2026/09/12

* `改善` OCR 宣言と補完がエンジンの自動選択, 実際のモードの取得, tap によるリセット, 呼び出しごとのモード指定に対応; AutoJs6 4.10.0 の宣言を同期し LSP グループを再生成

# v1.1.25

###### 2026/09/11

* `改善` 64 ビットのネイティブライブラリの 16 KB ページアラインメントをビルド時に検証, manifest 契約の検査と JSON レポートに対応

# v1.1.24

###### 2026/09/10

* `改善` MediaInfo の型宣言と補完が streamNumber, countGet, infoKind とクエリ機能に対応

# v1.1.23

###### 2026/09/08

* `機能` AutoJs6 `4.8.1` のコンソール宣言更新を同梱: `console.rawInput` / `console.input` の復活, `setTimeVisible` / `setTimeFormat` / `setColorful` / `setAvoidStatusBar` / `setInputVisible` メソッドと対応する `console.build` オプションの追加, JSX の `<console>` / `<globalconsole>` 要素と属性の宣言を追加; メインアプリ宣言は AutoJs6 6.8.0 (5279) から再生成

# v1.1.22

###### 2026/09/07

* `機能` AutoJs6 `4.8.0` のアクセシビリティ自動化宣言と再生成した LSP グループを同梱: `Flow` チェーンと `flow` 名前空間, ツールキット (`smartClick`, `scrollUntil`, `typeInto`, `dismissPopups`, `collectList`, `launchAndWait`, `backUntil`, `toggle` など), イベント駆動の待機, `auto.explain` / `auto.dump` / `auto.stats`, 文字列セレクター `select(syntax)` と `findIterator`; メインアプリ宣言は AutoJs6 6.8.0 (5278) から再生成

# v1.1.21

###### 2026/09/01

* `機能` AutoJs6 `4.7.0` の Pinyin 宣言と再生成した LSP グループを内蔵: `customDictionary` は呼び出し単位の読み上書き, `compare` は数値の並び順, `compact` は候補行列の直積を返し, 共有プラグイン API 型も同期

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

# v1.1.17

###### 2026/08/31

* `機能` AutoJs6 `4.5.0` の色を正しく扱う PNG 量子化宣言と再生成した main-app LSP グループを同梱: `images.quantizeToFile` はファイルへ直接書き込みサイズと品質指標を返し, `preserveAlpha` は透明または不透明な出力を制御

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
