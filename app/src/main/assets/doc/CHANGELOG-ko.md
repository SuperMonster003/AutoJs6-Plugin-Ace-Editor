******

### 릴리스 기록

******

# v1.1.16

###### 2026/08/30

* `기능` AutoJs6 `4.4.0` PNG 양자화 결과 선언과 다시 생성한 main-app LSP 그룹을 포함: `images.quantize`는 인코딩 바이트, 크기, 실제 품질 및 양자화 오차를 반환하고, 명시한 품질 하한을 충족할 수 없으면 형식화된 `QualityTooLowException`을 공개

# v1.1.15

###### 2026/08/30

* `기능` AutoJs6 `4.3.0` PNG 양자화 옵션 선언과 다시 생성한 main-app/resource LSP 그룹을 포함: `Images.PngQuantizationOptions`는 팔레트 크기, 속도, 품질 범위, 디더링 및 posterize를 다루며 숫자 `quality` 호환성을 유지

# v1.1.14

###### 2026/08/29

* `기능` F2와 모바일 `이름 바꾸기`로 프로젝트 전체 TypeScript 심볼 이름 바꾸기를 추가했습니다: Ace는 정확한 프로젝트 스냅샷에서 제한된 여러 파일 편집을 생성해 AutoJs6 contract 5 승인을 요청하며, 미리보기, 충돌 검사, 원자적 게시, 롤백과 모든 디스크 쓰기는 전적으로 Host가 담당합니다
* `기능` Ctrl/Command+. 및 모바일 `빠른 수정` 작업으로 TypeScript auto-import와 spelling correction을 추가했습니다: Ace는 active buffer의 정렬된 edit로 수정 범위를 제한하고 AutoJs6 6.8.0 (5276)에 contract 4 승인을 요청한 뒤 승인된 결과를 한 번에 undo할 수 있는 변경으로 적용합니다
* `기능` TypeScript 교차 파일 intelligence가 이제 프로젝트 소스와 frozen dependency declaration의 completion, hover, signature help 및 정의 이동을 지원합니다; F12, Ctrl/Command-click 및 모바일 `정의로 이동` 작업은 AutoJs6 6.8.0 (5276)이 열기와 위치 지정 전에 독립적으로 검증하는 contract 3 대상을 전송합니다
* `기능` 호스트 기반 TypeScript 프로젝트 진단을 추가했습니다. Ace가 이제 완전하고 제한된 소스 snapshot을 검증해 불러오고 프로젝트 파일 간 import를 해석하며, 실행 전 컴파일과 동일하게 누락된 모듈을 강조 표시합니다. AutoJs6 6.8.0 (5276) 이상이 필요합니다
* `기능` TypeScript project type layer는 편집을 계속하기 전에 native addon 신호와 설치 lifecycle hook을 감지하고, host 및 compiler와 동일한 안정적 dependency-boundary 오류와 pure JavaScript/WASM 안내를 게시합니다
* `기능` Ace 의존성 타입 권한을 resolver policy revision 3과 동기화하고 lodash 4.17.21 및 `@types/lodash` 4.17.25 검증을 추가하여 런타임 패키지에 선언이 번들되지 않은 경우에도 Rhino와 Node 진단이 일치하도록 했습니다
* `기능` TypeScript compiler와 공유하는 frozen project dependency type layer를 추가함: Ace가 package `types`/`typings`, TypeScript 6 `typesVersions`, nested declaration 및 installed `@types`를 해석하며 Rhino/Node profile에서 dayjs completion, hover, strict diagnostic이 일치함
* `기능` AutoJs6 `4.2.0` R8 선언과 생성된 LSP 그룹을 내장: `ScriptRuntime.loadJarWithR8`의 6개 오버로드는 검증된 mapping/seeds/usage/retrace metadata 내보내기를 추가하고, `retraceR8Stack`은 프로토콜 1.1로 출처에 결합된 스택 복원을 수행하며 Provider 선택 실패 시 fallback하지 않음

# v1.1.13

###### 2026/08/26

* `기능` 최종 플러그인 전용 AutoJs6 `4.1.0` AI 선언을 번들: 선택자를 생략하면 공식 3-Stone AI 기본 대상을 사용하고, 모든 요청은 플러그인 `target` 라우팅과 표준 `timeout`만 허용하며, 호스트 측 직접 연결, 자격 증명 및 전환 이벤트 타입을 제거

# v1.1.12

###### 2026/08/26

* `기능` AutoJs6 통합 AI 대상 선언을 내장: `ai.catalog`, `target` 정확 라우팅, 로컬 및 온라인 대상, 완전한 응답·세션 메타데이터, reasoning 출력과 폴백 없는 안정 오류를 포함하며 공개되지 않은 이전 AI 카탈로그 API 및 호환 별칭을 모두 제거

# v1.1.11

###### 2026/08/25

* `기능` AutoJs6 선언 및 생성 LSP 그룹에 `ScriptRuntime.loadJarWithR8`의 명시적 오버로드 3개를 포함하고 keep rules, 순서 지정 classpath 및 consumer-rule ordinal 연결 지원

# v1.1.10

###### 2026/08/24

* `기능` Ace TypeScript 진단을 컴파일러 플러그인의 TypeScript 6.0.3 revision-2 Rhino/Node 프로필(ES2018, strict, CommonJS/Node10 또는 NodeNext)과 일치시키고, Node 프로젝트 라우팅 및 .mts/.cts 선언 파일 기본 지원을 추가하면서 정적 폴백을 유지

# v1.1.9

###### 2026/08/21

* `기능` `ai.ask`/`ai.chat`/`ai.stream` 및 영구 `ai.session`의 명시적 backend profile 타입 선언, `cpu`/`gpu`/`npu`, `ai.catalog` 기기 가용성, 안정적 사용 불가 사유 및 CPU fallback 금지 포함

# v1.1.8

###### 2026/08/21

* `기능` `ai.ask`/`ai.chat`/`ai.stream` 및 영구 `ai.session`의 네이티브 구조화 JSON 타입 선언. `structuredJson`, JSON 객체 `responseSchema`, 세션 고정 schema 포함

# v1.1.7

###### 2026/08/21

* `기능` `ai.session` 영구 온디바이스 대화 형식 선언을 추가하여 고정 세션 옵션, 턴마다 새 프롬프트 하나만 받는 `ask`/`chat`/`stream` 메서드, 수명 주기 상태 및 명시적 종료 의미를 지원

# v1.1.6

###### 2026/08/21

* `기능` AutoJs6 로컬 AI 플러그인 형식 선언을 보완하여 다중 역할 메시지 기록, 공식/서드파티 선택기, 생성 제어, 정확한 사용량 및 스트리밍 페이로드, `ai.catalog` 모델 검색을 지원

# v1.1.5

###### 2026/08/21

* `기능` AutoJs6 독립 YOLO 플러그인 객체 감지 형식 선언 동기화, 명시적 Provider 컴포넌트, 세션 및 감지 옵션, 감지 결과, 안정적인 오류 코드 포함

# v1.1.4

###### 2026/08/20

* `기능` AutoJs6 AI 플러그인의 `Ask`, `Chat`, `Stream` 형식 선언을 동기화하고 공식/서드파티 플러그인 선택, 로컬 생성 제어, 라우트 응답 및 스트리밍 이벤트 형식을 지원

# v1.1.1

###### 2026/07/28

* `수정` `App.CHROME` 및 대규모 `R.string.text_*` 리소스를 포함한 선택적 선언 그룹의 정적 멤버 자동 완성을 수정하고, Ace의 잘린 완성 후보 목록이 접두사 변경 시 디바운스 방식으로 새로 고쳐지도록 개선
* `수정` 일반적인 대용량 문서가 매우 긴 줄로 잘못 판정되어 일반 텍스트 모드로 전환되면서 JavaScript 구문 강조, 자동 완성 및 의미 서비스가 비활성화되는 문제를 수정. 실제로 매우 긴 단일 줄에는 계속 안전 모드를 적용
* `수정` Ace 시그니처/매개변수 힌트 버블이 항상 밝은 배경을 사용하는 문제를 수정하여 편집기 테마의 배경색과 전경색을 동적으로 반영. 테마 전환 시 이미 열려 있는 자동 완성 후보 팝업도 별도로 새로 고침
* `수정` 시스템 텍스트 선택 ActionMode를 편집기 자체의 팔레트 인식 선택 도구 모음으로 교체하여, 선택 작업, 눌림 상태 및 더보기 패널이 모든 Android 버전에서 현재 Ace 색상표를 따르도록 수정

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
