<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <p>
    <picture>
      <source srcset="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap-night/ic_launcher.png?raw=true" media="(prefers-color-scheme: dark)" />
      <img src="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap/ic_launcher.png?raw=true" alt="autojs6-plugin-ace-editor-ic-launcher" border="0" width="128" />
    </picture>
  </p>

  <p>Встроенный редактор кода Ace с языковыми службами</p>

  <p>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/SuperMonster003/AutoJs6-Plugin-Ace-Editor?label=Release"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/issues"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=A24232&label=Issues"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE"><img alt="GitHub License" src="https://img.shields.io/github/license/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=534BAE&label=License"/></a>
  </p>
</div>

******

### Языки (Languages)

******

Текущий README.md поддерживает следующие языки:

- [简体中文 [zh-Hans]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hans.md)
- [繁體中文 (香港) [zh-Hant-HK]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-HK.md)
- [繁體中文 (台灣) [zh-Hant-TW]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-TW.md)
- [English [en]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-en.md)
- [Français [fr]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-fr.md)
- [Español [es]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-es.md)
- [日本語 [ja]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ja.md)
- [한국어 [ko]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ko.md)
- Русский [ru] # текущий
- [العربية [ar]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ar.md)

******

### Введение

******

Плагин AutoJs6 Ace Editor отделяет среду выполнения Ace WebView, мост JavaScript, адаптацию методов ввода, встроенные языковые службы и ресурсы редактора от APK хоста. Он устанавливается как обычный Android APK и работает в процессе AutoJs6 через типизированный интерфейс Editor API.

******

### Функции

******

- Предоставляет идентификатор плагина `ace-editor`, движок `editor` и вариант `ace` с обнаружением через `org.autojs.plugin.INFO` и `org.autojs.plugin.EDITOR`.
- Использует контракт Editor API 7 и требует AutoJs6 сборки 5352 или новее и Android API 24 или новее.
- Поддерживает редактирование текста, отмену и повтор действий, поиск и замену, поиск по регулярным выражениям и целым словам, перемещение курсора и выделения, операции со строками, точки останова, переключение комментариев и форматирование кода.
- Меню Правка > Сворачивание > Развернуть все / Свернуть все управляет всеми блоками кода, включая вложенные блоки и документы только для чтения, сохраняя текст, выделение и историю отмены.
- Основан на Ace 1.44.0; касания, выделение слов двойным касанием или долгим нажатием, перетаскивание курсора и маркеров выделения, инерционную прокрутку, масштабирование щипком и лупу при перетаскивании обеспечивает собственный мобильный слой плагина.
- В настройках редактора кода хоста можно включать и выключать векторные значки поля, подсветку текущей направляющей отступа, полосы прокрутки редактора и их автоскрытие, пробельные символы в выделении, лупу при перетаскивании, подсветку вхождений символа и встроенный предпросмотр автодополнения; лупа и встроенный предпросмотр по умолчанию выключены, а хосты без этих настроек используют значения по умолчанию.
- Включает встроенные языковые службы JavaScript/TypeScript и объявления типов AutoJs6 с автодополнением, информацией при наведении, диагностикой и подсказками сигнатур, тогда как служба JSON предоставляет только диагностику синтаксиса.
- Добавляет семантический анализ Python 3.12 через лениво создаваемый WebWorker Pyright 1.1.413: типизированное дополнение, сведения при наведении, подсказки сигнатур, диагностику и переход к определению; несовместимые старые WebView незаметно сохраняют P2.
- Добавляет полностью автономную семантику Lua через локальный сопутствующий процесс LuaLS 3.18.2: дополнение, сведения при наведении, подсказки сигнатур, диагностика и переход к определению включены по умолчанию на arm64-v8a, armeabi-v7a и x86_64; неподдерживаемые ABI и сбои runtime незаметно сохраняют P2.
- Поддерживает сохранение CRLF, инкрементальную синхронизацию текста, порционную загрузку больших текстов, облегченный режим для очень длинных строк, адаптацию IME, мониторинг состояния среды выполнения и уведомления о переключении обратно на нативный редактор хоста.
- Предоставляет темы и настройки отображения, а также управление шрифтами с проверкой подписанного каталога, валидацией SHA-256/WOFF2, загрузкой, кешированием, установкой и удалением.
- Метаданные плагина, README и CHANGELOG локализованы на испанский, французский, русский, арабский, японский, корейский, английский, упрощенный китайский, гонконгский традиционный китайский и тайваньский традиционный китайский.
- Выберите APK для ABI устройства или universal APK. Семантика Lua доступна на arm64-v8a, armeabi-v7a и x86_64; на x86 доступны редактор и статическое дополнение.

******

### Поддержка языков программирования

******

В таблице ниже перечислены встроенные языковые возможности. Семантическая поддержка включает типизированное дополнение, диагностику типов, hover и подсказки сигнатур:

| Язык | Подсветка синтаксиса | Дополнение ключевых слов | Сниппеты | Локальное автодополнение | Семантическая поддержка |
|---|---:|---:|---:|---:|---:|
| JavaScript | Да | Да | Да | Да | Да |
| JSX | Да | Нет | Нет | Да | Да |
| TypeScript | Да | Да | Да | Да | Да |
| TSX | Да | Да | Да | Да | Да |
| JSON | Да | Нет | Нет | Нет | Только диагностика синтаксиса |
| Python | Да | Да | Да | Да | Да |
| Lua | Да | Да | Да | Да | Да |
| Java | Да | Да | Да | Да | Диагностика одного файла |
| Kotlin | Да | Да | Да | P2+ | Нет |

Python по умолчанию использует полностью автономный Worker Pyright 1.1.413 со стабами стандартной библиотеки Python 3.12 и незаметно возвращается к P2 при несовместимости старого WebView или сбое runtime. Lua по умолчанию использует автономный сопутствующий процесс LuaLS 3.18.2 на arm64-v8a, armeabi-v7a и x86_64 и незаметно возвращается к P2, если нативный runtime недоступен или завершается с ошибкой. Java сочетает изолированное дополнение P2 из стандартной библиотеки и текущего документа с диагностикой ECJ одного файла. Kotlin предоставляет дополнение P2+ без семантического Provider. Для запуска синтаксиса `class` в скриптах Rhino, включая наследование классов Java, нужен AutoJs6 6.8.0 или новее.

Настройки редактора кода AutoJs6 показывают ту же матрицу из девяти режимов. Глобальный переключатель LSP управляет всеми семантическими службами, а отдельные переключатели доступны для TypeScript/JavaScript, Python, Lua и Java; Kotlin виден, но недоступен. Список типов файлов проверяется первым: удаление известного суффикса отключает его семантику, а добавление пользовательского суффикса лишь допускает файл в путь LSP, не меняя язык и не создавая семантический Provider.

******

### Сборка

******

Используйте включенный Gradle Wrapper с JDK 17 или новее и Android SDK 37:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Release-сборка:

```powershell
.\gradlew.bat :app:assembleRelease
```

После изменения ресурсов Ace, мобильного слоя или скриптов моста выполните следующие проверки:

```powershell
.\gradlew.bat :app:verifyAutoJs6AceAssets :app:verifyAutoJs6AceMobileOverlay :app:verifyAutoJs6AceBridge :app:typecheckAutoJs6AceBridge
```

Они сверяют упакованные файлы Ace 1.44.0 с манифестом блокировки (официальные файлы изменять нельзя), воспроизводят записанные сценарии касаний на мобильном слое, запускают тесты страницы редактора и моста в jsdom фиксированной версии и проверяют типы скриптов моста по объявлениям Ace. Все они входят в `check` и требуют Node.js.

Параметры сборки и версия берутся из `version.properties`; текущий минимальный SDK равен 24, целевой SDK равен 37.

После обновления или добавления `autojs6/types/**/*.d.ts` можно отдельно запустить следующую задачу:

```powershell
.\gradlew.bat :app:generateAutoJs6LspDeclarations
```

Задача проверяет ссылки объявлений и синтаксис TypeScript 6, затем создает ресурсы пяти групп LSP: `core`, `android`, `libraries`, `resources`, `main-app`, а также их manifest. `assemble` и `mergeAssets` уже зависят от нее, поэтому обычная сборка не требует дополнительных действий; внешние скрипты также могут вызывать ее напрямую. Результат записывается только в `app/build/generated/aceLspAssets` и не перезаписывает и не удаляет полные исходные объявления в `src/main/assets`. Если Node отсутствует в `PATH`, передайте `-Pautojs6.nodeExecutable=<путь-к-node>`.

После изменения источников статических индексов Python, Lua, Java или Kotlin в `tools/ace-lsp/generate-language-indices.mjs` пересоздайте версионируемые ресурсы этой задачей:

```powershell
.\gradlew.bat :app:generateAutoJs6LanguageIndices
```

Генератор фиксирует базовую версию каждого языка и создаёт детерминированные отдельные ресурсы в `autojs6/indices`; редактор загружает только активный язык при первом использовании. `verifyAutoJs6LanguageIndices` обнаруживает устаревшие файлы и входит в обычную цепочку проверки.

После изменения закреплённого исходного кода Worker Pyright явно пересоздайте фиксируемые ресурсы семантики Python этой задачей:

```powershell
.\gradlew.bat :app:generateAutoJs6PythonWorker
```

Проверьте версию Worker, хэши typeshed и лицензий, бюджет размера, семантику, откат и жизненный цикл с помощью:

```powershell
.\gradlew.bat :app:verifyAutoJs6PythonWorker
```

Обычная сборка APK упаковывает зафиксированный и проверенный Worker, не скачивая и не пересоздавая его. Семантические ресурсы занимают 4.822 MiB, что ниже порога опциональной доставки 8 MiB; старые WebView без поддержки его синтаксиса ES2022 продолжают использовать P2 без окна ошибки.

После изменения закрепленного исходного кода LuaLS или файла блокировки сборки явно пересоберите фиксируемый Android runtime с помощью:

```powershell
.\tools\ace-lsp\build-luals-android.ps1 `
  -NdkRoot <android-sdk>\ndk\29.0.14206865 `
  -OutputRoot build\luals-android\dist
```

Проверьте версию LuaLS, хэши runtime и ELF, перечень лицензий, семантику, откат по ABI и жизненный цикл с помощью:

```powershell
.\gradlew.bat :app:verifyAutoJs6LuaLanguageServer
```

Обычная сборка APK упаковывает зафиксированный и проверенный дистрибутив LuaLS, не скачивая и не пересобирая его. Размер 7.900 MiB ниже порога 8 MiB на язык; поддерживаются arm64-v8a, armeabi-v7a и x86_64, а неподдерживаемые ABI продолжают использовать P2 без окна ошибки.

******

### Установка

******

После сборки установите созданный APK:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v2.49.0-universal.apk
```

Затем включите `ace-editor` в центре плагинов AutoJs6, полностью закройте AutoJs6 и запустите его снова. Перезапускайте хост после установки, обновления или отката плагина.

В рабочей среде следует использовать подпись, которой доверяет AutoJs6. Код плагина в том же процессе наследует разрешения процесса хоста, поэтому не устанавливайте APK из неизвестных или непроверенных источников.

******

### История выпусков

******

# v2.49.0

###### 2026/11/02

* `Функция` Дополнение imgui и $imgui в скриптах Rhino: с AutoJs6 Plugin ImGui 1.18.x доступны дополнение и описания функций, оконных сеансов и членов возвращаемых объектов
* `Улучшение` Встроенные объявления обновлены до @sm003/autojs6-dts 4.87.0

# v2.48.0

###### 2026/11/01

* `Функция` Дополнение Node.js и Bun соответствует Node.js Runtime 2.1.0 и Bun Runtime 0.22.0: члены и возвращаемые объекты app, shell, системной информации, device, sensors, media, colors, files, zip, ui, floaty, web, terminal, compose, automator, auto, ocr, threads, timers, events и других модулей согласованы со скриптами AutoJs6
* `Функция` Дополнение API языковых сред AutoJs6 в скриптах Python, Lua, Java и Kotlin; подсказки Python показывают буквальные значения 54 констант
* `Функция` Дополнение членов параметров, полей и локальных переменных Java по объявленному типу либо типу выражения new или приведения типа в инициализаторе
* `Функция` Дополнение await() и sync(timeout) объектов Flow в Node.js и Bun
* `Функция` plugins.tools.call / callAsync дополняют имена 15 инструментов официальных плагинов; другие имена по-прежнему допустимы
* `Исправление` Отсутствовало дополнение членов результатов ocr.detect и barcode / qrcode detect
* `Исправление` Некоторые типы параметров и результатов отличались от модулей скриптов AutoJs6 (engines.stopAllAndToast, util.deprecate, условия селекторов Flow, параметры с поддержкой null и параметры задач)
* `Улучшение` Встроенные объявления обновлены до @sm003/autojs6-dts 4.86.0
* `Улучшение` Объявления OCR описывают extras, useCls, variant / profile PP-OCRv3 и mergeLine; статический индекс включает 55 фабрик компонентов compose и util.versionCodes
* `Улучшение` Дополнение updateAvailable и latestVersionCode в результатах speech.models.list в Node.js и Bun (требуется 3-Macaw Speech 1.4.0 или новее)

# v2.47.0

###### 2026/10/29

* `Функция` объявления speech добавляют diarize, detectLanguage и tag с их формами Async: разделение по говорящим (кто и когда говорил, по желанию с именами по зарегистрированным голосовым отпечаткам), определение языка и разметку звуков (527 меток AudioSet); параметры принимают обратный вызов onProgress, добавлены типы результатов, такие как Speech.Diarization, Speech.LanguageDetection и Speech.Tagging (AutoJs6 6.8.0 или новее, нужен 3-Macaw Speech 1.3.0)
* `Функция` объявления speech добавляют speech.speaker для распознавания говорящего: enroll, verify и identify с их формами Async, list и remove, а также коды ошибок SPEAKER_NOT_FOUND и AUDIO_TOO_SHORT (AutoJs6 6.8.0 или новее, нужен 3-Macaw Speech 1.3.0)
* `Улучшение` в Speech.Feature добавлены 'speaker', 'diarization', 'languageId' и 'audioTagging'; в Speech.Kind добавлены типы моделей 'speaker', 'segment', 'langid' и 'tagger', которые принимают models.list, setDefault и getDefault

##### Подробнее об истории выпусков

* [CHANGELOG.md](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/assets/doc/CHANGELOG-ru.md)

******

### Структура ресурсов

******

```text
.readme/lang_*.json
.changelog/lang_*.json
.python/generate_markdown.py
app/src/main/res/values-*/strings.xml
app/src/main/assets/doc/CHANGELOG*.md
```

`strings.xml` содержит локализованные метаданные плагина и тексты интерфейса редактора. Файлы README и CHANGELOG генерируются из JSON-источников с помощью `.python/generate_markdown.py`, а последний локализованный changelog также записывается в каталог `assets/doc` APK.

******

### Ссылки

******

- Проект AutoJs6: https://github.com/SuperMonster003/AutoJs6
- Сайт Ace: https://ace.c9.io
- Уведомления о сторонних компонентах: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/THIRD_PARTY_NOTICES.md
- Лицензия проекта: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE


[16 KB page alignment and build verification](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/docs/16kb.md)
