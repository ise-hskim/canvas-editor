export enum EditorComponent {
  COMPONENT = 'component',
  MENU = 'menu',
  MAIN = 'main',
  FOOTER = 'footer',
  CONTEXTMENU = 'contextmenu',
  POPUP = 'popup',
  CATALOG = 'catalog',
  COMMENT = 'comment'
}

export enum EditorContext {
  PAGE = 'page',
  TABLE = 'table'
}

export enum EditorMode {
  EDIT = 'edit', // 편집 모드 (문서 편집 가능, 보조 요소 모두 존재)
  CLEAN = 'clean', // 깨끗한 모드 (보조 요소 숨김)
  READONLY = 'readonly', // 읽기 전용 모드 (문서 편집 불가)
  FORM = 'form', // 폼 모드 (컨트롤 내부만 편집 가능)
  PRINT = 'print', // 인쇄 모드 (문서 편집 불가, 보조 요소, 선택 영역, 비어있는 컨트롤 및 테두리 숨김)
  DESIGN = 'design' // 디자인 모드 (삭제 불가, 읽기 전용 등 설정 제어 없음)
}

export enum EditorZone {
  HEADER = 'header',
  MAIN = 'main',
  FOOTER = 'footer'
}

export enum PageMode {
  PAGING = 'paging',
  CONTINUITY = 'continuity'
}

export enum PaperDirection {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal'
}

export enum WordBreak {
  BREAK_ALL = 'break-all',
  BREAK_WORD = 'break-word'
}

export enum RenderMode {
  SPEED = 'speed',
  COMPATIBILITY = 'compatibility'
}
