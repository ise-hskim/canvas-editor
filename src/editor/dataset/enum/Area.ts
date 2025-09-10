export enum AreaMode {
  EDIT = 'edit', // 편집 모드 (문서 편집 가능, 보조 요소 모두 존재)
  READONLY = 'readonly', // 읽기 전용 모드 (문서 편집 불가)
  FORM = 'form' // 폼 모드 (컨트롤 내부만 편집 가능)
}
