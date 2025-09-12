/**
 * 스타일 변환 유틸리티 함수
 */

import { IElement } from '../../../editor/interface/Element'
import { RowFlex } from '../../../editor/dataset/enum/Row'
import { fontMapping } from '../mappings'

/**
 * HWPX 색상을 CSS 색상으로 변환
 */
export function convertColor(hwpxColor: string | number): string {
  if (typeof hwpxColor === 'string') {
    // 이미 CSS 색상 형식인 경우
    if (hwpxColor.startsWith('#')) {
      return hwpxColor
    }
    
    // 색상 이름인 경우
    const colorMap: Record<string, string> = {
      'black': '#000000',
      'white': '#ffffff',
      'red': '#ff0000',
      'green': '#00ff00',
      'blue': '#0000ff',
      'yellow': '#ffff00',
      'cyan': '#00ffff',
      'magenta': '#ff00ff',
      'gray': '#808080',
      'grey': '#808080'
    }
    
    const lowerColor = hwpxColor.toLowerCase()
    if (colorMap[lowerColor]) {
      return colorMap[lowerColor]
    }
    
    // 숫자 문자열인 경우
    const num = parseInt(hwpxColor)
    if (!isNaN(num)) {
      return convertBGRToRGB(num)
    }
  }
  
  // 숫자인 경우 (BGR 형식)
  if (typeof hwpxColor === 'number') {
    return convertBGRToRGB(hwpxColor)
  }
  
  return '#000000' // 기본값
}

/**
 * BGR 색상값을 RGB로 변환
 */
function convertBGRToRGB(bgr: number): string {
  const b = (bgr >> 16) & 0xFF
  const g = (bgr >> 8) & 0xFF
  const r = bgr & 0xFF
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * HWPX 크기 단위를 픽셀로 변환
 */
export function convertSize(size: string | number, unit?: string): number {
  if (typeof size === 'number') {
    // HWPUNIT (1/7200 인치) -> 픽셀
    if (!unit || unit === 'hwpunit') {
      return Math.round(size * 96 / 7200)
    }
    return size
  }
  
  const value = parseFloat(size)
  if (isNaN(value)) return 16 // 기본값
  
  // 단위 추출
  const match = size.match(/([0-9.]+)([a-z%]+)?/i)
  if (!match) return value
  
  const unitStr = match[2] || unit || 'pt'
  
  switch (unitStr.toLowerCase()) {
    case 'pt':
      return Math.round(value * 96 / 72)
    case 'px':
      return Math.round(value)
    case 'mm':
      return Math.round(value * 96 / 25.4)
    case 'cm':
      return Math.round(value * 96 / 2.54)
    case 'in':
      return Math.round(value * 96)
    case '%':
      return Math.round(value * 16 / 100) // 기본 폰트 크기 대비
    case 'hwpunit':
      return Math.round(value * 96 / 7200)
    default:
      return Math.round(value)
  }
}

/**
 * HWPX 폰트를 웹 폰트로 변환
 */
export function convertFont(hwpxFont: string): string {
  // 매핑 테이블에서 찾기
  if (fontMapping[hwpxFont]) {
    return fontMapping[hwpxFont]
  }
  
  // 폰트명에 한글이 포함된 경우
  if (/[가-힣]/.test(hwpxFont)) {
    // 바탕체 계열
    if (hwpxFont.includes('바탕') || hwpxFont.includes('명조')) {
      return 'serif'
    }
    // 돋움체 계열
    if (hwpxFont.includes('돋움') || hwpxFont.includes('고딕')) {
      return 'sans-serif'
    }
    // 굴림체 계열
    if (hwpxFont.includes('굴림')) {
      return 'sans-serif'
    }
  }
  
  // 영문 폰트 처리
  const lowerFont = hwpxFont.toLowerCase()
  if (lowerFont.includes('serif')) {
    return 'serif'
  }
  if (lowerFont.includes('sans')) {
    return 'sans-serif'
  }
  if (lowerFont.includes('mono') || lowerFont.includes('courier')) {
    return 'monospace'
  }
  
  // 그대로 반환
  return hwpxFont
}

/**
 * HWPX 정렬을 Canvas Editor RowFlex로 변환
 */
export function convertAlignment(align: string): RowFlex {
  switch (align.toLowerCase()) {
    case 'left':
    case 'start':
      return RowFlex.LEFT
    case 'center':
    case 'middle':
      return RowFlex.CENTER
    case 'right':
    case 'end':
      return RowFlex.RIGHT
    case 'justify':
    case 'both':
    case 'distribute':
      return RowFlex.ALIGNMENT
    default:
      return RowFlex.LEFT
  }
}

/**
 * HWPX 줄 간격을 픽셀로 변환
 */
export function convertLineSpacing(spacing: string | number): number {
  if (typeof spacing === 'number') {
    // HWPX는 1000 = 100%
    return Math.round(spacing * 20 / 1000)
  }
  
  const value = parseFloat(spacing)
  if (isNaN(value)) return 5 // 기본값
  
  // 퍼센트 값인 경우
  if (spacing.includes('%')) {
    return Math.round(value * 20 / 100)
  }
  
  // pt 값인 경우
  if (spacing.includes('pt')) {
    return Math.round(value * 96 / 72)
  }
  
  return Math.round(value)
}

/**
 * HWPX 스타일 속성을 Canvas Editor 스타일로 변환
 */
export function convertStyles(hwpxStyles: Record<string, any>): Partial<IElement> {
  const styles: Partial<IElement> = {}
  
  // 폰트
  if (hwpxStyles.fontRef || hwpxStyles.fontFamily) {
    styles.font = convertFont(hwpxStyles.fontRef || hwpxStyles.fontFamily)
  }
  
  // 크기
  if (hwpxStyles.fontSize) {
    styles.size = convertSize(hwpxStyles.fontSize)
  }
  
  // 굵게
  if (hwpxStyles.bold === '1' || hwpxStyles.bold === true || hwpxStyles.bold === 'true') {
    styles.bold = true
  }
  
  // 기울임
  if (hwpxStyles.italic === '1' || hwpxStyles.italic === true || hwpxStyles.italic === 'true') {
    styles.italic = true
  }
  
  // 밑줄
  if (hwpxStyles.underline && hwpxStyles.underline !== '0' && hwpxStyles.underline !== 'false') {
    styles.underline = true
  }
  
  // 취소선
  if (hwpxStyles.strikeout && hwpxStyles.strikeout !== '0' && hwpxStyles.strikeout !== 'false') {
    styles.strikeout = true
  }
  
  // 색상
  if (hwpxStyles.textColor || hwpxStyles.color) {
    styles.color = convertColor(hwpxStyles.textColor || hwpxStyles.color)
  }
  
  // 배경색
  if (hwpxStyles.backgroundColor || hwpxStyles.highlight) {
    styles.highlight = convertColor(hwpxStyles.backgroundColor || hwpxStyles.highlight)
  }
  
  // 정렬
  if (hwpxStyles.align || hwpxStyles.textAlign) {
    styles.rowFlex = convertAlignment(hwpxStyles.align || hwpxStyles.textAlign)
  }
  
  // 줄 간격
  if (hwpxStyles.lineSpacing) {
    styles.rowMargin = convertLineSpacing(hwpxStyles.lineSpacing)
  }
  
  // 자간
  if (hwpxStyles.letterSpacing || hwpxStyles.charSpacing) {
    styles.letterSpacing = convertSize(hwpxStyles.letterSpacing || hwpxStyles.charSpacing)
  }
  
  return styles
}

/**
 * 스타일 병합 (나중 스타일이 우선)
 */
export function mergeStyles(...styles: Partial<IElement>[]): Partial<IElement> {
  return Object.assign({}, ...styles)
}

/**
 * 스타일 상속 처리
 */
export function inheritStyles(
  parentStyle: Partial<IElement>,
  childStyle: Partial<IElement>
): Partial<IElement> {
  // 상속 가능한 속성들
  const inheritableProps = [
    'font', 'size', 'color', 'letterSpacing', 'rowFlex', 'rowMargin'
  ]
  
  const inherited: Partial<IElement> = {}
  
  for (const prop of inheritableProps) {
    if (parentStyle[prop as keyof IElement] !== undefined) {
      inherited[prop as keyof IElement] = parentStyle[prop as keyof IElement] as any
    }
  }
  
  // 자식 스타일로 덮어쓰기
  return mergeStyles(inherited, childStyle)
}