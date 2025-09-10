export enum ControlType {
  TEXT = 'text',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  DATE = 'date',
  NUMBER = 'number'
}

export enum ControlComponent {
  PREFIX = 'prefix',
  POSTFIX = 'postfix',
  PRE_TEXT = 'preText',
  POST_TEXT = 'postText',
  PLACEHOLDER = 'placeholder',
  VALUE = 'value',
  CHECKBOX = 'checkbox',
  RADIO = 'radio'
}

// 컨트롤 콘텐츠 들여쓰기 방식
export enum ControlIndentation {
  ROW_START = 'rowStart', // 행 시작 위치에서 들여쓰기
  VALUE_START = 'valueStart' // 값 시작 위치에서 들여쓰기
}

// 컨트롤 상태
export enum ControlState {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}
