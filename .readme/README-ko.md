<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <p>
    <picture>
      <source srcset="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap-night/ic_launcher.png?raw=true" media="(prefers-color-scheme: dark)" />
      <img src="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap/ic_launcher.png?raw=true" alt="autojs6-plugin-ace-editor-ic-launcher" border="0" width="128" />
    </picture>
  </p>

  <p>언어 서비스를 제공하는 내장 Ace 코드 편집기</p>

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
- Editor API 계약 7를 사용하며 AutoJs6 빌드 5352 이상 및 Android API 24 이상이 필요합니다.
- 텍스트 편집, 실행 취소/다시 실행, 검색 및 바꾸기, 정규식 및 단어 단위 검색, 커서 및 선택 영역 탐색, 줄 작업, 중단점, 주석 전환 및 코드 서식을 지원합니다.
- 편집기의 "편집 > 접기 > 모두 펼치기/모두 접기"로 문서 전체의 코드 블록을 제어하며, 중첩된 접기와 읽기 전용 문서를 지원하고 텍스트, 선택 영역 및 실행 취소 기록을 유지.
- Ace 1.44.0을 기반으로 하며, 탭, 두 번 탭/길게 눌러 단어 선택, 커서와 선택 핸들 드래그, 관성 스크롤, 핀치 확대/축소, 드래그 돋보기 같은 터치 동작은 플러그인 자체의 모바일 오버레이가 제공합니다.
- 호스트의 코드 편집기 설정에서 벡터 거터 아이콘, 활성 들여쓰기 안내선 강조, 편집기 스크롤 막대와 자동 숨기기, 선택 영역 안의 공백 문자, 드래그 돋보기, 같은 기호 강조, 자동 완성 인라인 미리보기를 켜고 끌 수 있습니다. 돋보기와 인라인 미리보기는 기본적으로 꺼져 있으며, 이 설정이 없는 호스트에서는 기본값으로 동작합니다.
- JavaScript/TypeScript 언어 서비스와 AutoJs6 타입 선언이 포함되어 있으며 자동 완성, hover, diagnostics 및 signature help를 제공합니다. JSON에는 syntax diagnostics만 제공합니다.
- 필요할 때 생성되는 Pyright 1.1.413 WebWorker로 Python 3.12 의미 분석을 내장하여 타입 기반 자동 완성, hover, signature help, 진단 및 정의 이동을 제공합니다. 호환되지 않는 구형 WebView는 조용히 P2를 유지합니다.
- 기기 내 LuaLS 3.18.2 동반 프로세스로 완전 오프라인 Lua 의미 기능을 내장하여 arm64-v8a, armeabi-v7a 및 x86_64에서 자동 완성, hover, signature help, 진단 및 정의 이동을 기본 활성화합니다. 지원되지 않는 ABI와 runtime 실패 시 조용히 P2를 유지합니다.
- CRLF 보존, 증분 텍스트 동기화, 대용량 텍스트의 청크 로딩, 매우 긴 줄을 위한 경량 모드, IME 적응, 런타임 상태 모니터링 및 호스트 기본 편집기로의 폴백 알림을 지원합니다.
- 테마와 표시 설정을 제공하며 서명된 카탈로그 검증, SHA-256/WOFF2 검증, 다운로드, 캐싱, 설치 및 제거 기능을 갖춘 글꼴 관리 기능을 제공합니다.
- 플러그인 메타데이터, README 및 CHANGELOG 콘텐츠를 스페인어, 프랑스어, 러시아어, 아랍어, 일본어, 한국어, 영어, 중국어 간체, 홍콩 중국어 번체 및 대만 중국어 번체로 현지화합니다.
- 기기 ABI에 맞는 APK 또는 universal APK를 선택하세요. Lua 의미 분석은 arm64-v8a, armeabi-v7a, x86_64에서 사용할 수 있으며 x86은 편집기와 정적 완성을 제공합니다.

******

### 프로그래밍 언어 지원

******

아래 표는 현재 포함된 언어 기능을 설명합니다. 의미 지원에는 타입 기반 완성, 타입 진단, hover 및 시그니처 도움말이 포함됩니다:

| 언어 | 구문 강조 | 키워드 완성 | 스니펫 | 로컬 자동 완성 | 의미 지원 |
|---|---:|---:|---:|---:|---:|
| JavaScript | 지원 | 지원 | 지원 | 지원 | 지원 |
| JSX | 지원 | 없음 | 없음 | 지원 | 지원 |
| TypeScript | 지원 | 지원 | 지원 | 지원 | 지원 |
| TSX | 지원 | 지원 | 지원 | 지원 | 지원 |
| JSON | 지원 | 없음 | 없음 | 없음 | 구문 진단만 |
| Python | 지원 | 지원 | 지원 | 지원 | 지원 |
| Lua | 지원 | 지원 | 지원 | 지원 | 지원 |
| Java | 지원 | 지원 | 지원 | 지원 | 단일 파일 진단 |
| Kotlin | 지원 | 지원 | 지원 | P2+ | 없음 |

Python은 Python 3.12 표준 라이브러리 stub을 포함한 완전 오프라인 Pyright 1.1.413 Worker를 기본으로 사용하며 구형 WebView 비호환 또는 runtime 실패 시 조용히 P2로 전환합니다. Lua는 arm64-v8a, armeabi-v7a 및 x86_64에서 완전 오프라인 LuaLS 3.18.2 동반 프로세스를 기본으로 사용하며 네이티브 runtime을 사용할 수 없거나 실패하면 조용히 P2로 전환합니다. Java는 격리된 표준 라이브러리와 현재 문서 P2 자동 완성에 ECJ 단일 파일 진단을 결합합니다. Kotlin은 의미 Provider 없이 P2+ 자동 완성을 제공합니다.

AutoJs6 코드 편집기 설정은 동일한 9-mode matrix를 표시합니다. 전역 LSP switch가 모든 의미 서비스를 제어하고 TypeScript/JavaScript, Python, Lua 및 Java에는 언어별 switch가 있습니다; Kotlin은 표시되지만 사용할 수 없습니다. 파일 형식 목록이 먼저 평가됩니다: 인식된 suffix를 제거하면 해당 의미 기능이 꺼지고 custom suffix를 추가하면 파일이 LSP path에 들어갈 뿐 다른 언어로 재분류되거나 의미 Provider가 생성되지 않습니다.

******

### 빌드

******

포함된 Gradle Wrapper를 JDK 17 이상 및 Android SDK 37과 함께 사용합니다:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Release 빌드:

```powershell
.\gradlew.bat :app:assembleRelease
```

Ace 자산, 모바일 오버레이 또는 브리지 스크립트를 변경한 후에는 다음 검증을 개별적으로 실행할 수 있습니다:

```powershell
.\gradlew.bat :app:verifyAutoJs6AceAssets :app:verifyAutoJs6AceMobileOverlay :app:verifyAutoJs6AceBridge :app:typecheckAutoJs6AceBridge
```

번들된 Ace 1.44.0 파일을 잠금 매니페스트와 대조하고 (공식 파일은 수정 금지), 기록된 터치 시나리오로 모바일 오버레이를 재생하며, 고정 버전 jsdom에서 편집기 페이지와 브리지 테스트를 실행하고, Ace 타입 선언으로 브리지 스크립트를 타입 검사합니다. 모두 `check`에 포함되며 Node.js가 필요합니다.

빌드 매개변수와 버전은 `version.properties`에서 가져옵니다. 현재 최소 SDK는 24이고 대상 SDK는 37입니다.

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
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v2.0.2-universal.apk
```

그런 다음 AutoJs6 플러그인 센터에서 `ace-editor`를 활성화하고 AutoJs6를 완전히 종료한 후 다시 시작합니다. 플러그인을 설치, 업데이트 또는 롤백한 후에는 호스트를 다시 시작하십시오.

프로덕션 설치에는 AutoJs6가 신뢰하는 서명을 사용해야 합니다. 프로세스 내부 플러그인 코드는 호스트 프로세스의 권한을 상속하므로 출처를 알 수 없거나 감사되지 않은 APK를 설치하지 마십시오.

******

### 릴리스 기록

******

# v2.0.2

###### 2026/10/14

* `수정` 입력기가 아직 시작되는 중일 때 등 편집기를 탭해도 키보드가 나타나지 않으면 다시 탭해도 나타나지 않던 문제

# v2.0.1

###### 2026/10/14

* `수정` 느린 기기에서 Java, Lua 또는 Python 파일을 빠르게 편집하면 진단이 편집 전 내용에 머물러 다음 편집 때까지 갱신되지 않을 수 있던 문제

# v2.0.0

###### 2026/10/14

* `힌트` 새 편집기 옵션은 AutoJs6 코드 편집기 설정에서 켜고 끄며, 이 설정이 없는 이전 AutoJs6에서는 기본값으로 동작
* `기능` TSX 파일에 전용 구문 강조를 적용하여 JSX 태그와 속성을 올바른 색으로 표시
* `기능` 벡터 거터 아이콘, 활성 들여쓰기 안내선 강조 및 선택 영역의 공백 표시 (기본 켜짐)
* `기능` 편집기 스크롤 막대, 오류와 경고 위치를 표시하고 스크롤이 멈추면 자동으로 숨김 (기본 켜짐)
* `기능` 같은 기호 강조, 커서가 있는 기호의 다른 출현 위치를 표시하고 읽기와 쓰기를 구분 (기본 켜짐)
* `기능` 드래그 돋보기, 커서나 선택 핸들을 드래그할 때 손가락 아래 글자를 확대 (기본 꺼짐)
* `기능` 자동 완성 인라인 미리보기, 첫 번째 후보의 나머지를 커서 뒤에 회색으로 표시하고 TAB으로 수락 (기본 꺼짐)
* `수정` AutoJs6에서 Lua 파일을 편집할 때 자동 완성, 진단 등 의미 기능을 사용할 수 없는 문제
* `수정` AutoJs6에서 Java 파일을 편집할 때 진단이 컴파일러 장애만 보고하는 문제
* `수정` 어두운 테마에서 선택한 글자에 같은 단어 강조가 겹쳐 배경이 너무 밝아져 글자를 읽기 어려운 문제
* `수정` 두 손가락 확대/축소가 선택한 글자의 선택을 해제하고, 확대/축소 직후 두 번 탭으로 단어를 선택할 수 없는 문제
* `개선` 조금 느리게 탭해도 커서가 이동하며, 드래그 후 멈췄다가 손가락을 떼면 더 이상 관성 스크롤되지 않음
* `개선` 두 번 탭으로 단어를 선택한 후 커서가 손가락에 가까운 쪽 끝에 놓임
* `개선` 커서 위를 탭하거나 빈 곳을 길게 누르면 붙여넣기/전체 선택 도구 모음 표시
* `개선` 줄 번호 영역을 탭해도 더 이상 커서가 그 줄의 시작으로 이동하지 않으며, 진단이 있는 줄에서도 아이콘 옆에 중단점 설정 가능
* `개선` 외장 마우스와 스타일러스의 마우스 모드로 편집기에서 클릭하여 커서 이동, 더블 클릭으로 단어 선택, 드래그로 선택 가능
* `개선` 자동 완성 팝업, 설명 상자, 매개 변수 힌트, 호버 문서가 더 이상 커서가 있는 줄을 가리지 않음
* `개선` 매개 변수 힌트와 호버 문서의 글꼴 크기가 편집기 글꼴 크기를 따름
* `개선` 언어 서비스 응답이 느릴 때 자동 완성 팝업에 로딩 상태를 표시하고, 자동 완성을 직접 호출했는데 후보가 없으면 "제안 없음" 표시
* `개선` Gboard 등 입력기가 단어를 점과 함께 입력해도 멤버 자동 완성 표시
* `개선` Python과 Lua 자동 완성 후보를 언어 서비스가 제공한 순서로 정렬
* `개선` Gboard 텍스트 편집 패널과 스페이스바를 밀어 커서를 이동하는 기능 지원
* `개선` 매우 긴 줄의 잘린 위치에 있는 버튼을 손가락으로 탭해 자동 줄 바꿈을 전환할 수 있으며, 매우 긴 줄을 위한 경량 모드에서도 4096자를 넘는 줄을 이 버튼으로 자름
* `의존성` 내장 Ace 편집기를 `1.4.12`에서 `1.44.0`으로 업그레이드

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


[16 KB page alignment and build verification](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/docs/16kb.md)
