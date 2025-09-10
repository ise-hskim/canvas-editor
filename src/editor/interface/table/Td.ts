import { VerticalAlign } from '../../dataset/enum/VerticalAlign'
import { TdBorder, TdSlash } from '../../dataset/enum/table/Table'
import { IElement, IElementPosition } from '../Element'
import { IRow } from '../Row'

export interface ITd {
  conceptId?: string
  id?: string
  extension?: unknown
  externalId?: string
  x?: number
  y?: number
  width?: number
  height?: number
  colspan: number
  rowspan: number
  value: IElement[]
  trIndex?: number
  tdIndex?: number
  isLastRowTd?: boolean
  isLastColTd?: boolean
  isLastTd?: boolean
  rowIndex?: number
  colIndex?: number
  rowList?: IRow[]
  positionList?: IElementPosition[]
  verticalAlign?: VerticalAlign
  backgroundColor?: string
  borderTypes?: TdBorder[]
  slashTypes?: TdSlash[]
  mainHeight?: number // 콘텐츠 + 내부 여백 높이
  realHeight?: number // 실제 높이 (열 병합 포함)
  realMinHeight?: number // 실제 최소 높이 (열 병합 포함)
  disabled?: boolean // 콘텐츠 편집 불가
  deletable?: boolean // 콘텐츠 삭제 불가
}
