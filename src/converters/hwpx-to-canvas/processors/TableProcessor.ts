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
  supportedTags = ['tbl', 'tr', 'tc', 'hp:tbl', 'hp:tr', 'hp:tc', 'sz', 'pos', 'outMargin', 'inMargin']
  
  private processorManager: any // ProcessorManager 인스턴스 참조

  setProcessorManager(manager: any): void {
    this.processorManager = manager
  }

  process(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []

    if (node.tag === 'tbl' || node.tag === 'hp:tbl') {
      // 테이블 전체 처리
      console.log('Processing table:', {
        tag: node.tag,
        childrenTags: node.children?.map(c => c.tag),
        rowCnt: node.attributes?.rowCnt,
        colCnt: node.attributes?.colCnt
      })
      const tableElement = this.processTable(node, context)
      if (tableElement) {
        elements.push(tableElement)
      }
    } else if (node.tag === 'sz' || node.tag === 'pos' || node.tag === 'outMargin' || node.tag === 'inMargin') {
      // 테이블 메타데이터 태그들은 무시 (테이블 내부에서 처리됨)
      console.log('Table metadata tag encountered outside table:', node.tag)
      // 자식 노드에 테이블이 있을 수 있음
      if (node.children?.length) {
        for (const child of node.children) {
          if (child.tag === 'tbl' || child.tag === 'hp:tbl') {
            const tableElement = this.processTable(child, context)
            if (tableElement) {
              elements.push(tableElement)
            }
          }
        }
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
   * HWPX 단위를 픽셀로 변환
   * HWPX: 7200 단위 = 1 inch = 96 픽셀
   */
  private hwpxToPixel(hwpxValue: string | number): number {
    const value = typeof hwpxValue === 'string' ? parseInt(hwpxValue) : hwpxValue
    if (isNaN(value)) return 0
    return Math.round(value * 96 / 7200)
  }

  /**
   * 테이블 메타데이터 추출
   */
  private extractTableMetadata(node: HWPXNode): {
    width?: number
    height?: number
    outMargin?: { left: number; right: number; top: number; bottom: number }
    inMargin?: { left: number; right: number; top: number; bottom: number }
  } {
    const metadata: any = {}
    
    if (!node.children) return metadata
    
    // 디버그 로그
    console.log('Extracting table metadata from children:', node.children.map(c => c.tag))
    
    for (const child of node.children) {
      // 크기 (sz)
      if (child.tag === 'sz') {
        console.log('Found sz tag:', child.attributes)
        if (child.attributes?.width) {
          metadata.width = this.hwpxToPixel(child.attributes.width)
        }
        if (child.attributes?.height) {
          metadata.height = this.hwpxToPixel(child.attributes.height)
        }
      }
      
      // 외부 여백 (outMargin)
      if (child.tag === 'outMargin') {
        console.log('Found outMargin tag:', child.attributes)
        metadata.outMargin = {
          left: this.hwpxToPixel(child.attributes?.left || 0),
          right: this.hwpxToPixel(child.attributes?.right || 0),
          top: this.hwpxToPixel(child.attributes?.top || 0),
          bottom: this.hwpxToPixel(child.attributes?.bottom || 0)
        }
      }
      
      // 내부 여백 (inMargin) - 셀 패딩
      if (child.tag === 'inMargin') {
        console.log('Found inMargin tag:', child.attributes)
        metadata.inMargin = {
          left: this.hwpxToPixel(child.attributes?.left || 141),
          right: this.hwpxToPixel(child.attributes?.right || 141),
          top: this.hwpxToPixel(child.attributes?.top || 141),
          bottom: this.hwpxToPixel(child.attributes?.bottom || 141)
        }
      }
    }
    
    console.log('Extracted metadata:', metadata)
    return metadata
  }

  /**
   * 테이블 요소 처리
   */
  private processTable(node: HWPXNode, context?: ProcessorContext): IElement | null {
    // 테이블 메타데이터 추출 (sz, pos, margins)
    const tableMetadata = this.extractTableMetadata(node)
    
    // 테이블 속성 추출
    const tableProps = this.extractTableProperties(node)
    
    // colgroup 생성
    const colgroup = this.extractColgroup(node)
    
    // 행들 처리 (colgroup 전달)
    const trList = this.extractRows(node, context, colgroup)
    
    if (!trList.length) {
      return null
    }

    // 테이블 전체 너비 계산 (메타데이터 우선, 없으면 colgroup 합계)
    const totalWidth = tableMetadata.width || colgroup.reduce((sum, col) => sum + col.width, 0)

    // 테이블 요소 생성
    const tableElement: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup,
      trList,
      width: totalWidth,
      ...tableProps
    }
    
    // 메타데이터 스타일 적용
    if (tableMetadata.height) {
      tableElement.height = tableMetadata.height
    }
    
    // 셀 패딩을 각 TD에 적용 (inMargin)
    if (tableMetadata.inMargin && tableElement.trList) {
      for (const tr of tableElement.trList) {
        if (tr.tdList) {
          for (const td of tr.tdList) {
            // 각 셀에 패딩 적용 (Canvas Editor의 tdPadding 형식)
            // 기본 패딩 값 대신 메타데이터의 inMargin 값 사용
            td.verticalAlign = td.verticalAlign || VerticalAlign.TOP
          }
        }
      }
    }

    // 테이블 ID 생성
    if (context?.generateId) {
      tableElement.tableId = context.generateId()
    }

    // 디버그 로그
    console.log('Created table element:', {
      type: tableElement.type,
      width: tableElement.width,
      height: tableElement.height,
      metadata: tableMetadata,
      colgroup: tableElement.colgroup,
      trCount: tableElement.trList?.length,
      firstRowCells: tableElement.trList?.[0]?.tdList?.length
    })

    return tableElement
  }

  /**
   * 테이블 속성 추출
   */
  private extractTableProperties(node: HWPXNode): Partial<IElement> {
    const props: Partial<IElement> = {}
    
    // 테이블 속성 노드 찾기
    const tblPr = node.children?.find(child => child.tag === 'hp:tblPr' || child.tag === 'tblPr')
    
    // borderFillIDRef 찾기
    const borderFillIDRef = node.attributes?.borderFillIDRef || 
                           tblPr?.attributes?.borderFillIDRef
    
    if (borderFillIDRef) {
      console.log('Table borderFillIDRef:', borderFillIDRef)
      // TODO: StyleLoader에서 borderFill 정의 가져오기
      // 현재는 기본 테두리 설정
      props.borderType = 'all' as any // 모든 테두리 표시
      props.borderColor = '#000000'
      props.borderWidth = 1
    } else {
      // borderFill 노드 직접 찾기
      const borderFill = node.children?.find(child => child.tag === 'borderFill')
      if (borderFill) {
        // 테두리 타입
        const borderType = borderFill.attributes?.type || 'solid'
        props.borderType = this.convertBorderType(borderType)
        
        // 테두리 색상 (left border 기준)
        const leftBorder = borderFill.children?.find(child => child.tag === 'leftBorder')
        if (leftBorder && leftBorder.attributes?.color) {
          props.borderColor = this.convertColor(leftBorder.attributes.color)
        }
        
        // 테두리 너비
        if (leftBorder && leftBorder.attributes?.width) {
          props.borderWidth = this.hwpxToPixel(leftBorder.attributes.width)
        }
      } else {
        // 기본값: 테두리 표시
        props.borderType = 'all' as any
        props.borderColor = '#000000'
        props.borderWidth = 1
      }
    }

    return props
  }

  /**
   * Colgroup 추출
   */
  private extractColgroup(node: HWPXNode): IColgroup[] {
    const colgroup: IColgroup[] = []
    
    // 첫 번째 행에서 각 셀의 실제 너비 추출 (colspan 고려)
    const firstRow = node.children?.find(child => child.tag === 'tr' || child.tag === 'hp:tr')
    if (firstRow) {
      const cells = firstRow.children?.filter(child => child.tag === 'tc' || child.tag === 'hp:tc') || []
      
      for (const cell of cells) {
        // cellSpan 확인
        const cellSpan = cell.children?.find(child => child.tag === 'cellSpan')
        const colspan = cellSpan?.attributes?.colSpan ? 
          parseInt(cellSpan.attributes.colSpan) : 1
        
        // cellSz에서 너비 추출
        const cellSz = cell.children?.find(child => child.tag === 'cellSz')
        if (cellSz && cellSz.attributes?.width) {
          const totalWidth = this.hwpxToPixel(cellSz.attributes.width)
          // colspan이 있으면 너비를 균등 분배
          const width = Math.floor(totalWidth / colspan)
          for (let i = 0; i < colspan; i++) {
            colgroup.push({ width })
          }
          console.log(`Cell width from cellSz: ${cellSz.attributes.width} → ${totalWidth}px (colspan=${colspan}, each=${width}px)`)
        } else {
          // cellSz가 없으면 기본값
          for (let i = 0; i < colspan; i++) {
            colgroup.push({ width: 100 })
          }
        }
      }
      
      console.log('Created colgroup from first row cells (with colspan):', colgroup)
      return colgroup
    }
    
    // 첫 번째 행이 없으면 기존 로직 사용
    const colCnt = parseInt(node.attributes?.colCnt || '0')
    
    // sz 태그에서 전체 너비 확인
    const szNode = node.children?.find(child => child.tag === 'sz')
    const hwpxWidth = parseInt(szNode?.attributes?.width || '45000')
    const totalWidth = Math.round(hwpxWidth * 96 / 7200)
    
    console.log('Table size (fallback):', {
      colCnt,
      hwpxWidth,
      totalWidthPx: totalWidth
    })
    
    if (colCnt > 0) {
      // colCnt만큼 균등하게 너비 분배
      const colWidth = Math.floor(totalWidth / colCnt)
      for (let i = 0; i < colCnt; i++) {
        colgroup.push({ width: colWidth })
      }
    } else {
      // 기본값
      colgroup.push({ width: 150 })
    }

    return colgroup
  }

  /**
   * 행들 추출
   */
  private extractRows(node: HWPXNode, context?: ProcessorContext, colgroup?: IColgroup[]): ITr[] {
    const trList: ITr[] = []
    
    const rows = node.children?.filter(child => child.tag === 'tr' || child.tag === 'hp:tr') || []
    
    console.log(`Found ${rows.length} rows in table`)
    
    // rowSpan으로 인한 행별 예상 높이를 미리 계산
    const rowHeightMap = this.calculateRowHeights(rows)
    
    // colgroup을 context에 추가
    const rowContext = {
      ...context,
      colgroup
    } as ProcessorContext & { colgroup?: IColgroup[] }
    
    for (let i = 0; i < rows.length; i++) {
      const tr = this.processRow(rows[i], rowContext, i, rowHeightMap.get(i))
      if (tr) {
        trList.push(tr)
      }
    }

    return trList
  }
  
  /**
   * rowSpan을 고려한 행별 높이 계산
   */
  private calculateRowHeights(rows: HWPXNode[]): Map<number, number> {
    const heightMap = new Map<number, number>()
    const rowSpanInfo: Array<{ startRow: number, span: number, totalHeight: number }> = []
    
    // 먼저 rowSpan 정보 수집
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].children?.filter(child => child.tag === 'tc' || child.tag === 'hp:tc') || []
      
      for (const cell of cells) {
        const cellSpanNode = cell.children?.find(child => child.tag === 'cellSpan')
        const rowSpan = parseInt(cellSpanNode?.attributes?.rowSpan || '1')
        
        if (rowSpan > 1) {
          const cellSzNode = cell.children?.find(child => child.tag === 'cellSz')
          if (cellSzNode && cellSzNode.attributes?.height) {
            const totalHeight = this.hwpxToPixel(cellSzNode.attributes.height)
            rowSpanInfo.push({ startRow: i, span: rowSpan, totalHeight })
          }
        }
      }
    }
    
    // rowSpan 정보를 기반으로 행별 높이 설정
    for (const info of rowSpanInfo) {
      // HWPX의 패턴: 첫 행은 작고, 중간 행들은 같고, 마지막 행은 큼
      const heights = this.distributeHeightForRowSpan(info.totalHeight, info.span)
      for (let j = 0; j < info.span; j++) {
        const rowIdx = info.startRow + j
        if (!heightMap.has(rowIdx) || heightMap.get(rowIdx)! < heights[j]) {
          heightMap.set(rowIdx, heights[j])
        }
      }
    }
    
    return heightMap
  }
  
  /**
   * rowSpan에 따른 범용적인 높이 분배
   */
  private distributeHeightForRowSpan(totalHeight: number, span: number): number[] {
    // 균등 분배
    const avgHeight = Math.floor(totalHeight / span)
    const heights = Array(span).fill(avgHeight)
    
    // 반올림 오차 보정 - 마지막 행에 차이 추가
    const remainder = totalHeight - (avgHeight * span)
    if (remainder > 0) {
      heights[heights.length - 1] += remainder
    }
    
    return heights
  }

  /**
   * 행 처리
   */
  private processRow(node: HWPXNode, context?: ProcessorContext, rowIndex?: number, suggestedHeight?: number): ITr | null {
    const tdList: ITd[] = []
    
    const cells = node.children?.filter(child => child.tag === 'tc' || child.tag === 'hp:tc') || []
    
    console.log(`Processing row with ${cells.length} cells`)
    
    // 모든 셀 처리 (병합된 셀도 포함)
    let cellIndex = 0
    
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]
      const td = this.processCell(cell, context, cellIndex)
      if (td) {
        tdList.push(td)
        // colspan만큼 cellIndex 증가
        cellIndex += td.colspan
      }
    }

    if (tdList.length === 0) {
      return null
    }

    // 행 높이 결정 - sz 노드가 있으면 사용, 없으면 셀 높이에서 추론
    let rowHeight = 40 // 기본값
    
    // suggestedHeight가 있으면 우선 사용 (rowSpan 계산된 높이)
    if (suggestedHeight !== undefined && suggestedHeight > 0) {
      rowHeight = suggestedHeight
      console.log(`Row ${rowIndex}: using suggested height from rowSpan calculation: ${rowHeight}px`)
    } else {
      const szNode = node.children?.find(child => child.tag === 'sz')
      if (szNode && szNode.attributes?.height) {
        rowHeight = this.hwpxToPixel(szNode.attributes.height)
        console.log('Row height from sz:', szNode.attributes.height, '→', rowHeight, 'px')
      } else {
      // tr에 sz 노드가 없으면 셀의 cellSz에서 추론
      // 전략: rowspan=1인 셀들 중에서 가장 일관된 높이값을 찾음
      const cellHeights: number[] = []
      let hasRowSpanCell = false
      
      for (const cell of cells) {
        // cellSpan 노드에서 rowSpan 값 확인
        const cellSpanNode = cell.children?.find(child => child.tag === 'cellSpan')
        const rowSpan = parseInt(cellSpanNode?.attributes?.rowSpan || '1')
        
        if (rowSpan > 1) {
          hasRowSpanCell = true
          continue // rowspan > 1인 셀은 여러 행에 걸치므로 제외
        }
        
        // rowspan=1인 셀의 높이만 수집
        const cellSzNode = cell.children?.find(child => child.tag === 'cellSz')
        if (cellSzNode && cellSzNode.attributes?.height) {
          const cellHeight = this.hwpxToPixel(cellSzNode.attributes.height)
          cellHeights.push(cellHeight)
        }
      }
      
      if (cellHeights.length > 0) {
        // 모든 rowspan=1 셀들이 동일한 높이를 가져야 함
        // 첫 번째 rowspan=1 셀의 높이를 사용 (일반적으로 모두 동일)
        rowHeight = cellHeights[0]
        
        // 디버깅: 모든 셀 높이가 동일한지 확인
        const allSameHeight = cellHeights.every(h => h === rowHeight)
        if (!allSameHeight) {
          console.warn('Warning: Cells in the same row have different heights:', cellHeights)
          // 다른 높이가 있으면 가장 작은 값 사용 (안전한 선택)
          rowHeight = Math.min(...cellHeights)
        }
        
        console.log(`Row height inferred from ${cellHeights.length} cells: ${rowHeight}px (HWPX values: ${cellHeights.map(h => Math.round(h * 7200 / 96)).join(', ')})`)
      } else if (hasRowSpanCell) {
        // rowspan=1인 셀이 없고 rowspan > 1인 셀만 있는 경우
        // 병합된 셀들에서도 높이 정보를 가져와야 함
        const mergedCellHeights: number[] = []
        for (const cell of cells) {
          const cellSzNode = cell.children?.find(child => child.tag === 'cellSz')
          if (cellSzNode && cellSzNode.attributes?.height) {
            const cellSpanNode = cell.children?.find(child => child.tag === 'cellSpan')
            const rowSpan = parseInt(cellSpanNode?.attributes?.rowSpan || '1')
            if (rowSpan > 1) {
              // rowspan으로 나눈 평균 높이 사용
              const avgHeight = this.hwpxToPixel(cellSzNode.attributes.height) / rowSpan
              mergedCellHeights.push(avgHeight)
            }
          }
        }
        
        if (mergedCellHeights.length > 0) {
          // 병합된 셀들의 평균 높이 사용
          rowHeight = Math.round(mergedCellHeights[0])
          console.log('Row height from merged cells (divided by rowspan):', rowHeight, 'px')
        } else {
          console.log('Row contains only merged cells, using default height:', rowHeight, 'px')
        }
      } else {
        console.log('No cell heights found, using default row height:', rowHeight, 'px')
      }
      }
    }

    const tr: ITr = {
      tdList,
      height: rowHeight,
      minHeight: rowHeight  // Canvas Editor는 tr.minHeight를 사용!
    }

    // 디버깅: rowspan이 있는 셀과 행 높이 확인
    const hasRowSpanCell = tdList.some(td => td.rowspan > 1)
    if (hasRowSpanCell || tdList.length > 5) { // 많은 셀이 있는 행도 로그
      const rowSpanInfo = tdList.map(td => `rs=${td.rowspan}`).join(', ')
      console.log(`Row: height=${tr.height}px, cells=[${rowSpanInfo}]`)
    }

    // 행 ID 생성
    if (context?.generateId) {
      (tr as any).trId = context.generateId()
    }

    return tr
  }

  /**
   * 셀 처리
   */
  private processCell(node: HWPXNode, context?: ProcessorContext, cellIndex?: number): ITd | null {
    const td: ITd = {
      colspan: 1,
      rowspan: 1,
      value: []
    }

    // 셀 ID 생성
    if (context?.generateId) {
      (td as any).tdId = context.generateId()
    }

    // cellSz 노드에서 셀 크기 추출
    const cellSz = node.children?.find(child => child.tag === 'cellSz')
    let cellWidth: number | undefined
    let cellHeight: number | undefined
    
    if (cellSz && cellSz.attributes) {
      if (cellSz.attributes.width) {
        cellWidth = this.hwpxToPixel(cellSz.attributes.width)
        console.log(`Cell ${cellIndex} width from cellSz:`, cellSz.attributes.width, '→', cellWidth, 'px')
      }
      if (cellSz.attributes.height) {
        cellHeight = this.hwpxToPixel(cellSz.attributes.height)
        console.log(`Cell ${cellIndex} height from cellSz:`, cellSz.attributes.height, '→', cellHeight, 'px')
      }
    }

    // cellSpan 노드에서 colspan/rowspan 추출
    const cellSpan = node.children?.find(child => child.tag === 'cellSpan')
    if (cellSpan && cellSpan.attributes) {
      const colSpan = cellSpan.attributes.colSpan || cellSpan.attributes.colspan
      const rowSpan = cellSpan.attributes.rowSpan || cellSpan.attributes.rowspan
      
      if (colSpan) {
        td.colspan = parseInt(colSpan)
      }
      if (rowSpan) {
        td.rowspan = parseInt(rowSpan)
      }
      
      console.log('Cell span:', { colspan: td.colspan, rowspan: td.rowspan })
    } else {
      // cellSpan이 없으면 attributes에서 직접 확인
      const colspan = this.getAttribute(node, 'colspan')
      if (colspan) {
        td.colspan = parseInt(colspan)
      }

      const rowspan = this.getAttribute(node, 'rowspan')
      if (rowspan) {
        td.rowspan = parseInt(rowspan)
      }
    }

    // 셀 배경색 추출 (cellFill 노드에서)
    const cellFill = node.children?.find(child => child.tag === 'cellFill')
    if (cellFill && cellFill.children) {
      const fillBrush = cellFill.children.find(child => child.tag === 'fillBrush')
      if (fillBrush && fillBrush.children) {
        const winBrush = fillBrush.children.find(child => child.tag === 'winBrush')
        if (winBrush && winBrush.attributes?.faceColor) {
          td.backgroundColor = this.convertColor(winBrush.attributes.faceColor)
          console.log('Cell background color:', td.backgroundColor)
        }
      }
    }

    // 셀 내용 처리
    const cellContent = this.extractCellContent(node, context)
    td.value = cellContent // 항상 설정 (빈 배열이어도)

    // 셀 너비 설정 - cellSz에서 추출한 값 사용
    if (cellWidth !== undefined) {
      td.width = cellWidth
      console.log(`Cell ${cellIndex} width: ${cellWidth}px`)
    }
    
    // 셀 높이 설정 - cellSz에서 추출한 값 사용
    if (cellHeight !== undefined) {
      td.height = cellHeight
      console.log(`Cell ${cellIndex} height: ${cellHeight}px`)
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
  private extractCellContent(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []
    
    // 테이블 셀 컨텍스트 설정 - 셀 내부임을 명시
    const tableCellContext: ProcessorContext = {
      ...context,
      inTable: true,
      isInsideTableCell: true  // 테이블 셀 내부 처리 중임을 표시
    }

    // 셀 내의 모든 자식 노드 처리
    if (node.children?.length) {
      // subList 노드 찾기 (셀의 실제 내용을 담고 있음)
      const subList = node.children.find(child => child.tag === 'subList')
      
      if (subList && subList.children && this.processorManager) {
        console.log('Processing cell subList with', subList.children.length, 'children')
        // ProcessorManager를 통해 subList의 자식 노드들 처리
        for (const child of subList.children) {
          const childElements = this.processorManager.process(child, tableCellContext)
          elements.push(...childElements)
        }
      } else {
        // ProcessorManager가 없거나 subList가 없으면 텍스트만 추출
        const text = this.extractText(node)
        console.log('Fallback text extraction:', text)
        if (text) {
          const textElements = text.split('').map(char => ({
            type: ElementType.TEXT,
            value: char
          }))
          elements.push(...textElements)
        }
      }
    }

    // 빈 셀이면 최소한 빈 텍스트 요소 추가
    if (elements.length === 0) {
      const emptyElement: IElement = {
        type: ElementType.TEXT,
        value: ''
      }
      
      // 컨텍스트에서 스타일 정보가 있으면 사용
      // 기본 size는 설정하지 않음 - Canvas Editor가 자동으로 처리하도록
      if (context?.currentStyle?.size) {
        emptyElement.size = context.currentStyle.size
      }
      
      elements.push(emptyElement)
    }

    console.log('Cell content elements:', elements.length)
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