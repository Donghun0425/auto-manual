# 프로젝트 계획서: exBuilder6 사용자 매뉴얼 자동 생성기

## 1. 프로젝트 개요

exBuilder6 프레임워크 기반 프로젝트의 `.clx.js` 파일을 분석하여 일반 사용자 매뉴얼을 자동으로 생성하는 웹 애플리케이션.

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend Framework | React 18 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Build Tool | Vite |
| 파일 파싱 | 자체 Parser (정규식 + AST 분석) |
| AI 연동 | GitHub Models API + VS Code Extension API |
| 파일 다운로드 | html 생성 / markdown 생성 |

---

## 3. 페이지 구조 및 라우팅

```
/ (메인)
├── 파일 업로드 영역
├── 파일 트리 표시 영역
├── 매뉴얼 생성 제어 영역
│
└── /result (분석결과/생성매뉴얼)
    ├── [탭1] 분석결과 페이지
    └── [탭2] 생성매뉴얼 미리보기 페이지
```

---

## 4. 주요 기능 상세

### 4.1 파일 업로드
- **단일 파일 업로드**: input[type=file] accept=".clx.js"
- **멀티 파일 업로드**: multiple 속성 활용
- **폴더 업로드**: webkitdirectory 속성 활용 (폴더 내 .clx.js 파일 자동 필터링)
- 업로드된 파일은 브라우저 메모리(상태)에서 처리 (서버 불필요)

### 4.2 파일 트리 표시
- 상위 폴더 경로 포함한 트리구조 표시
- 체크박스 기능:
  - 전체 선택 / 전체 해제
  - 폴더(경로) 단위 선택/해제 (하위 파일 연동)
  - 단건 파일 선택/해제
- shadcn/ui의 Checkbox, Collapsible 컴포넌트 활용

### 4.3 .clx.js 파일 파싱 엔진

#### 추출 대상 패턴 (샘플 분석 기반)

| 섹션 | 추출 패턴 | 추출 방식 |
|------|-----------|-----------|
| **화면개요** | 파일 상단 주석 블록 (`// [시스템명]`, `// [부시스템]`, `// [프로그램]`, `// [설명]`) | 정규식 |
| **사용방법 - PatisMenuTitleBar** | `Form_inq~`, `Form_new~`, `Form_save~`, `Form_del~`, `Form_ext~` 함수 존재 여부 및 주석 | 정규식 + 함수명 패턴 매칭 |
| **사용방법 - PatisTitleBar** | `TitleForm_inq~`, `TitleForm_new~`, `TitleForm_save~`, `TitleForm_del~`, `TitleForm_ext~` 함수 존재 여부 및 주석 | 정규식 + 함수명 패턴 매칭 |
| **사용방법 - 추가버튼** | `Form_ext1Click`, `Form_ext2Click` 등 + `initAddButton` 호출부 분석 | 정규식 |
| **사용방법 - 기타 버튼** | 화면 내 버튼 이벤트 핸들러 (`_onclick`, `click` 이벤트) | 정규식 |
| **참고사항 - 필수값** | `requiredColumn`, `requiredText` 배열 | 정규식으로 배열 값 추출 |
| **참고사항 - 전처리 로직** | `Click` 전처리 함수 내 validation 로직 (alert 메시지 추출) | 정규식 |
| **항목 - 그리드** | `PatisTitleBar.initBindObject(app.lookup("DG_GRID~"))` + `PatisGrid.initCreate` | 정규식 |
| **항목 - INFOGROUP** | `cl-form-group` 클래스를 가진 GROUP | 정규식 / UI 정의부 분석 |
| **탭페이지** | `PatisUtils.loadEmbApp` 호출부 | 정규식 |
| **팝업** | `PatisUtils.openPopup` 호출부 (popupId, popupUrl 추출) | 정규식 |

#### 파서 모듈 구조

```
src/parser/
├── index.ts              # 메인 파서 진입점
├── headerParser.ts       # 상단 주석 파싱 (화면개요)
├── functionParser.ts     # 함수 정의 및 패턴 매칭
├── crudParser.ts         # CRUD 패턴 분석 (Form_inq, Form_new 등)
├── titleBarParser.ts     # TitleForm 패턴 분석
├── gridParser.ts         # 그리드 관련 정보 추출
├── infoGroupParser.ts    # INFOGROUP 관련 정보 추출
├── popupParser.ts        # openPopup 호출 분석
├── embAppParser.ts       # loadEmbApp 호출 분석 (탭페이지)
├── validationParser.ts   # 필수값, 전처리 로직 분석
└── types.ts              # 공통 타입 정의
```

### 4.4 분석결과 페이지

탭1에 표시되는 분석 결과 구조:

```
[분석결과]
├── 화면개요
│   └── 시스템명, 부시스템, 프로그램명, 설명
├── 사용방법
│   ├── PatisMenuTitleBar 기능 (조회/신규/저장/삭제/추가버튼)
│   ├── PatisTitleBar 기능 (조회/신규/저장/삭제/추가버튼)
│   └── 기타 버튼 기능
├── 참고사항
│   ├── 조회 시 필수값
│   ├── 저장 시 필수값
│   └── 전처리 로직 (alert 메시지 기반)
├── 항목
│   ├── 그리드 항목 (PatisTitleBar bindObject 대상)
│   └── INFOGROUP 항목 (cl-form-group 클래스)
├── 탭페이지
│   └── loadEmbApp 대상 페이지 목록
└── 팝업
    └── openPopup 대상 페이지 목록
```

### 4.5 매뉴얼 생성 페이지

- 탭2에서 생성된 매뉴얼 미리보기
- HTML 렌더링 미리보기 + 원본 코드 토글
- 다운로드 옵션: HTML 파일 / Markdown 파일

### 4.6 AI 활용 기능

- **선택적 AI 활용**: 매뉴얼 생성 시 AI 사용 여부 토글 스위치
- **GitHub Models API 연동**:
  - 화면개요 자연어 생성 (주석 기반 3줄 설명)
  - 사용방법 Step별 자연어 설명 생성
  - 참고사항 자연어 요약
- **VS Code Extension 연동**:
  - VS Code 내에서 실행 시 Copilot API 활용 가능
  - 확장 프로그램으로 패키징하여 IDE 내 직접 사용 가능

---

## 5. 컴포넌트 구조

```
src/
├── app/
│   ├── App.tsx
│   └── routes.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── MainLayout.tsx
│   ├── upload/
│   │   ├── FileUploader.tsx        # 파일/폴더 업로드 컴포넌트
│   │   └── UploadActions.tsx       # 업로드 방식 선택 버튼
│   ├── tree/
│   │   ├── FileTree.tsx            # 파일 트리 메인 컴포넌트
│   │   ├── TreeNode.tsx            # 트리 노드 (폴더/파일)
│   │   └── TreeControls.tsx        # 전체선택/해제 컨트롤
│   ├── analysis/
│   │   ├── AnalysisResult.tsx      # 분석결과 탭 메인
│   │   ├── OverviewSection.tsx     # 화면개요 섹션
│   │   ├── UsageSection.tsx        # 사용방법 섹션
│   │   ├── NotesSection.tsx        # 참고사항 섹션
│   │   ├── ItemsSection.tsx        # 항목 섹션
│   │   ├── TabPagesSection.tsx     # 탭페이지 섹션
│   │   └── PopupSection.tsx        # 팝업 섹션
│   ├── manual/
│   │   ├── ManualPreview.tsx       # 매뉴얼 미리보기
│   │   ├── ManualHtml.tsx          # HTML 형식 렌더링
│   │   └── ManualMarkdown.tsx      # Markdown 형식 렌더링
│   └── ai/
│       ├── AiToggle.tsx            # AI 사용 여부 토글
│       └── AiProvider.tsx          # AI API 연동 프로바이더
├── parser/
│   └── (위 파서 모듈 구조 참조)
├── generators/
│   ├── htmlGenerator.ts            # HTML 매뉴얼 생성기
│   └── markdownGenerator.ts        # Markdown 매뉴얼 생성기
├── services/
│   ├── aiService.ts                # GitHub Models API 호출
│   └── fileService.ts              # 파일 읽기/다운로드
├── stores/
│   ├── fileStore.ts                # 파일 상태 관리 (zustand)
│   ├── analysisStore.ts            # 분석 결과 상태 관리
│   └── manualStore.ts              # 매뉴얼 생성 상태 관리
├── types/
│   └── index.ts                    # 전역 타입 정의
└── utils/
    └── treeUtils.ts                # 트리 구조 유틸리티
```

---

## 6. UI 와이어프레임

### 메인 페이지 (업로드 & 파일선택)

```
┌─────────────────────────────────────────────────────────────┐
│  [Header] exBuilder6 매뉴얼 생성기            [매뉴얼초기화] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─── 파일 업로드 ─────────────────────────────────────┐   │
│  │  [단일파일] [멀티파일] [폴더업로드]                    │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │   드래그 앤 드롭 또는 클릭하여 업로드        │    │   │
│  │  │          (.clx.js 파일만 허용)               │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── 파일 목록 ───────────────────────────────────────┐   │
│  │  [✓ 전체선택] [✗ 전체해제]                           │   │
│  │  ▼ □ univ/                                          │   │
│  │    ▼ □ grdtn/                                       │   │
│  │      ▼ □ ugr01/                                     │   │
│  │          ☑ ugr_3060101_u.clx.js                     │   │
│  │          ☑ ugr_3060102_u.clx.js                     │   │
│  │      ▶ □ ugr02/                                     │   │
│  │    ▶ □ lessn/                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── 매뉴얼 생성 옵션 ───────────────────────────────┐   │
│  │  AI 활용: [○ ON / ● OFF]                            │   │
│  │  AI 모델: [GitHub Models ▼]                         │   │
│  │                                                      │   │
│  │           [ 📄 매뉴얼 생성 ]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 결과 페이지 (분석결과 & 매뉴얼 미리보기)

```
┌─────────────────────────────────────────────────────────────┐
│  [Header] exBuilder6 매뉴얼 생성기            [매뉴얼초기화] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┬───────────────┐                            │
│  │ [분석결과]  │ [생성매뉴얼]  │                            │
│  └─────────────┴───────────────┘                            │
│                                                             │
│  ──── 분석결과 탭 활성 시 ────                              │
│  ┌─ 화면개요 ──────────────────────────────────────────┐   │
│  │ 시스템: 학사 | 부시스템: 졸업                         │   │
│  │ 프로그램: 졸업기초 > 졸업기준관리                      │   │
│  │ 설명: 졸업기준을 관리하는 화면입니다.                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─ 사용방법 ──────────────────────────────────────────┐   │
│  │ [PatisMenuTitleBar]                                  │   │
│  │  - 조회: Form_inqAction (입학년도 필수)               │   │
│  │  - 신규: Form_newAction (입학년도 필수)               │   │
│  │  - 저장: Form_saveAction                             │   │
│  │  - 삭제: Form_delAction                              │   │
│  │  - 추가버튼1: Form_ext1Click (년도복사)              │   │
│  │ [PatisTitleBar]                                      │   │
│  │  - 신규: TitleForm_newAction                         │   │
│  │  - 저장: TitleForm_saveAction                        │   │
│  │  - 삭제: TitleForm_delAction                         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─ 참고사항 ──────────────────────────────────────────┐   │
│  │  필수값: 입학년도, 학과, 학제, 총이수학점 ...         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─ 항목 ─────────────────────────────────────────────┐   │
│  │  그리드: DG_GRID01, DG_GRID02                        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─ 팝업 ─────────────────────────────────────────────┐   │
│  │  - UcoYrCopyPopup (univ/formlib/UcoYrCopyPopup)      │   │
│  │  - UcoDeptPopup (univ/formlib/UcoDeptPopup)          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [HTML 다운로드]  [MD 다운로드]  [← 파일목록으로]    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. .clx.js 파싱 전략 상세

### 7.1 화면개요 추출

```javascript
// 정규식 패턴
/\/\/\s*\[시스템명\]\s*(.+)/
/\/\/\s*\[부시스템\]\s*(.+)/
/\/\/\s*\[프로그램\]\s*(.+)/
/\/\/\s*\[설명\]\s*(.+)/
```

### 7.2 CRUD 함수 감지

```javascript
// PatisMenuTitleBar 기능
/function\s+Form_inq(\w+)\s*\(/       // 조회
/function\s+Form_new(\w+)\s*\(/       // 신규
/function\s+Form_save(\w+)\s*\(/      // 저장
/function\s+Form_del(\w+)\s*\(/       // 삭제
/function\s+Form_ext(\d+)Click\s*\(/  // 추가버튼

// PatisTitleBar 기능
/function\s+TitleForm_inq(\w+)\s*\(/  // 조회
/function\s+TitleForm_new(\w+)\s*\(/  // 신규
/function\s+TitleForm_save(\w+)\s*\(/ // 저장
/function\s+TitleForm_del(\w+)\s*\(/  // 삭제
/function\s+TitleForm_ext(\d+)Click\s*\(/ // 추가버튼
```

### 7.3 필수값 추출

```javascript
// requiredColumn + requiredText 매칭
/PatisUtils\.setAppProperty\(app,\s*app\.lookup\("([^"]+)"\),\s*"requiredColumn",\s*new Array\(([^)]+)\)\)/
/PatisUtils\.setAppProperty\(app,\s*app\.lookup\("([^"]+)"\),\s*"requiredText",\s*new Array\(([^)]+)\)\)/
```

### 7.4 팝업 추출

```javascript
/PatisUtils\.openPopup\(\s*"([^"]+)",\s*[^,]+,\s*"([^"]+)",\s*"([^"]+)",\s*(\d+),\s*(\d+)/
// 그룹: popupId, popupUrl, popupCallback, width, height
```

### 7.5 임베디드 앱(탭페이지) 추출

```javascript
/PatisUtils\.loadEmbApp\([^,]*,\s*"([^"]+)"/
// 그룹: 로드되는 앱 URI
```

### 7.6 그리드 정보 추출

```javascript
/initBindObject\(app\.lookup\("([^"]+)"\)\)/  // PatisTitleBar에 바인딩된 그리드
/PatisGrid\.initCreate\(app\.lookup\("([^"]+)"\)\)/  // 초기화된 그리드 목록
```

### 7.7 Alert 메시지 추출 (참고사항용)

```javascript
/alert\("([^"]+)"\)/g
// 사용자에게 표시되는 안내/경고 메시지 수집
```

---

## 8. AI 연동 설계

### 8.1 GitHub Models API

```typescript
interface AiRequest {
  model: string;           // "gpt-4o" | "gpt-4o-mini" 등
  messages: Message[];
  temperature: number;
}

// 프롬프트 템플릿 예시
const OVERVIEW_PROMPT = `
다음은 exBuilder6 프레임워크로 작성된 화면의 메타정보입니다.
시스템명: {systemName}
부시스템: {subSystem}
프로그램: {programName}
설명: {description}

위 정보를 바탕으로 일반 사용자가 이해할 수 있는 화면 개요를 3줄 이내로 작성해주세요.
`;

const USAGE_PROMPT = `
다음은 화면의 기능 목록입니다:
{functionList}

각 기능에 대해 Step별로 사용방법을 작성해주세요.
작성 형식: {B}기능명{/B}\nStep1. 설명\nStep2. 설명...
`;
```

### 8.2 VS Code Extension 연동

- VS Code 내에서 실행 시 `vscode.lm` API를 통해 Copilot 모델 접근
- Extension 활성 시 자동 감지하여 AI 옵션에 "VS Code Copilot" 추가

---

## 9. 개발 단계 (Phase)

### Phase 1: 프로젝트 셋업 & 기본 UI (1단계)
- [x] Vite + React + TypeScript 프로젝트 초기화
- [x] Tailwind CSS v4 + shadcn/ui 설정
- [x] 기본 레이아웃 및 라우팅 구성
- [x] 파일 업로드 컴포넌트 구현

### Phase 2: 파일 트리 & 선택 (2단계)
- [ ] 업로드된 파일의 트리구조 변환 로직
- [ ] 트리 UI 컴포넌트 구현 (체크박스, 폴더 접기/펼치기)
- [ ] 전체선택/해제, 폴더단위 선택 기능

### Phase 3: 파서 엔진 개발 (3단계)
- [ ] 화면개요 파서 (헤더 주석 분석)
- [ ] CRUD 함수 패턴 파서
- [ ] 필수값/참고사항 파서
- [ ] 그리드/INFOGROUP 파서
- [ ] 팝업/탭페이지 파서

### Phase 4: 분석결과 페이지 (4단계)
- [ ] 분석결과 탭 UI 구현
- [ ] 섹션별 결과 표시 컴포넌트

### Phase 5: 매뉴얼 생성 & 미리보기 (5단계)
- [ ] HTML 매뉴얼 생성기
- [ ] Markdown 매뉴얼 생성기
- [ ] 미리보기 기능 (생성매뉴얼 탭)
- [ ] 다운로드 기능 (HTML/MD)

### Phase 6: AI 연동 (6단계)
- [ ] GitHub Models API 연동
- [ ] AI 토글 & 프롬프트 설계
- [ ] VS Code Extension 연동 (선택)

### Phase 7: 마무리 (7단계)
- [ ] 매뉴얼 초기화 기능
- [ ] UI/UX 최적화
- [ ] 에러 처리 및 로딩 상태
- [ ] 테스트 및 검증 (샘플 프로젝트 기반)

---

## 10. 핵심 데이터 모델

```typescript
// 파일 트리 노드
interface FileTreeNode {
  id: string;
  name: string;
  path: string;           // 전체 경로
  type: 'file' | 'folder';
  checked: boolean;
  children?: FileTreeNode[];
  content?: string;        // .clx.js 파일 내용
}

// 분석 결과
interface AnalysisResult {
  filePath: string;
  overview: {
    systemName: string;
    subSystem: string;
    programName: string;
    description: string;
  };
  usage: {
    menuTitleBar: CrudInfo;      // PatisMenuTitleBar CRUD
    titleBars: TitleBarInfo[];   // PatisTitleBar CRUD (복수 가능)
    extraButtons: ButtonInfo[];  // 기타 버튼
  };
  notes: {
    requiredFields: RequiredFieldInfo[];
    validations: string[];       // alert 메시지 기반
  };
  items: {
    grids: GridInfo[];
    infoGroups: InfoGroupInfo[];
  };
  tabPages: TabPageInfo[];
  popups: PopupInfo[];
}

// CRUD 정보
interface CrudInfo {
  hasInquiry: boolean;
  hasNew: boolean;
  hasSave: boolean;
  hasDelete: boolean;
  extButtons: { name: string; functionName: string }[];
}

// 팝업 정보
interface PopupInfo {
  popupId: string;
  popupUrl: string;
  callbackFunction: string;
  width: number;
  height: number;
}
```

---

## 11. 코딩 컨벤션

- **한국어 주석 필수**: 모든 함수, 컴포넌트, 모듈, 주요 로직에 한국어 주석을 반드시 작성한다.
  - 함수: 함수 상단에 기능 설명, 매개변수, 반환값 주석
  - 컴포넌트: 컴포넌트 상단에 용도 및 Props 설명 주석
  - 복잡한 로직: 인라인 한국어 주석으로 흐름 설명
  - 파일: 파일 최상단에 모듈 목적 주석

```typescript
/**
 * 파일 트리 노드 컴포넌트
 * - 폴더/파일을 재귀적으로 렌더링
 * - 체크박스 선택 시 하위 노드 연동
 * @param node - 트리 노드 데이터
 * @param onCheck - 체크 상태 변경 콜백
 */
export function TreeNode({ node, onCheck }: TreeNodeProps) {
  // 하위 노드 전체 선택/해제 처리
  const handleCheck = () => { ... };
}
```

---

## 12. 참고사항

- **레퍼런스**: https://edu.tomatosystem.co.kr/ (exBuilder6 공식 교육 포털)
- **샘플 프로젝트**: `D:\workspace_pkg2_term (2)\workspace_pkg2_term\exbuilder\clx-build\` 디렉토리의 `.clx.js` 파일
- **파일 처리**: 모든 파일 처리는 클라이언트 사이드에서 수행 (FileReader API)
- **AI API Key**: GitHub Models API 키는 사용자가 설정 페이지에서 입력하도록 처리 (localStorage 저장)
