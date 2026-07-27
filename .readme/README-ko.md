<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <h1>AutoJs6 Ace Editor Plugin</h1>

  <p>AutoJs6용 독립형 Ace 코드 편집기 플러그인</p>

  <p>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/SuperMonster003/AutoJs6-Plugin-Ace-Editor?label=Release"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/issues"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=A24232&label=Issues"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE"><img alt="GitHub License" src="https://img.shields.io/github/license/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=534BAE&label=License"/></a>
  </p>
</div>

******

### 언어 (Languages)

******

현재 README.md는 다음 언어를 지원합니다:

- [简体中文 [zh-Hans]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hans.md)
- [繁體中文 (香港) [zh-Hant-HK]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-HK.md)
- [繁體中文 (台灣) [zh-Hant-TW]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-TW.md)
- [English [en]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-en.md)
- [Français [fr]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-fr.md)
- [Español [es]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-es.md)
- [日本語 [ja]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ja.md)
- 한국어 [ko] # 현재
- [Русский [ru]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ru.md)
- [العربية [ar]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ar.md)

******

### 소개

******

AutoJs6 Ace Editor 플러그인은 Ace WebView 런타임, JavaScript 브리지, 입력기 적응, 내장 언어 서비스 및 편집기 자산을 호스트 APK에서 분리합니다. 일반 Android APK로 설치되며 타입이 지정된 Editor API를 통해 AutoJs6 프로세스 내부에서 실행됩니다.

******

### 기능

******

- 플러그인 ID `ace-editor`, 엔진 `editor`, 변형 `ace`를 제공하며 `org.autojs.plugin.INFO` 및 `org.autojs.plugin.EDITOR`를 통한 검색을 지원합니다.
- Editor API 계약 1을 사용하며 AutoJs6 `6.8.0 Alpha7` build `5235` 이상 및 Android API 24 이상이 필요합니다.
- 텍스트 편집, 실행 취소/다시 실행, 검색 및 바꾸기, 정규식 및 단어 단위 검색, 커서 및 선택 영역 탐색, 줄 작업, 중단점, 주석 전환 및 코드 서식을 지원합니다.
- JavaScript/TypeScript 언어 서비스와 AutoJs6 타입 선언이 포함되어 있으며 자동 완성, hover, diagnostics 및 signature help를 제공합니다. JSON에는 syntax diagnostics만 제공합니다.
- CRLF 보존, 증분 텍스트 동기화, 대용량 텍스트의 청크 로딩, 매우 긴 줄을 위한 경량 모드, IME 적응, 런타임 상태 모니터링 및 호스트 기본 편집기로의 폴백 알림을 지원합니다.
- 테마와 표시 설정을 제공하며 서명된 카탈로그 검증, SHA-256/WOFF2 검증, 다운로드, 캐싱, 설치 및 제거 기능을 갖춘 글꼴 관리 기능을 제공합니다.
- 플러그인 메타데이터, README 및 CHANGELOG 콘텐츠를 스페인어, 프랑스어, 러시아어, 아랍어, 일본어, 한국어, 영어, 중국어 간체, 홍콩 중국어 번체 및 대만 중국어 번체로 현지화합니다.

******

### 빌드

******

포함된 Gradle Wrapper를 JDK 17 이상 및 Android SDK 36과 함께 사용합니다:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Release 빌드:

```powershell
.\gradlew.bat :app:assembleRelease
```

빌드 매개변수와 버전은 `version.properties`에서 가져옵니다. 현재 최소 SDK는 24이고 대상 SDK는 36입니다.

`autojs6/types/**/*.d.ts`를 업데이트하거나 추가한 후 다음 작업을 단독으로 실행할 수 있습니다:

```powershell
.\gradlew.bat :app:generateAutoJs6LspDeclarations
```

이 작업은 선언 참조와 TypeScript 6 구문을 검증한 다음 `core`, `android`, `libraries`, `resources`, `main-app`의 5개 LSP 자산과 manifest를 생성합니다. `assemble`과 `mergeAssets`는 이미 이 작업에 의존하므로 일반 빌드에는 추가 단계가 필요하지 않으며 외부 스크립트에서도 직접 호출할 수 있습니다. 생성 결과는 `app/build/generated/aceLspAssets`에만 기록되고 `src/main/assets`의 전체 원본 선언을 덮어쓰거나 삭제하지 않습니다. Node가 `PATH`에 없다면 `-Pautojs6.nodeExecutable=<node-path>`를 전달하십시오.

******

### 설치

******

빌드 후 생성된 APK를 설치합니다:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.1-universal.apk
```

그런 다음 AutoJs6 플러그인 센터에서 `ace-editor`를 활성화하고 AutoJs6를 완전히 종료한 후 다시 시작합니다. 플러그인을 설치, 업데이트 또는 롤백한 후에는 호스트를 다시 시작하십시오.

프로덕션 설치에는 AutoJs6가 신뢰하는 서명을 사용해야 합니다. 프로세스 내부 플러그인 코드는 호스트 프로세스의 권한을 상속하므로 출처를 알 수 없거나 감사되지 않은 APK를 설치하지 마십시오.

******

### 릴리스 기록

******

# v1.1.1

###### 2026/07/27

* `수정` `App.CHROME` 및 대규모 `R.string.text_*` 리소스를 포함한 선택적 선언 그룹의 정적 멤버 자동 완성을 수정하고, Ace의 잘린 완성 후보 목록이 접두사 변경 시 디바운스 방식으로 새로 고쳐지도록 개선

# v1.1.0

###### 2026/07/27

* `기능` 전체 원본 선언을 그대로 유지하면서 선택 가능한 AutoJs6 LSP 선언 그룹을 추가: `core`는 항상 활성화되고 `android`, `libraries`, `resources`, `main-app`은 기본적으로 비활성화됨. `libraries`를 선택하면 `android`도 활성화되고, `main-app`을 선택하면 `android`, `libraries`, `resources`도 활성화됨
* `기능` 선언을 검증하고 5개 LSP 그룹과 manifest를 생성하는 `:app:generateAutoJs6LspDeclarations` Gradle 작업을 추가. 일반 자산 병합 시 자동으로 실행되며 외부 스크립트에서도 직접 호출 가능
* `의존성` 내장 TypeScript 언어 서비스와 표준 라이브러리 선언을 `4.2.4`에서 `6.0.3`으로 업그레이드

# v1.0.0

###### 2026/07/21

* `기능` 플러그인 ID `ace-editor`, 엔진 `editor`, 변형 `ace`를 갖춘 독립형 Ace 편집기 플러그인을 추가
* `기능` `org.autojs.permission.PLUGIN`으로 보호되는 `org.autojs.plugin.INFO` 및 `org.autojs.plugin.EDITOR` 구성 요소를 통한 플러그인 검색을 추가하고 Editor API 계약은 1, 최소 호스트 build는 `5234`로 설정
* `기능` 실행 취소/다시 실행, 검색 및 바꾸기, 정규식 및 단어 단위 검색, 커서 및 선택 영역 탐색, 줄 작업, 중단점, 주석 전환 및 코드 서식을 포함한 Ace `1.4.12` 편집 기능을 추가
* `기능` 자동 완성, hover, diagnostics 및 signature help를 제공하는 내장 JavaScript/TypeScript 언어 서비스와 AutoJs6 타입 선언을 추가하고 JSON에는 syntax diagnostics만 추가
* `기능` 증분 텍스트 동기화, CRLF 보존, 대용량 텍스트의 청크 로딩, 매우 긴 줄을 위한 경량 모드 및 IME 적응을 추가
* `기능` 테마와 표시 설정 및 서명된 카탈로그와 파일 무결성 검증을 갖춘 글꼴 다운로드, 캐싱, 설치 및 제거 기능을 추가
* `기능` WebView 런타임 상태 모니터링, 하트비트 감지 및 호스트 기본 편집기로의 폴백 알림을 추가
* `기능` 플러그인 메타데이터, README 및 CHANGELOG 콘텐츠에 스페인어, 프랑스어, 러시아어, 아랍어, 일본어, 한국어, 영어, 중국어 간체, 홍콩 중국어 번체 및 대만 중국어 번체 현지화를 추가

##### 더 많은 릴리스 기록

* [CHANGELOG.md](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/assets/doc/CHANGELOG-ko.md)

******

### 리소스 구조

******

```text
.readme/lang_*.json
.changelog/lang_*.json
.python/generate_markdown.py
app/src/main/res/values-*/strings.xml
app/src/main/assets/doc/CHANGELOG*.md
```

`strings.xml`에는 현지화된 플러그인 메타데이터와 편집기 UI 텍스트가 포함됩니다. README와 CHANGELOG는 `.python/generate_markdown.py`가 JSON 소스에서 생성하며 최신 현지화 변경 로그도 APK의 `assets/doc` 디렉터리에 기록됩니다.

******

### 링크

******

- AutoJs6 프로젝트: https://github.com/SuperMonster003/AutoJs6
- Ace 웹사이트: https://ace.c9.io
- 타사 고지 사항: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/THIRD_PARTY_NOTICES.md
- 프로젝트 라이선스: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE
