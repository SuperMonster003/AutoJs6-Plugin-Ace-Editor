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
- 필요할 때 생성되는 Pyright 1.1.413 WebWorker로 Python 3.12 의미 분석을 내장하여 타입 기반 자동 완성, hover, signature help, 진단 및 정의 이동을 제공합니다. 호환되지 않는 구형 WebView는 조용히 P2를 유지합니다.
- 기기 내 LuaLS 3.18.2 동반 프로세스로 완전 오프라인 Lua 의미 기능을 내장하여 arm64-v8a, armeabi-v7a 및 x86_64에서 자동 완성, hover, signature help, 진단 및 정의 이동을 기본 활성화합니다. 지원되지 않는 ABI와 runtime 실패 시 조용히 P2를 유지합니다.
- CRLF 보존, 증분 텍스트 동기화, 대용량 텍스트의 청크 로딩, 매우 긴 줄을 위한 경량 모드, IME 적응, 런타임 상태 모니터링 및 호스트 기본 편집기로의 폴백 알림을 지원합니다.
- 테마와 표시 설정을 제공하며 서명된 카탈로그 검증, SHA-256/WOFF2 검증, 다운로드, 캐싱, 설치 및 제거 기능을 갖춘 글꼴 관리 기능을 제공합니다.
- 플러그인 메타데이터, README 및 CHANGELOG 콘텐츠를 스페인어, 프랑스어, 러시아어, 아랍어, 일본어, 한국어, 영어, 중국어 간체, 홍콩 중국어 번체 및 대만 중국어 번체로 현지화합니다.

******

### 프로그래밍 언어 지원

******

아래 표는 현재 포함된 언어 기능을 설명합니다. 의미 지원에는 타입 기반 완성, 타입 진단, hover 및 시그니처 도움말이 포함됩니다:

| 언어 | 구문 강조 | 키워드 완성 | 스니펫 | 로컬 자동 완성 | 의미 지원 |
|---|---:|---:|---:|---:|---:|
| JavaScript | 지원 | 지원 | 지원 | 지원 | 지원 |
| JSX | 지원 | 없음 | 없음 | 지원 | 지원 |
| TypeScript | 지원 | 지원 | 지원 | 지원 | 지원 |
| TSX | 부분 지원 | 지원 | 지원 | 지원 | 지원 |
| JSON | 지원 | 없음 | 없음 | 없음 | 구문 진단만 |
| Python | 지원 | 지원 | 지원 | 지원 | 지원 |
| Lua | 지원 | 지원 | 지원 | 지원 | 지원 |
| Java | 지원 | 지원 | 지원 | 지원 | 없음 |
| Kotlin | 지원 | 지원 | 지원 | 지원 | 없음 |

Ace 1.4.12의 TSX는 TypeScript mode를 사용하므로 JSX 태그 강조는 부분 지원입니다. Python은 Python 3.12 표준 라이브러리 stub을 포함한 완전 오프라인 Pyright 1.1.413 Worker를 기본으로 사용하며 구형 WebView 비호환 또는 runtime 실패 시 조용히 P2로 전환합니다. Lua는 arm64-v8a, armeabi-v7a 및 x86_64에서 완전 오프라인 LuaLS 3.18.2 동반 프로세스를 기본으로 사용하며 네이티브 runtime을 사용할 수 없거나 실패하면 조용히 P2로 전환합니다. Java 및 Kotlin은 언어별로 격리되고 지연 로드되는 표준 라이브러리와 현재 문서 P2 자동 완성을 유지하며 변수 타입 추론은 수행하지 않습니다. TypeScript의 기존 의미 동작은 유지되며 Java 및 Kotlin의 의미 스위치는 이후 마일스톤까지 기본적으로 꺼져 있습니다.

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

`tools/ace-lsp/generate-language-indices.mjs`의 Python, Lua, Java 또는 Kotlin 정적 인덱스 소스를 변경한 후 이 작업으로 커밋 대상 자산을 다시 생성합니다:

```powershell
.\gradlew.bat :app:generateAutoJs6LanguageIndices
```

생성기는 각 언어 기준 버전을 고정하고 `autojs6/indices` 아래에 결정적인 언어별 자산을 출력합니다; 편집기는 처음 사용할 때 활성 언어만 로드합니다. `verifyAutoJs6LanguageIndices`는 오래된 생성 파일을 감지하며 일반 검증 체인에 포함됩니다.

고정된 Pyright Worker 소스를 변경한 뒤 이 작업으로 커밋할 Python 의미 자산을 명시적으로 다시 생성합니다:

```powershell
.\gradlew.bat :app:generateAutoJs6PythonWorker
```

커밋된 Worker 버전, typeshed 및 라이선스 해시, 크기 예산, 의미 동작, 폴백과 수명 주기를 다음 작업으로 검증합니다:

```powershell
.\gradlew.bat :app:verifyAutoJs6PythonWorker
```

일반 APK 빌드는 커밋되고 검증된 Worker만 패키징하며 다운로드하거나 다시 생성하지 않습니다. 의미 자산은 4.822 MiB로 8 MiB 선택적 배포 기준보다 작습니다; ES2022 구문을 파싱하지 못하는 구형 WebView는 오류 대화상자 없이 P2를 계속 사용합니다.

고정된 LuaLS 소스 또는 빌드 잠금을 변경한 뒤 다음 명령으로 커밋할 Android runtime을 명시적으로 다시 빌드합니다:

```powershell
.\tools\ace-lsp\build-luals-android.ps1 `
  -NdkRoot <android-sdk>\ndk\29.0.14206865 `
  -OutputRoot build\luals-android\dist
```

커밋된 LuaLS 버전, runtime 및 ELF 해시, 라이선스 목록, 의미 동작, ABI 폴백과 수명 주기를 다음 작업으로 검증합니다:

```powershell
.\gradlew.bat :app:verifyAutoJs6LuaLanguageServer
```

일반 APK 빌드는 커밋되고 검증된 LuaLS 배포본만 패키징하며 다운로드하거나 다시 빌드하지 않습니다. 7.900 MiB 페이로드는 언어별 8 MiB 배포 기준보다 작고 arm64-v8a, armeabi-v7a 및 x86_64를 지원합니다; 지원되지 않는 ABI는 오류 대화상자 없이 P2를 계속 사용합니다.

******

### 설치

******

빌드 후 생성된 APK를 설치합니다:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.18-universal.apk
```

그런 다음 AutoJs6 플러그인 센터에서 `ace-editor`를 활성화하고 AutoJs6를 완전히 종료한 후 다시 시작합니다. 플러그인을 설치, 업데이트 또는 롤백한 후에는 호스트를 다시 시작하십시오.

프로덕션 설치에는 AutoJs6가 신뢰하는 서명을 사용해야 합니다. 프로세스 내부 플러그인 코드는 호스트 프로세스의 권한을 상속하므로 출처를 알 수 없거나 감사되지 않은 APK를 설치하지 마십시오.

******

### 릴리스 기록

******

# v1.1.18

###### 2026/08/31

* `기능` AutoJs6 `4.6.0` 리소스 안전 PNG 양자화 선언과 다시 생성한 main-app LSP 그룹을 포함: 구성 가능한 `maxPixels` 및 `maxMemoryBytes` 예산 초과는 형식화된 세부 정보와 함께 실패하고, 결과는 `peakWorkingMemoryBytes`를 노출하며, 취소 API는 명시적 요청과 스크립트 종료를 처리
* `기능` Python, Lua, Java 및 Kotlin 오프라인 P1 언어 지원 추가: 확장자별 Ace mode에서 구문 강조, 언어 키워드, 스니펫 및 문서 단어 완성을 제공; Lua는 worker 구문 진단도 활성화하며 네 언어 모두 AutoJs6/TypeScript 후보와 격리
* `기능` Python, Lua, Java 및 Kotlin 오프라인 P2 자동 완성 추가: 고정 버전 표준 라이브러리 인덱스를 필요할 때 로드하고 현재 문서의 import, 함수, 클래스, 메서드, 매개변수 및 변수를 추출하며 언어 간 격리와 기존 JavaScript/TypeScript 동작을 유지
* `기능` 8개 기능의 교체 가능한 의미 Provider, 범용 JSON-RPC/LSP 코어 및 WebWorker/기기 내 stdio 전송 추가; TypeScript는 회귀 없이 이전되고 provider 장애 시 P2로 대체되며 네 언어의 의미 스위치는 기본적으로 꺼짐
* `기능` 고정된 Pyright 1.1.413 Worker와 271개 typeshed 파일 하위 집합으로 완전 오프라인 Python 3.12 의미 기능 내장; 타입 기반 자동 완성, hover, signature help, 진단 및 정의 이동을 기본 활성화하고 호환되지 않는 구형 WebView 또는 runtime 실패 시 조용히 P2로 전환
* `기능` 고정된 기기 내 LuaLS 3.18.2 동반 프로세스로 완전 오프라인 Lua 의미 기능 내장; arm64-v8a, armeabi-v7a 및 x86_64에서 자동 완성, hover, signature help, 진단 및 정의 이동을 기본 활성화하고 네이티브 자산 누락이나 손상, 지원되지 않는 ABI 및 프로세스 충돌 시 조용히 P2로 전환한 뒤 제한된 백오프로 복구

# v1.1.17

###### 2026/08/31

* `기능` AutoJs6 `4.5.0` 색상 정확도 PNG 양자화 선언과 다시 생성한 main-app LSP 그룹을 포함: `images.quantizeToFile`은 파일에 직접 쓰고 크기와 품질 지표를 반환하며, `preserveAlpha`는 투명 또는 불투명 출력을 제어

# v1.1.16

###### 2026/08/30

* `기능` AutoJs6 `4.4.0` PNG 양자화 결과 선언과 다시 생성한 main-app LSP 그룹을 포함: `images.quantize`는 인코딩 바이트, 크기, 실제 품질 및 양자화 오차를 반환하고, 명시한 품질 하한을 충족할 수 없으면 형식화된 `QualityTooLowException`을 공개

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
