/**
 * HWPX to Canvas Editor Converter Type Definitions
 */

import { IElement } from '../../editor/interface/Element'
import type { IEditorData } from '../../editor/interface/Editor'

// ============== HWPX Types ==============

/**
 * HWPX JSON 최상위 구조
 */
export interface IHWPXJson {
  hwpx_metadata: IHWPXMetadata
  content: IHWPXContent
}

export interface IHWPXMetadata {
  zip_structure: {
    file_order: string[]
    file_info: Record<string, any>
    zip_metadata: {
      file_count: number
      compression: number
    }
  }
  conversion_info?: any
}

export interface IHWPXContent {
  version: IHWPXVersion
  settings: IHWPXSettings
  header: IHWPXHeader
  sections: IHWPXSection[]
  binary_files: Record<string, string>
}

export interface IHWPXVersion {
  parsed_structure: IHWPXNode
  original_xml: string
}

export interface IHWPXSettings {
  parsed_structure: IHWPXNode
  original_xml: string
}

export interface IHWPXHeader {
  parsed_structure: IHWPXNode
  original_xml: string
}

export interface IHWPXSection {
  filename: string
  data: {
    parsed_structure: IHWPXNode
    original_xml: string
  }
}

/**
 * HWPX 재귀적 노드 구조
 */
export interface IHWPXNode {
  tag: string
  namespace?: string
  attributes?: Record<string, string>
  attrs?: Record<string, string>  // alias for attributes
  text?: string | null
  children?: IHWPXNode[]
}

// HWPX 태그 타입들
export type HWPXTagType = 
  | 'p'        // 문단
  | 'run'      // 텍스트 런
  | 't'        // 텍스트
  | 'tbl'      // 표
  | 'tr'       // 표 행
  | 'tc'       // 표 셀
  | 'subList'  // 셀 내 문단 목록
  | 'ctrl'     // 컨트롤
  | 'pic'      // 이미지
  | 'equation' // 수식
  | 'hyperlink'// 하이퍼링크
  | 'paraPr'   // 문단 속성
  | 'charPr'   // 문자 속성
  | 'colPr'    // 열 속성
  | 'cellPr'   // 셀 속성

// ============== Canvas Editor Types (Import from existing) ==============

// Element 관련 타입
export type { IElement } from '../../editor/interface/Element'
export type { ITr } from '../../editor/interface/table/Tr'
export type { ITd } from '../../editor/interface/table/Td'
export type { IColgroup } from '../../editor/interface/table/Colgroup'
export type { IControl } from '../../editor/interface/Control'

// Editor 관련 타입
export type { 
  IEditorData,
  IEditorOption
} from '../../editor/interface/Editor'

// Enum 타입
export { ElementType } from '../../editor/dataset/enum/Element'
export { RowFlex } from '../../editor/dataset/enum/Row'
export { ListType, ListStyle } from '../../editor/dataset/enum/List'
export { TitleLevel } from '../../editor/dataset/enum/Title'

// ============== Converter Types ==============

/**
 * 변환 옵션
 */
export interface IConverterOptions {
  // 기본 설정
  preserveStyles?: boolean      // 스타일 보존 여부
  preserveIds?: boolean         // ID 보존 여부
  preserveLayout?: boolean      // 레이아웃 보존 여부
  
  // 텍스트 옵션
  defaultFont?: string          // 기본 폰트
  defaultSize?: number          // 기본 크기
  defaultColor?: string         // 기본 색상
  
  // 이미지 옵션  
  embedImages?: boolean         // 이미지 임베드 여부
  imageMaxWidth?: number        // 이미지 최대 너비
  imageMaxHeight?: number       // 이미지 최대 높이
  
  // 표 옵션
  tableDefaultBorder?: boolean  // 표 기본 테두리
  preserveTableStyles?: boolean // 표 스타일 보존
  
  // 변환 규칙
  skipEmptyParagraphs?: boolean // 빈 문단 건너뛰기
  normalizeWhitespace?: boolean // 공백 정규화
  
  // 에러 처리
  onError?: (error: Error, context: any) => void
  onWarning?: (message: string, context: any) => void
}

/**
 * 변환 컨텍스트
 */
export interface IConversionContext {
  // 현재 상태
  currentSection?: number
  currentParagraph?: number
  currentRun?: number
  
  // 스타일 스택
  styleStack: IStyleContext[]
  
  // ID 매핑
  idMap: Map<string, string>
  
  // 리소스
  images: Map<string, string>
  fonts: Map<string, string>
  
  // 통계
  stats: IConversionStats
  
  // 옵션
  options: IConverterOptions
}

/**
 * 스타일 컨텍스트
 */
export interface IStyleContext {
  // 텍스트 스타일
  font?: string
  size?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikeout?: boolean
  color?: string
  highlight?: string
  
  // 문단 스타일
  align?: 'left' | 'center' | 'right' | 'justify'
  indent?: number
  lineSpacing?: number
  
  // 표 스타일
  borderWidth?: number
  borderColor?: string
  backgroundColor?: string
}

/**
 * 변환 통계
 */
export interface IConversionStats {
  totalParagraphs: number
  totalTables: number
  totalImages: number
  totalHyperlinks: number
  convertedElements: number
  skippedElements: number
  errors: number
  warnings: number
  startTime: number
  endTime?: number
}

/**
 * 변환 결과
 */
export interface IConversionResult {
  success: boolean
  data?: IEditorResult
  stats: IConversionStats
  errors?: Error[]
  warnings?: string[]
}

/**
 * Editor Result (Canvas Editor format)
 */
export interface IEditorResult {
  version: string
  data: IEditorData
  options?: any
}

/**
 * 스타일 매핑 테이블
 */
export interface IStyleMapping {
  // HWPX → Canvas Editor 폰트 매핑
  fontMap: Record<string, string>
  
  // HWPX → Canvas Editor 크기 매핑
  sizeMap: Record<string, number>
  
  // HWPX → Canvas Editor 색상 매핑
  colorMap: Record<string, string>
  
  // 문단 정렬 매핑
  alignMap: {
    'left': 'left'
    'center': 'center'
    'right': 'right'
    'both': 'justify'
    'distribute': 'alignment'
  }
  
  // 표 테두리 매핑
  borderMap: {
    'solid': 'all'
    'none': 'empty'
    'dotted': 'dash'
  }
}

/**
 * Converter 인터페이스
 */
export interface IHWPXToCanvasConverter {
  convert(hwpxJson: IHWPXJson, options?: IConverterOptions): Promise<IConversionResult>
  convertSync(hwpxJson: IHWPXJson, options?: IConverterOptions): IConversionResult
}

/**
 * 노드 프로세서 인터페이스
 */
export interface INodeProcessor {
  canProcess(node: IHWPXNode): boolean
  process(node: IHWPXNode, context: IConversionContext): IElement[]
}

/**
 * 노드 프로세서 레지스트리
 */
export interface INodeProcessorRegistry {
  register(tag: string, processor: INodeProcessor): void
  get(tag: string): INodeProcessor | undefined
  has(tag: string): boolean
}