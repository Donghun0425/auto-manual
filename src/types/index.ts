/**
 * 파일 트리 노드 타입 정의
 */
export interface FileTreeNode {
  /** 고유 식별자 (경로 기반) */
  id: string;
  /** 파일/폴더 이름 */
  name: string;
  /** 전체 경로 */
  path: string;
  /** 노드 타입 */
  type: 'file' | 'folder';
  /** 선택 여부 */
  checked: boolean;
  /** 하위 노드 (폴더인 경우) */
  children?: FileTreeNode[];
  /** 파일 내용 (.clx.js) */
  content?: string;
}

/**
 * 화면개요 정보
 */
export interface OverviewInfo {
  /** 시스템명 */
  systemName: string;
  /** 부시스템 */
  subSystem: string;
  /** 프로그램명 */
  programName: string;
  /** 설명 */
  description: string;
  /** 작성자 */
  author: string;
  /** 작성일자 */
  createDate: string;
}

/**
 * CRUD 기능 정보
 */
export interface CrudInfo {
  /** 조회 함수 존재 여부 */
  hasInquiry: boolean;
  /** 신규 함수 존재 여부 */
  hasNew: boolean;
  /** 저장 함수 존재 여부 */
  hasSave: boolean;
  /** 삭제 함수 존재 여부 */
  hasDelete: boolean;
  /** 추가 버튼 목록 */
  extButtons: ExtButtonInfo[];
  /** PatisTitleBar 타이틀 (titleBars 전용) */
  title?: string;
}

/**
 * 추가 버튼 정보
 */
export interface ExtButtonInfo {
  /** 버튼 명칭 */
  name: string;
  /** 함수명 */
  functionName: string;
  /** 버튼 번호 */
  index: number;
  /** 함수 바디 분석으로 생성된 다단계 설명 (개행 구분) */
  description?: string;
}

/**
 * 필수값 정보
 */
export interface RequiredFieldInfo {
  /** 대상 데이터셋/그리드 ID */
  targetId: string;
  /** 컬럼명 배열 */
  columns: string[];
  /** 표시 텍스트 배열 */
  texts: string[];
}

/**
 * 팝업 정보
 */
export interface PopupInfo {
  /** 팝업 ID */
  popupId: string;
  /** 팝업 URL */
  popupUrl: string;
  /** 콜백 함수명 */
  callbackFunction: string;
  /** 팝업 너비 */
  width: number;
  /** 팝업 높이 */
  height: number;
}

/**
 * 탭페이지(임베디드 앱) 정보
 */
export interface TabPageInfo {
  /** 앱 URI (PatisUtils.loadEmbApp 방식) */
  appUri: string;
  /** 호출 위치(함수명) */
  calledFrom: string;
  /** 탭 레이블 (TabItem.text 기반 직접 선언 방식에서 추출) */
  tabLabel?: string;
}

/**
 * 그리드 컬럼 정보
 */
export interface GridColumnInfo {
  /** 바인딩 컬럼명 */
  columnName: string;
  /** 헤더 표시명 (항목명) */
  headerText: string;
  /** 상세 설명 */
  description: string;
  /** 컨트롤 타입 (Output, InputBox, ComboBox 등) */
  controlType: string;
  /** 용도 */
  purpose: '표시' | '입력' | '표시 또는 입력';
}

/**
 * 그리드 정보
 */
export interface GridInfo {
  /** 그리드 ID */
  gridId: string;
  /** 그리드 타이틀 (PatisTitleBar.title) */
  title: string;
  /** PatisTitleBar에 바인딩 여부 */
  isBound: boolean;
  /** 체크박스 컬럼 여부 */
  hasCheckbox: boolean;
  /** 행번호 컬럼 여부 */
  hasRowNumber: boolean;
  /** 상태 컬럼 여부 */
  hasState: boolean;
  /** 정렬 가능 여부 */
  sortable: boolean;
  /** 그리드 컬럼 목록 */
  columns: GridColumnInfo[];
  /** true이면 AI 컬럼 설명 생성 건너뜀 (고정 설명이 이미 있는 경우) */
  skipAiDescriptions?: boolean;
}

/**
 * 검증 로직(Alert 메시지) 정보
 */
export interface ValidationInfo {
  /** 함수명 */
  functionName: string;
  /** Alert 메시지 */
  message: string;
}

/**
 * 조회조건/처리조건 영역 내 개별 컨트롤 정보
 */
export interface ConditionControlInfo {
  /** 컨트롤 ID */
  controlId: string;
  /** 라벨 텍스트 */
  labelText: string;
  /** AI 생성 설명 */
  description: string;
  /** 컨트롤 타입 (InputBox, ComboBox 등) */
  controlType: string;
  /** 입력 가능 여부 */
  inputType: '입력' | '표시';
}

/**
 * 조회조건 또는 처리조건 그룹 정보
 */
export interface ConditionGroupInfo {
  /** 그룹 ID (SEARCHGROUP01, CONDITIONGROUP01 등) */
  groupId: string;
  /** 그룹 종류 */
  groupType: '조회조건' | '처리조건' | '일괄처리';
  /** 그룹 타이틀 (PatisTitleBar.title 등) */
  title?: string;
  /** 컨트롤 목록 */
  controls: ConditionControlInfo[];
}


export interface AnalysisResult {
  /** 분석 대상 파일 경로 */
  filePath: string;
  /** 화면 개요 */
  overview: OverviewInfo;
  /** 사용 방법 */
  usage: {
    /** PatisMenuTitleBar CRUD 정보 */
    menuTitleBar: CrudInfo;
    /** PatisTitleBar CRUD 정보 (복수 가능) */
    titleBars: CrudInfo[];
    /** 기타 버튼 */
    extraButtons: ExtButtonInfo[];
  };
  /** AI 생성 사용방법 텍스트 (사용방법 섹션 전체를 대체) */
  aiUsageText?: string;
  /** AI 생성 참고사항 설명 (그룹 라벨 → 친화적 설명 배열) */
  aiNotesDescriptions?: Map<string, string[]>;
  /** 화면 이미지 데이터 URL (base64) */
  screenImageDataUrl?: string;
  /** 참고사항 */
  notes: {
    /** 필수값 정보 목록 */
    requiredFields: RequiredFieldInfo[];
    /** 검증 로직 (alert 메시지) 목록 */
    validations: ValidationInfo[];
  };
  /** 항목 정보 */
  items: {
    /** 조회조건/처리조건 그룹 목록 */
    conditionGroups: ConditionGroupInfo[];
    /** 그리드 목록 */
    grids: GridInfo[];
  };
  /** 탭 페이지 목록 */
  tabPages: TabPageInfo[];
  /** 팝업 목록 */
  popups: PopupInfo[];
}

/**
 * 매뉴얼 생성 결과
 */
export interface ManualOutput {
  /** 대상 파일 경로 */
  filePath: string;
  /** HTML 형식 매뉴얼 */
  html: string;
  /** Markdown 형식 매뉴얼 */
  markdown: string;
}
