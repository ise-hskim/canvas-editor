/**
 * HWPX to Canvas Editor 매핑 테이블
 * HWPX의 스타일과 속성을 Canvas Editor 형식으로 매핑
 */

import { IStyleMapping } from './types'
import { RowFlex } from '../../editor/dataset/enum/Row'
import { ListStyle } from '../../editor/dataset/enum/List'
import { TitleLevel } from '../../editor/dataset/enum/Title'
import { ElementType } from '../../editor/dataset/enum/Element'

/**
 * 기본 스타일 매핑 테이블
 */
export const DEFAULT_STYLE_MAPPING: IStyleMapping = {
  // 폰트 매핑 (HWPX 폰트명 → Canvas Editor 폰트명)
  // HWPX에서 자주 사용되는 한글 폰트들을 웹 폰트로 매핑
  fontMap: {
    // 한컴 기본 폰트
    '함초롬바탕': '바탕',
    '함초롬바탕 확장': '바탕',
    '함초롬돋움': '돋움',
    '함초롬돋움 확장': '돋움',
    
    // 명조체 계열
    '바탕': '바탕',
    '바탕체': '바탕',
    '신명조': '바탕',
    '중명조': '바탕',
    '세명조': '바탕',
    '순명조': '바탕',
    'HY신명조': '바탕',
    'HY중고딕': '바탕',
    
    // 고딕체 계열
    '돋움': '돋움',
    '돋움체': '돋움',
    '굴림': '굴림',
    '굴림체': '굴림',
    '맑은 고딕': '맑은 고딕',
    '나눔고딕': '나눔고딕',
    '나눔바른고딕': '나눔바른고딕',
    'HY견고딕': '돋움',
    'HY울릉도': '돋움',
    
    // 특수 폰트
    '궁서': '궁서',
    '궁서체': '궁서',
    '휴먼편지체': '궁서',
    '휴먼명조': '바탕',
    '휴먼고딕': '돋움',
    
    // 영문 폰트
    'Arial': 'Arial',
    'Times New Roman': 'Times New Roman',
    'Courier New': 'Courier New',
    'Verdana': 'Verdana',
    'Georgia': 'Georgia',
    'Trebuchet MS': 'Trebuchet MS',
    'Helvetica': 'Helvetica',
    'Tahoma': 'Tahoma',
    
    // 영문명 한글 폰트
    'Batang': '바탕',
    'BatangChe': '바탕',
    'Dotum': '돋움',
    'DotumChe': '돋움',
    'Gulim': '굴림',
    'GulimChe': '굴림',
    'Gungsuh': '궁서',
    'GungsuhChe': '궁서',
    'Malgun Gothic': '맑은 고딕',
    'NanumGothic': '나눔고딕',
    'NanumMyeongjo': '나눔명조',
    'NanumBarunGothic': '나눔바른고딕'
  },
  
  // 크기 매핑 (HWPX pt → Canvas Editor px)
  // HWPX는 주로 pt 단위, Canvas Editor는 px 단위 사용
  sizeMap: {
    '8': 11,   // 8pt → 11px
    '9': 12,   // 9pt → 12px
    '10': 13,  // 10pt → 13px
    '11': 15,  // 11pt → 15px
    '12': 16,  // 12pt → 16px
    '14': 19,  // 14pt → 19px
    '16': 21,  // 16pt → 21px
    '18': 24,  // 18pt → 24px
    '20': 27,  // 20pt → 27px
    '22': 29,  // 22pt → 29px
    '24': 32,  // 24pt → 32px
    '26': 35,  // 26pt → 35px
    '28': 37,  // 28pt → 37px
    '36': 48,  // 36pt → 48px
    '48': 64,  // 48pt → 64px
    '72': 96   // 72pt → 96px
  },
  
  // 색상 매핑 (필요시 특수 색상 변환)
  colorMap: {
    'auto': '#000000',
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'green': '#00FF00',
    'blue': '#0000FF',
    'yellow': '#FFFF00',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'gray': '#808080',
    'lightgray': '#C0C0C0',
    'darkgray': '#404040'
  },
  
  // 문단 정렬 매핑
  alignMap: {
    'left': 'left',
    'center': 'center',
    'right': 'right',
    'both': 'justify',
    'distribute': 'alignment'
  },
  
  // 표 테두리 매핑
  borderMap: {
    'solid': 'all',
    'none': 'empty',
    'dotted': 'dash'
  }
}

/**
 * HWPX 태그를 Canvas Editor ElementType으로 매핑
 */
export const TAG_TO_ELEMENT_TYPE: Record<string, ElementType> = {
  'p': ElementType.TEXT,
  'run': ElementType.TEXT,
  't': ElementType.TEXT,
  'tbl': ElementType.TABLE,
  'pic': ElementType.IMAGE,
  'equation': ElementType.LATEX,
  'hyperlink': ElementType.HYPERLINK,
  'pageBreak': ElementType.PAGE_BREAK,
  'separator': ElementType.SEPARATOR
}

/**
 * HWPX 정렬 속성을 Canvas Editor RowFlex로 변환
 */
export function mapAlignment(hwpxAlign?: string): RowFlex {
  const alignMap: Record<string, RowFlex> = {
    'left': RowFlex.LEFT,
    'center': RowFlex.CENTER,
    'right': RowFlex.RIGHT,
    'both': RowFlex.JUSTIFY,
    'justify': RowFlex.JUSTIFY,
    'distribute': RowFlex.ALIGNMENT
  }
  
  return alignMap[hwpxAlign || 'left'] || RowFlex.LEFT
}

/**
 * HWPX 리스트 스타일을 Canvas Editor ListStyle로 변환
 */
export function mapListStyle(hwpxStyle?: string): ListStyle {
  const styleMap: Record<string, ListStyle> = {
    'decimal': ListStyle.DECIMAL,
    'disc': ListStyle.DISC,
    'circle': ListStyle.CIRCLE,
    'square': ListStyle.SQUARE,
    'checkbox': ListStyle.CHECKBOX
  }
  
  return styleMap[hwpxStyle || 'disc'] || ListStyle.DISC
}

/**
 * HWPX 제목 레벨을 Canvas Editor TitleLevel로 변환
 */
export function mapTitleLevel(level?: string | number): TitleLevel | undefined {
  const levelMap: Record<string, TitleLevel> = {
    '1': TitleLevel.FIRST,
    '2': TitleLevel.SECOND,
    '3': TitleLevel.THIRD,
    '4': TitleLevel.FOURTH,
    '5': TitleLevel.FIFTH,
    '6': TitleLevel.SIXTH
  }
  
  const levelMapNum: Record<number, TitleLevel> = {
    1: TitleLevel.FIRST,
    2: TitleLevel.SECOND,
    3: TitleLevel.THIRD,
    4: TitleLevel.FOURTH,
    5: TitleLevel.FIFTH,
    6: TitleLevel.SIXTH
  }
  
  if (!level) return undefined
  
  if (typeof level === 'string') {
    return levelMap[level]
  } else {
    return levelMapNum[level]
  }
}

/**
 * HWPX 색상 코드를 Canvas Editor 색상 코드로 변환
 * HWPX: RRGGBB (no #) → Canvas Editor: #RRGGBB
 */
export function mapColor(hwpxColor?: string): string | undefined {
  if (!hwpxColor) return undefined
  
  // 이미 # 포함된 경우
  if (hwpxColor.startsWith('#')) {
    return hwpxColor.toUpperCase()
  }
  
  // 미리 정의된 색상명
  if (DEFAULT_STYLE_MAPPING.colorMap[hwpxColor]) {
    return DEFAULT_STYLE_MAPPING.colorMap[hwpxColor]
  }
  
  // RRGGBB 형식인 경우 # 추가
  if (/^[0-9A-Fa-f]{6}$/.test(hwpxColor)) {
    return `#${hwpxColor.toUpperCase()}`
  }
  
  return undefined
}

/**
 * HWPX 크기를 Canvas Editor 크기로 변환
 * pt → px 변환 (1pt = 1.333px)
 */
export function mapSize(hwpxSize?: string | number): number | undefined {
  if (!hwpxSize) return undefined
  
  const sizeStr = String(hwpxSize)
  
  // 매핑 테이블에 있는 경우
  if (DEFAULT_STYLE_MAPPING.sizeMap[sizeStr]) {
    return DEFAULT_STYLE_MAPPING.sizeMap[sizeStr]
  }
  
  // 숫자인 경우 pt → px 변환
  const sizeNum = parseFloat(sizeStr)
  if (!isNaN(sizeNum)) {
    return Math.round(sizeNum * 1.333)
  }
  
  return undefined
}

/**
 * HWPX 폰트를 Canvas Editor 폰트로 변환
 */
export function mapFont(hwpxFont?: string): string | undefined {
  if (!hwpxFont) return undefined
  
  return DEFAULT_STYLE_MAPPING.fontMap[hwpxFont] || hwpxFont
}

/**
 * HWPX 줄 간격을 Canvas Editor rowMargin으로 변환
 * HWPX: 100 = 1.0배, 150 = 1.5배, 200 = 2.0배
 * Canvas Editor: 실제 배수 값
 */
export function mapLineSpacing(hwpxSpacing?: string | number): number | undefined {
  if (!hwpxSpacing) return undefined
  
  const spacingNum = typeof hwpxSpacing === 'number' ? hwpxSpacing : parseFloat(hwpxSpacing)
  if (!isNaN(spacingNum)) {
    return spacingNum / 100
  }
  
  return undefined
}

// fontMapping export 추가
export const fontMapping = DEFAULT_STYLE_MAPPING.fontMap

/**
 * HWPX boolean 속성 변환
 */
export function mapBoolean(value?: string | boolean): boolean | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'boolean') return value
  
  return value === 'true' || value === '1' || value === 'on'
}

/**
 * HWPX 테두리 스타일을 Canvas Editor 테두리 타입으로 변환
 */
export function mapBorderType(hwpxBorder?: string): string {
  const borderMap: Record<string, string> = {
    'solid': 'all',
    'none': 'empty',
    'hidden': 'empty',
    'dotted': 'dash',
    'dashed': 'dash',
    'double': 'all',
    'groove': 'all',
    'ridge': 'all',
    'inset': 'all',
    'outset': 'all'
  }
  
  return borderMap[hwpxBorder || 'solid'] || 'all'
}

/**
 * HWPX 이미지 경로를 Canvas Editor base64로 변환
 * (실제 구현시 binary_files에서 가져와야 함)
 */
export function mapImage(imagePath: string, binaryFiles: Record<string, string>): string | undefined {
  // binary_files에서 해당 경로의 base64 데이터 찾기
  const base64Data = binaryFiles[imagePath]
  
  if (base64Data) {
    // 이미 data URL 형식인 경우
    if (base64Data.startsWith('data:')) {
      return base64Data
    }
    
    // 확장자 추측
    const ext = imagePath.split('.').pop()?.toLowerCase()
    const mimeType = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml'
    }[ext || 'png'] || 'image/png'
    
    return `data:${mimeType};base64,${base64Data}`
  }
  
  return undefined
}

/**
 * HWPX 수직 정렬을 Canvas Editor 수직 정렬로 변환
 */
export function mapVerticalAlign(hwpxVAlign?: string): 'top' | 'middle' | 'bottom' {
  const vAlignMap: Record<string, 'top' | 'middle' | 'bottom'> = {
    'top': 'top',
    'center': 'middle',
    'middle': 'middle',
    'bottom': 'bottom'
  }
  
  return vAlignMap[hwpxVAlign || 'top'] || 'top'
}

/**
 * HWPX 단위 값을 픽셀로 변환
 * 지원 단위: pt, mm, cm, in, px
 */
export function convertToPixels(value?: string | number): number | undefined {
  if (!value) return undefined
  
  const valueStr = String(value)
  const match = valueStr.match(/^(\d+(?:\.\d+)?)(pt|mm|cm|in|px)?$/i)
  
  if (!match) return undefined
  
  const num = parseFloat(match[1])
  const unit = match[2]?.toLowerCase() || 'pt'
  
  const conversions: Record<string, number> = {
    'px': 1,
    'pt': 1.333,
    'mm': 3.78,
    'cm': 37.8,
    'in': 96
  }
  
  return Math.round(num * (conversions[unit] || 1))
}

/**
 * 기본 스타일 값들
 */
export const DEFAULT_VALUES = {
  font: 'AppleGothic',
  size: 16,
  color: '#000000',
  rowFlex: RowFlex.LEFT,
  rowMargin: 1.0,
  tableColWidth: 100,
  tableCellHeight: 30
}