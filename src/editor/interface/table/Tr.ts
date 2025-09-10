import { ITd } from './Td'

export interface ITr {
  id?: string
  extension?: unknown
  externalId?: string
  height: number
  tdList: ITd[]
  minHeight?: number
  pagingRepeat?: boolean // 각 페이지 상단에 제목 행 형태로 반복 표시
}
