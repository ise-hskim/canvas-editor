export enum ListType {
  UL = 'ul',
  OL = 'ol'
}

export enum UlStyle {
  DISC = 'disc', // 진한 원형 불릿점
  CIRCLE = 'circle', // 빈 원형 불릿점
  SQUARE = 'square', // 진한 사각형 불릿점
  CHECKBOX = 'checkbox' // 체크박스
}

export enum OlStyle {
  DECIMAL = 'decimal' // 아라비아 숫자
}

export enum ListStyle {
  DISC = UlStyle.DISC,
  CIRCLE = UlStyle.CIRCLE,
  SQUARE = UlStyle.SQUARE,
  DECIMAL = OlStyle.DECIMAL,
  CHECKBOX = UlStyle.CHECKBOX
}
