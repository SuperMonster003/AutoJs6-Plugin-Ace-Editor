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
- Использует контракт Editor API 1 и требует AutoJs6 `6.8.0 Alpha7` build `5234` или новее, а также Android API 24 или новее.
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

******

### Установка

******

После сборки установите созданный APK:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.0.0-universal.apk
```

Затем включите `ace-editor` в центре плагинов AutoJs6, полностью закройте AutoJs6 и запустите его снова. Перезапускайте хост после установки, обновления или отката плагина.

В рабочей среде следует использовать подпись, которой доверяет AutoJs6. Код плагина в том же процессе наследует разрешения процесса хоста, поэтому не устанавливайте APK из неизвестных или непроверенных источников.

******

### История выпусков

******

# v1.0.0

###### 2026/07/21

* `Функция` Добавлен автономный плагин редактора Ace с идентификатором плагина `ace-editor`, движком `editor` и вариантом `ace`
* `Функция` Добавлено обнаружение через компоненты `org.autojs.plugin.INFO` и `org.autojs.plugin.EDITOR`, защищенные разрешением `org.autojs.permission.PLUGIN`, с контрактом Editor API 1 и минимальным build хоста `5234`
* `Функция` Добавлены функции редактирования Ace `1.4.12`, включая отмену и повтор действий, поиск и замену, поиск по регулярным выражениям и целым словам, перемещение курсора и выделения, операции со строками, точки останова, переключение комментариев и форматирование кода
* `Функция` Добавлены встроенные языковые службы JavaScript/TypeScript и объявления типов AutoJs6 с автодополнением, информацией при наведении, диагностикой и подсказками сигнатур, тогда как служба JSON предоставляет только диагностику синтаксиса
* `Функция` Добавлены инкрементальная синхронизация текста, сохранение CRLF, порционная загрузка больших текстов, облегченный режим для очень длинных строк и адаптация IME
* `Функция` Добавлены темы и настройки отображения, а также загрузка, кеширование, установка и удаление шрифтов с проверкой подписанного каталога и целостности файлов
* `Функция` Добавлены мониторинг состояния среды выполнения WebView, обнаружение контрольных сигналов и уведомления о возврате к нативному редактору хоста
* `Функция` Добавлены локализованные метаданные плагина и содержимое README и CHANGELOG для испанского, французского, русского, арабского, японского, корейского, английского, упрощенного китайского, гонконгского традиционного китайского и тайваньского традиционного китайского

##### Подробнее об истории выпусков

* [CHANGELOG.md](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.changelog/CHANGELOG-ru.md)

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
