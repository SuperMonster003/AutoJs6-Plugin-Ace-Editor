<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <h1>AutoJs6 Ace Editor Plugin</h1>

  <p>Автономный плагин редактора кода Ace для AutoJs6</p>

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
- Использует контракт Editor API 1 и требует AutoJs6 `6.8.0 Alpha7` build `5235` или новее, а также Android API 24 или новее.
- Поддерживает редактирование текста, отмену и повтор действий, поиск и замену, поиск по регулярным выражениям и целым словам, перемещение курсора и выделения, операции со строками, точки останова, переключение комментариев и форматирование кода.
- Включает встроенные языковые службы JavaScript/TypeScript и объявления типов AutoJs6 с автодополнением, информацией при наведении, диагностикой и подсказками сигнатур, тогда как служба JSON предоставляет только диагностику синтаксиса.
- Поддерживает сохранение CRLF, инкрементальную синхронизацию текста, порционную загрузку больших текстов, облегченный режим для очень длинных строк, адаптацию IME, мониторинг состояния среды выполнения и уведомления о переключении обратно на нативный редактор хоста.
- Предоставляет темы и настройки отображения, а также управление шрифтами с проверкой подписанного каталога, валидацией SHA-256/WOFF2, загрузкой, кешированием, установкой и удалением.
- Метаданные плагина, README и CHANGELOG локализованы на испанский, французский, русский, арабский, японский, корейский, английский, упрощенный китайский, гонконгский традиционный китайский и тайваньский традиционный китайский.

******

### Сборка

******

Используйте включенный Gradle Wrapper с JDK 17 или новее и Android SDK 36:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Release-сборка:

```powershell
.\gradlew.bat :app:assembleRelease
```

Параметры сборки и версия берутся из `version.properties`; текущий минимальный SDK равен 24, целевой SDK равен 36.

После обновления или добавления `autojs6/types/**/*.d.ts` можно отдельно запустить следующую задачу:

```powershell
.\gradlew.bat :app:generateAutoJs6LspDeclarations
```

Задача проверяет ссылки объявлений и синтаксис TypeScript 6, затем создает ресурсы пяти групп LSP: `core`, `android`, `libraries`, `resources`, `main-app`, а также их manifest. `assemble` и `mergeAssets` уже зависят от нее, поэтому обычная сборка не требует дополнительных действий; внешние скрипты также могут вызывать ее напрямую. Результат записывается только в `app/build/generated/aceLspAssets` и не перезаписывает и не удаляет полные исходные объявления в `src/main/assets`. Если Node отсутствует в `PATH`, передайте `-Pautojs6.nodeExecutable=<путь-к-node>`.

******

### Установка

******

После сборки установите созданный APK:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.16-universal.apk
```

Затем включите `ace-editor` в центре плагинов AutoJs6, полностью закройте AutoJs6 и запустите его снова. Перезапускайте хост после установки, обновления или отката плагина.

В рабочей среде следует использовать подпись, которой доверяет AutoJs6. Код плагина в том же процессе наследует разрешения процесса хоста, поэтому не устанавливайте APK из неизвестных или непроверенных источников.

******

### История выпусков

******

# v1.1.16

###### 2026/08/30

* `Функция` Добавлены декларации результата PNG-квантования AutoJs6 `4.4.0` и заново созданная группа LSP main-app: `images.quantize` возвращает кодированные байты, размер, достигнутое качество и ошибку квантования; недостижимая явно заданная нижняя граница качества предоставляет типизированное `QualityTooLowException`

# v1.1.15

###### 2026/08/30

* `Функция` Добавлены декларации параметров PNG-квантования AutoJs6 `4.3.0` и заново созданные группы LSP main-app/resources: `Images.PngQuantizationOptions` охватывает размер палитры, скорость, границы качества, дизеринг и posterize, сохраняя совместимость числового `quality`

# v1.1.14

###### 2026/08/29

* `Функция` Добавлено переименование символов TypeScript во всем проекте через F2 и мобильное действие `Переименовать`: Ace получает ограниченные межфайловые правки из точного снимка проекта, запрашивает авторизацию contract 5 у AutoJs6, а предпросмотр, проверку конфликтов, атомарную публикацию, откат и все записи на диск полностью выполняет Host
* `Функция` Добавлены быстрые исправления TypeScript для автоимпорта и опечаток через Ctrl/Command+. и мобильное действие `Быстрое исправление`: Ace ограничивает исправления упорядоченными правками активного буфера, запрашивает у AutoJs6 6.8.0 (5276) авторизацию контракта 4 и применяет одобренный результат как одно отменяемое изменение
* `Функция` Межфайловый интеллект TypeScript теперь охватывает completion, hover, помощь по сигнатурам и переход к определениям в исходниках проекта и замороженных декларациях зависимостей; F12, Ctrl/Command-click и мобильное действие `Перейти к определению` отправляют цели контракта 3, которые AutoJs6 6.8.0 (5276) независимо проверяет перед открытием и позиционированием
* `Функция` Добавлена диагностика проектов TypeScript на основе данных хоста: Ace проверяет и загружает полный ограниченный snapshot исходников, разрешает импорты между файлами проекта и подсвечивает отсутствующие модули так же, как компиляция перед запуском; требуется AutoJs6 6.8.0 (5276) или новее
* `Функция` Слои типов проектов TypeScript теперь обнаруживают признаки нативных дополнений и hooks жизненного цикла установки до продолжения редактирования, публикуя ту же стабильную ошибку границы зависимостей и рекомендации pure JavaScript/WASM, что хост и compiler
* `Функция` Полномочия типов зависимостей Ace синхронизированы с политикой resolver revision 3; добавлена проверка lodash 4.17.21 вместе с `@types/lodash` 4.17.25, сохраняющая одинаковые диагностики Rhino и Node для runtime-пакетов без встроенных деклараций
* `Функция` Добавлен frozen project dependency type layer, общий с compiler TypeScript: Ace теперь разрешает package `types`/`typings`, TypeScript 6 `typesVersions`, вложенные declarations и установленные `@types`, обеспечивая одинаковые completion dayjs, hover и strict diagnostics для Rhino и Node
* `Функция` Встроены R8-декларации AutoJs6 `4.2.0` и сгенерированные группы LSP: шесть перегрузок `ScriptRuntime.loadJarWithR8` добавляют проверенный экспорт mapping/seeds/usage/retrace metadata, а `retraceR8Stack` восстанавливает стек с привязкой к происхождению по протоколу 1.1 и без fallback при ошибке выбора Provider

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
