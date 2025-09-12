import { ElementType } from '../../../editor/dataset/enum/Element'
import { VerticalAlign } from '../../../editor/dataset/enum/VerticalAlign'
import { IElement } from '../../../editor/interface/Element'
import { IColgroup } from '../../../editor/interface/table/Colgroup'
import { ITd } from '../../../editor/interface/table/Td'
import { ITr } from '../../../editor/interface/table/Tr'
import { IHWPXNode as HWPXNode } from '../types'
import { BaseProcessor, ProcessorContext } from './BaseProcessor'

/**
 * 테이블 요소 처리 Processor
 * HWPX의 테이블 관련 노드를 Canvas Editor의 TABLE 요소로 변환
 */
export class TableProcessor extends BaseProcessor {
  supportedTags = ['tbl', 'tr', 'tc', 'hp:tbl', 'hp:tr', 'hp:tc']

  process(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []

    if (node.tag === 'tbl' || node.tag === 'hp:tbl') {
      // 테이블 전체 처리
      console.log('Processing table:', {
        tag: node.tag,
        rowCnt: node.attributes?.rowCnt,
        colCnt: node.attributes?.colCnt
      })
      const tableElement = this.processTable(node, context)
      if (tableElement) {
        elements.push(tableElement)
      }
    } else if (node.tag === 'hp:tr' || node.tag === 'tr') {
      // 행 처리 (독립적으로 호출된 경우)
      console.warn('TableProcessor: tr should be processed within table context')
    } else if (node.tag === 'hp:tc' || node.tag === 'tc') {
      // 셀 처리 (독립적으로 호출된 경우)
      console.warn('TableProcessor: tc should be processed within tr context')
    }

    return elements
  }

  /**
   * 테이블 요소 처리
   */
  private processTable(node: HWPXNode, context?: ProcessorContext): IElement | null {
    // 테이블 속성 추출
    const tableProps = this.extractTableProperties(node)
    
    // colgroup 생성
    const colgroup = this.extractColgroup(node)
    
    // 행들 처리
    const trList = this.extractRows(node, context)
    
    if (!trList.length) {
      return null
    }

    // 테이블 전체 너비 계산
    const totalWidth = colgroup.reduce((sum, col) => sum + col.width, 0)

    // 테이블 요소 생성
    const tableElement: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup,
      trList,
      width: totalWidth, // 테이블 전체 너비 추가
      ...tableProps
    }

    // 테이블 ID 생성
    if (context?.generateId) {
      tableElement.tableId = context.generateId()
    }

    return tableElement
  }

  /**
   * 테이블 속성 추출
   */
  private extractTableProperties(node: HWPXNode): Partial<IElement> {
    const props: Partial<IElement> = {}
    
    // 테이블 속성 노드 찾기
    const tblPr = node.children?.find(child => child.tag === 'hp:tblPr')
    if (!tblPr) return props

    // 테두리 스타일
    const borderType = this.getAttribute(tblPr, 'borderType')
    if (borderType) {
      // TODO: HWPX borderType을 Canvas Editor TableBorder enum으로 매핑
      props.borderType = this.convertBorderType(borderType)
    }

    // 테두리 색상
    const borderColor = this.getAttribute(tblPr, 'borderColor')
    if (borderColor) {
      props.borderColor = this.convertColor(borderColor)
    }

    // 테두리 너비
    const borderWidth = this.getAttribute(tblPr, 'borderWidth')
    if (borderWidth) {
      props.borderWidth = parseInt(borderWidth)
    }

    return props
  }

  /**
   * Colgroup 추출
   */
  private extractColgroup(node: HWPXNode): IColgroup[] {
    const colgroup: IColgroup[] = []
    
    // attributes에서 colCnt 확인
    const colCnt = parseInt(node.attributes?.colCnt || '0')
    
    // sz 태그에서 전체 너비 확인
    const szNode = node.children?.find(child => child.tag === 'sz')
    const totalWidth = parseInt(szNode?.attributes?.width || '45000') / 100 // HWPX 단위를 픽셀로 변환
    
    if (colCnt > 0) {
      // colCnt만큼 균등하게 너비 분배
      const colWidth = Math.floor(totalWidth / colCnt)
      for (let i = 0; i < colCnt; i++) {
        colgroup.push({ width: colWidth })
      }
    } else {
      // colCnt가 없으면 tr/tc에서 추론
      const rows = node.children?.filter(child => child.tag === 'tr' || child.tag === 'hp:tr') || []
      let maxColCount = 0
      
      for (const row of rows) {
        let colCount = 0
        const cells = row.children?.filter(child => child.tag === 'tc' || child.tag === 'hp:tc') || []
        for (const cell of cells) {
          const colspan = parseInt(cell.attributes?.colspan || '1')
          colCount += colspan
        }
        maxColCount = Math.max(maxColCount, colCount)
      }
      
      // 최대 컬럼 수만큼 colgroup 생성
      if (maxColCount === 0) {
        // 기본적으로 최소 1개 컬럼
        colgroup.push({ width: 150 })
      } else {
        const colWidth = Math.floor(totalWidth / maxColCount)
        for (let i = 0; i < maxColCount; i++) {
          colgroup.push({ width: colWidth })
        }
      }
    }

    // colgroup이 비어있으면 최소 1개 추가
    if (colgroup.length === 0) {
      colgroup.push({ width: 150 })
    }

    console.log('Created colgroup:', colgroup)
    return colgroup
  }

  /**
   * 행들 추출
   */
  private extractRows(node: HWPXNode, context?: ProcessorContext): ITr[] {
    const trList: ITr[] = []
    
    const rows = node.children?.filter(child => child.tag === 'tr' || child.tag === 'hp:tr') || []
    
    console.log(`Found ${rows.length} rows in table`)
    
    for (const row of rows) {
      const tr = this.processRow(row, context)
      if (tr) {
        trList.push(tr)
      }
    }

    return trList
  }

  /**
   * 행 처리
   */
  private processRow(node: HWPXNode, context?: ProcessorContext): ITr | null {
    const tdList: ITd[] = []
    
    const cells = node.children?.filter(child => child.tag === 'tc' || child.tag === 'hp:tc') || []
    
    console.log(`Processing row with ${cells.length} cells`)
    
    let cellIndex = 0
    for (const cell of cells) {
      const td = this.processCell(cell, context, cellIndex)
      if (td) {
        tdList.push(td)
        cellIndex += td.colspan
      }
    }

    if (tdList.length === 0) {
      return null
    }

    const tr: ITr = {
      tdList,
      height: 40 // 기본 높이를 40으로 증가
    }

    // 행 ID 생성
    if (context?.generateId) {
      (tr as any).trId = context.generateId()
    }

    // 행 높이
    const height = node.attributes?.height
    if (height) {
      tr.height = parseInt(height)
    }

    return tr
  }

  /**
   * 셀 처리
   */
  private processCell(node: HWPXNode, context?: ProcessorContext, _cellIndex?: number): ITd | null {
    const td: ITd = {
      colspan: 1,
      rowspan: 1,
      value: []
    }

    // 셀 ID 생성
    if (context?.generateId) {
      (td as any).tdId = context.generateId()
    }

    // colspan/rowspan 처리
    const colspan = this.getAttribute(node, 'colspan')
    if (colspan) {
      td.colspan = parseInt(colspan)
    }

    const rowspan = this.getAttribute(node, 'rowspan')
    if (rowspan) {
      td.rowspan = parseInt(rowspan)
    }

    // 셀 배경색
    const backgroundColor = this.getAttribute(node, 'backgroundColor')
    if (backgroundColor) {
      td.backgroundColor = this.convertColor(backgroundColor)
    }

    // 셀 내용 처리
    const cellContent = this.extractCellContent(node, context)
    if (cellContent.length > 0) {
      td.value = cellContent
    } else {
      // 빈 셀이어도 최소한 빈 텍스트 요소 추가
      td.value = [{
        type: ElementType.TEXT,
        value: ''
      }]
    }

    // 셀 너비 - 기본값 설정
    const width = this.getAttribute(node, 'width')
    if (width) {
      td.width = parseInt(width)
    } else {
      td.width = 150 * td.colspan // colspan에 비례한 기본 너비
    }

    // 셀 높이
    const height = this.getAttribute(node, 'height')
    if (height) {
      td.height = parseInt(height)
    }

    // 수직 정렬
    const verticalAlign = this.getAttribute(node, 'verticalAlign')
    if (verticalAlign) {
      td.verticalAlign = this.convertVerticalAlign(verticalAlign)
    }

    return td
  }

  /**
   * 셀 내용 추출
   */
  private extractCellContent(node: HWPXNode, _context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []
    
    // 테이블 컨텍스트 설정 (향후 사용 예정)
    // const _tableContext: ProcessorContext = {
    //   ...context,
    //   inTable: true
    // }

    // 셀 내의 모든 자식 노드 처리
    if (node.children?.length) {
      // TODO: ProcessorManager를 통해 자식 노드들 처리
      // 현재는 텍스트만 추출
      const text = this.extractText(node)
      if (text) {
        const textElements = text.split('').map(char => ({
          type: ElementType.TEXT,
          value: char
        }))
        elements.push(...textElements)
      }
    }

    return elements
  }

  /**
   * HWPX 테두리 타입을 Canvas Editor 타입으로 변환
   */
  private convertBorderType(hwpxBorderType: string): any {
    // TODO: TableBorder enum 매핑
    switch (hwpxBorderType) {
      case 'solid': return 1
      case 'dashed': return 2
      case 'dotted': return 3
      default: return 1
    }
  }

  /**
   * HWPX 색상값을 CSS 색상으로 변환
   */
  private convertColor(hwpxColor: string): string {
    if (hwpxColor.startsWith('#')) {
      return hwpxColor
    }
    
    const colorNum = parseInt(hwpxColor)
    if (!isNaN(colorNum)) {
      const b = (colorNum >> 16) & 0xFF
      const g = (colorNum >> 8) & 0xFF
      const r = colorNum & 0xFF
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }

    return '#000000'
  }

  /**
   * 수직 정렬 변환
   */
  private convertVerticalAlign(align: string): VerticalAlign {
    switch (align) {
      case 'top': return VerticalAlign.TOP
      case 'center': return VerticalAlign.MIDDLE
      case 'bottom': return VerticalAlign.BOTTOM
      default: return VerticalAlign.TOP
    }
  }
}