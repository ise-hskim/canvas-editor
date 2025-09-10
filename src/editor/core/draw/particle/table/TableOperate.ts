import { ElementType, IElement, TableBorder, VerticalAlign } from '../../../..'
import { ZERO } from '../../../../dataset/constant/Common'
import { TABLE_CONTEXT_ATTR } from '../../../../dataset/constant/Element'
import { TdBorder, TdSlash } from '../../../../dataset/enum/table/Table'
import { DeepRequired } from '../../../../interface/Common'
import { IEditorOption } from '../../../../interface/Editor'
import { IColgroup } from '../../../../interface/table/Colgroup'
import { ITd } from '../../../../interface/table/Td'
import { ITr } from '../../../../interface/table/Tr'
import { cloneProperty, getUUID } from '../../../../utils'
import {
  formatElementContext,
  formatElementList
} from '../../../../utils/element'
import { Position } from '../../../position/Position'
import { RangeManager } from '../../../range/RangeManager'
import { Draw } from '../../Draw'
import { TableParticle } from './TableParticle'
import { TableTool } from './TableTool'

export class TableOperate {
  private draw: Draw
  private range: RangeManager
  private position: Position
  private tableTool: TableTool
  private tableParticle: TableParticle
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.position = draw.getPosition()
    this.tableTool = draw.getTableTool()
    this.tableParticle = draw.getTableParticle()
    this.options = draw.getOptions()
  }

  public insertTable(row: number, col: number) {
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const { defaultTrMinHeight } = this.options.table
    const elementList = this.draw.getElementList()
    let offsetX = 0
    if (elementList[startIndex]?.listId) {
      const positionList = this.position.getPositionList()
      const { rowIndex } = positionList[startIndex]
      const rowList = this.draw.getRowList()
      const row = rowList[rowIndex]
      offsetX = row?.offsetX || 0
    }
    const innerWidth = this.draw.getContextInnerWidth() - offsetX
    // colgroup
    const colgroup: IColgroup[] = []
    const colWidth = innerWidth / col
    for (let c = 0; c < col; c++) {
      colgroup.push({
        width: colWidth
      })
    }
    // trlist
    const trList: ITr[] = []
    for (let r = 0; r < row; r++) {
      const tdList: ITd[] = []
      const tr: ITr = {
        height: defaultTrMinHeight,
        tdList
      }
      for (let c = 0; c < col; c++) {
        tdList.push({
          colspan: 1,
          rowspan: 1,
          value: []
        })
      }
      trList.push(tr)
    }
    const element: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup,
      trList
    }
    // element 포매팅
    formatElementList([element], {
      editorOptions: this.options
    })
    formatElementContext(elementList, [element], startIndex, {
      editorOptions: this.options
    })
    const curIndex = startIndex + 1
    this.draw.spliceElementList(
      elementList,
      curIndex,
      startIndex === endIndex ? 0 : endIndex - startIndex,
      [element]
    )
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex, isSetCursor: false })
  }

  public insertTableTopRow() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, trIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]
    // 이전 과 행 항목에 행 수 증가
    if (curTr.tdList.length < element.colgroup!.length) {
      const curTrNo = curTr.tdList[0].rowIndex!
      for (let t = 0; t < trIndex!; t++) {
        const tr = curTrList[t]
        for (let d = 0; d < tr.tdList.length; d++) {
          const td = tr.tdList[d]
          if (td.rowspan > 1 && td.rowIndex! + td.rowspan >= curTrNo + 1) {
            td.rowspan += 1
          }
        }
      }
    }
    // 현재 행 추가
    const newTrId = getUUID()
    const newTr: ITr = {
      height: curTr.height,
      id: newTrId,
      tdList: []
    }
    for (let t = 0; t < curTr.tdList.length; t++) {
      const curTd = curTr.tdList[t]
      const newTdId = getUUID()
      newTr.tdList.push({
        id: newTdId,
        rowspan: 1,
        colspan: curTd.colspan,
        value: [
          {
            value: ZERO,
            size: 16,
            tableId,
            trId: newTrId,
            tdId: newTdId
          }
        ]
      })
    }
    curTrList.splice(trIndex!, 0, newTr)
    // 컨텍스트 재설정
    this.position.setPositionContext({
      isTable: true,
      index,
      trIndex,
      tdIndex: 0,
      tdId: newTr.tdList[0].id,
      trId: newTr.id,
      tableId
    })
    this.range.setRange(0, 0)
    // 재렌더링
    this.draw.render({ curIndex: 0 })
    this.tableTool.render()
  }

  public insertTableBottomRow() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, trIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]
    const anchorTr =
      curTrList.length - 1 === trIndex ? curTr : curTrList[trIndex! + 1]
    // 이전/현재 행의 행 늘리기에 행 수 증가
    if (anchorTr.tdList.length < element.colgroup!.length) {
      const curTrNo = anchorTr.tdList[0].rowIndex!
      for (let t = 0; t < trIndex! + 1; t++) {
        const tr = curTrList[t]
        for (let d = 0; d < tr.tdList.length; d++) {
          const td = tr.tdList[d]
          if (td.rowspan > 1 && td.rowIndex! + td.rowspan >= curTrNo + 1) {
            td.rowspan += 1
          }
        }
      }
    }
    // 현재 행 추가
    const newTrId = getUUID()
    const newTr: ITr = {
      height: anchorTr.height,
      id: newTrId,
      tdList: []
    }
    for (let t = 0; t < anchorTr.tdList.length; t++) {
      const curTd = anchorTr.tdList[t]
      const newTdId = getUUID()
      newTr.tdList.push({
        id: newTdId,
        rowspan: 1,
        colspan: curTd.colspan,
        value: [
          {
            value: ZERO,
            size: 16,
            tableId,
            trId: newTrId,
            tdId: newTdId
          }
        ]
      })
    }
    curTrList.splice(trIndex! + 1, 0, newTr)
    // 컨텍스트 재설정
    this.position.setPositionContext({
      isTable: true,
      index,
      trIndex: trIndex! + 1,
      tdIndex: 0,
      tdId: newTr.tdList[0].id,
      trId: newTr.id,
      tableId: element.id
    })
    this.range.setRange(0, 0)
    // 재렌더링
    this.draw.render({ curIndex: 0 })
  }

  public adjustColWidth(element: IElement) {
    if (element.type !== ElementType.TABLE) return
    const { defaultColMinWidth } = this.options.table
    const colgroup = element.colgroup!
    const colgroupWidth = colgroup.reduce((pre, cur) => pre + cur.width, 0)
    const width = this.draw.getOriginalInnerWidth()
    if (colgroupWidth > width) {
      // 최소 넓이보다 큰 열 필터링 (넓이를 줄일 수 있는 열)
      const greaterMinWidthCol = colgroup.filter(
        col => col.width > defaultColMinWidth
      )
      // 여분 넓이 균등 분배
      const adjustWidth = (colgroupWidth - width) / greaterMinWidthCol.length
      for (let g = 0; g < colgroup.length; g++) {
        const group = colgroup[g]
        // 최소 넓이보다 작은 열은 처리하지 않음
        if (group.width - adjustWidth >= defaultColMinWidth) {
          group.width -= adjustWidth
        }
      }
    }
  }

  public insertTableLeftCol() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTdIndex = tdIndex!
    // 열 추가
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      const tdId = getUUID()
      tr.tdList.splice(curTdIndex, 0, {
        id: tdId,
        rowspan: 1,
        colspan: 1,
        value: [
          {
            value: ZERO,
            size: 16,
            tableId,
            trId: tr.id,
            tdId
          }
        ]
      })
    }
    // 너비 재계산
    const { defaultColMinWidth } = this.options.table
    const colgroup = element.colgroup!
    colgroup.splice(curTdIndex, 0, {
      width: defaultColMinWidth
    })
    this.adjustColWidth(element)
    // 컨텍스트 재설정
    this.position.setPositionContext({
      isTable: true,
      index,
      trIndex: 0,
      tdIndex: curTdIndex,
      tdId: curTrList[0].tdList[curTdIndex].id,
      trId: curTrList[0].id,
      tableId
    })
    this.range.setRange(0, 0)
    // 재렌더링
    this.draw.render({ curIndex: 0 })
    this.tableTool.render()
  }

  public insertTableRightCol() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTdIndex = tdIndex! + 1
    // 열 추가
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      const tdId = getUUID()
      tr.tdList.splice(curTdIndex, 0, {
        id: tdId,
        rowspan: 1,
        colspan: 1,
        value: [
          {
            value: ZERO,
            size: 16,
            tableId,
            trId: tr.id,
            tdId
          }
        ]
      })
    }
    // 너비 재계산
    const { defaultColMinWidth } = this.options.table
    const colgroup = element.colgroup!
    colgroup.splice(curTdIndex, 0, {
      width: defaultColMinWidth
    })
    this.adjustColWidth(element)
    // 컨텍스트 재설정
    this.position.setPositionContext({
      isTable: true,
      index,
      trIndex: 0,
      tdIndex: curTdIndex,
      tdId: curTrList[0].tdList[curTdIndex].id,
      trId: curTrList[0].id,
      tableId: element.id
    })
    this.range.setRange(0, 0)
    // 재렌더링
    this.draw.render({ curIndex: 0 })
  }

  public deleteTableRow() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, trIndex, tdIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const trList = element.trList!
    const curTr = trList[trIndex!]
    const curTdRowIndex = curTr.tdList[tdIndex!].rowIndex!
    // 마지막 행인 경우 전체 테이블 삭제 (분할 테이블인 경우 정상 로직으로 처리)
    if (trList.length <= 1 && element.pagingIndex === 0) {
      this.deleteTable()
      return
    }
    // 이전 행 rowspan 축소
    for (let r = 0; r < curTdRowIndex; r++) {
      const tr = trList[r]
      const tdList = tr.tdList
      for (let d = 0; d < tdList.length; d++) {
        const td = tdList[d]
        if (td.rowIndex! + td.rowspan > curTdRowIndex) {
          td.rowspan--
        }
      }
    }
    // 행 연결 보정
    for (let d = 0; d < curTr.tdList.length; d++) {
      const td = curTr.tdList[d]
      if (td.rowspan > 1) {
        const tdId = getUUID()
        const nextTr = trList[trIndex! + 1]
        nextTr.tdList.splice(d, 0, {
          id: tdId,
          rowspan: td.rowspan - 1,
          colspan: td.colspan,
          value: [
            {
              value: ZERO,
              size: 16,
              tableId: element.id,
              trId: nextTr.id,
              tdId
            }
          ]
        })
      }
    }
    // 현재 행 삭제
    trList.splice(trIndex!, 1)
    // 컨텍스트 재설정
    this.position.setPositionContext({
      isTable: false
    })
    this.range.clearRange()
    // 재렌더링
    this.draw.render({
      curIndex: positionContext.index
    })
    this.tableTool.dispose()
  }

  public deleteTableCol() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTd = curTrList[trIndex!].tdList[tdIndex!]
    const curColIndex = curTd.colIndex!
    // 마지막 열인 경우 전체 테이블 삭제
    const moreTdTr = curTrList.find(tr => tr.tdList.length > 1)
    if (!moreTdTr) {
      this.deleteTable()
      return
    }
    // colspan 축소 또는 현재 열과 겹치는 셀 삭제
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        if (
          td.colIndex! <= curColIndex &&
          td.colIndex! + td.colspan > curColIndex
        ) {
          if (td.colspan > 1) {
            td.colspan--
          } else {
            tr.tdList.splice(d, 1)
          }
        }
      }
    }
    element.colgroup?.splice(curColIndex, 1)
    // 컨텍스트 재설정
    this.position.setPositionContext({
      isTable: false
    })
    this.range.setRange(0, 0)
    // 재렌더링
    this.draw.render({
      curIndex: positionContext.index
    })
    this.tableTool.dispose()
  }

  public deleteTable() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const originalElementList = this.draw.getOriginalElementList()
    const tableElement = originalElementList[positionContext.index!]
    // 삭제할 테이블 수량(분할 테이블) 및 위치
    let deleteCount = 1
    let deleteStartIndex = positionContext.index!
    if (tableElement.pagingId) {
      // 삭제 시작 인덱스 위치
      deleteStartIndex = positionContext.index! - tableElement.pagingIndex!
      // 삭제할 테이블 수량 계산
      for (let i = deleteStartIndex + 1; i < originalElementList.length; i++) {
        if (originalElementList[i].pagingId === tableElement.pagingId) {
          deleteCount++
        } else {
          break
        }
      }
    }
    // 삭제
    originalElementList.splice(deleteStartIndex, deleteCount)
    const curIndex = deleteStartIndex - 1
    this.position.setPositionContext({
      isTable: false,
      index: curIndex
    })
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
    this.tableTool.dispose()
  }

  public mergeTableCell() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const {
      isCrossRowCol,
      startTdIndex,
      endTdIndex,
      startTrIndex,
      endTrIndex
    } = this.range.getRange()
    if (!isCrossRowCol) return
    const { index } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    let startTd = curTrList[startTrIndex!].tdList[startTdIndex!]
    let endTd = curTrList[endTrIndex!].tdList[endTdIndex!]
    // 시작 위치 교체
    if (startTd.x! > endTd.x! || startTd.y! > endTd.y!) {
      // prettier-ignore
      [startTd, endTd] = [endTd, startTd]
    }
    const startColIndex = startTd.colIndex!
    const endColIndex = endTd.colIndex! + (endTd.colspan - 1)
    const startRowIndex = startTd.rowIndex!
    const endRowIndex = endTd.rowIndex! + (endTd.rowspan - 1)
    // 선택 영역 행열
    const rowCol: ITd[][] = []
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      const tdList: ITd[] = []
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        const tdColIndex = td.colIndex!
        const tdRowIndex = td.rowIndex!
        if (
          tdColIndex >= startColIndex &&
          tdColIndex <= endColIndex &&
          tdRowIndex >= startRowIndex &&
          tdRowIndex <= endRowIndex
        ) {
          tdList.push(td)
        }
      }
      if (tdList.length) {
        rowCol.push(tdList)
      }
    }
    if (!rowCol.length) return
    // 사각형인지 여부
    const lastRow = rowCol[rowCol.length - 1]
    const leftTop = rowCol[0][0]
    const rightBottom = lastRow[lastRow.length - 1]
    const startX = leftTop.x!
    const startY = leftTop.y!
    const endX = rightBottom.x! + rightBottom.width!
    const endY = rightBottom.y! + rightBottom.height!
    for (let t = 0; t < rowCol.length; t++) {
      const tr = rowCol[t]
      for (let d = 0; d < tr.length; d++) {
        const td = tr[d]
        const tdStartX = td.x!
        const tdStartY = td.y!
        const tdEndX = tdStartX + td.width!
        const tdEndY = tdStartY + td.height!
        // 부적합 항목 존재
        if (
          startX > tdStartX ||
          startY > tdStartY ||
          endX < tdEndX ||
          endY < tdEndY
        ) {
          return
        }
      }
    }
    // 셀 병합
    const mergeTdIdList: string[] = []
    const anchorTd = rowCol[0][0]
    const anchorElement = anchorTd.value[0]
    for (let t = 0; t < rowCol.length; t++) {
      const tr = rowCol[t]
      for (let d = 0; d < tr.length; d++) {
        const td = tr[d]
        const isAnchorTd = t === 0 && d === 0
        // 삭제할 셀 ID 캐시 및 셀 컨텐츠 병합
        if (!isAnchorTd) {
          mergeTdIdList.push(td.id!)
          // 병합될 셀에 컨텐츠가 없을 때 개행 문자 무시
          const startTdValueIndex = td.value.length > 1 ? 0 : 1
          // 테이블 속성 복사 후 추가
          for (let d = startTdValueIndex; d < td.value.length; d++) {
            const tdElement = td.value[d]
            cloneProperty<IElement>(
              TABLE_CONTEXT_ATTR,
              anchorElement,
              tdElement
            )
            anchorTd.value.push(tdElement)
          }
        }
        // 열 병합
        if (t === 0 && d !== 0) {
          anchorTd.colspan += td.colspan
        }
        // 행 병합
        if (t !== 0) {
          if (anchorTd.colIndex === td.colIndex) {
            anchorTd.rowspan += td.rowspan
          }
        }
      }
    }
    // 여분 셀 제거
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      let d = 0
      while (d < tr.tdList.length) {
        const td = tr.tdList[d]
        if (mergeTdIdList.includes(td.id!)) {
          tr.tdList.splice(d, 1)
          d--
        }
        d++
      }
    }
    // 컨텍스트 정보 설정
    this.position.setPositionContext({
      ...positionContext,
      trIndex: anchorTd.trIndex,
      tdIndex: anchorTd.tdIndex
    })
    const curIndex = anchorTd.value.length - 1
    this.range.setRange(curIndex, curIndex)
    // 재렌더링
    this.draw.render()
    this.tableTool.render()
  }

  public cancelMergeTableCell() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]!
    const curTd = curTr.tdList[tdIndex!]
    if (curTd.rowspan === 1 && curTd.colspan === 1) return
    const colspan = curTd.colspan
    // 열 연결 설정
    if (curTd.colspan > 1) {
      for (let c = 1; c < curTd.colspan; c++) {
        const tdId = getUUID()
        curTr.tdList.splice(tdIndex! + c, 0, {
          id: tdId,
          rowspan: 1,
          colspan: 1,
          value: [
            {
              value: ZERO,
              size: 16,
              tableId: element.id,
              trId: curTr.id,
              tdId
            }
          ]
        })
      }
      curTd.colspan = 1
    }
    // 행 연결 설정
    if (curTd.rowspan > 1) {
      for (let r = 1; r < curTd.rowspan; r++) {
        const tr = curTrList[trIndex! + r]
        for (let c = 0; c < colspan; c++) {
          const tdId = getUUID()
          tr.tdList.splice(curTd.colIndex!, 0, {
            id: tdId,
            rowspan: 1,
            colspan: 1,
            value: [
              {
                value: ZERO,
                size: 16,
                tableId: element.id,
                trId: tr.id,
                tdId
              }
            ]
          })
        }
      }
      curTd.rowspan = 1
    }
    // 재렌더링
    const curIndex = curTd.value.length - 1
    this.range.setRange(curIndex, curIndex)
    this.draw.render()
    this.tableTool.render()
  }

  public splitVerticalTableCell() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    // 임시로 행열 연결 선택 무시
    const range = this.range.getRange()
    if (range.isCrossRowCol) return
    const { index, tdIndex, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]!
    const curTd = curTr.tdList[tdIndex!]
    // 열 속성 추가
    element.colgroup!.splice(tdIndex! + 1, 0, {
      width: this.options.table.defaultColMinWidth
    })
    // 같은 행에 td 추가, 다른 행에 colspan 수 증가
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      let d = 0
      while (d < tr.tdList.length) {
        const td = tr.tdList[d]
        // 다른 행: 교차점이 있을 때 colspan 수 증가
        if (td.rowIndex !== curTd.rowIndex) {
          if (
            td.colIndex! <= curTd.colIndex! &&
            td.colIndex! + td.colspan > curTd.colIndex!
          ) {
            td.colspan++
          }
        } else {
          // 현재 셀: 오른쪽에 td 삽입
          if (td.id === curTd.id) {
            const tdId = getUUID()
            curTr.tdList.splice(d + curTd.colspan, 0, {
              id: tdId,
              rowspan: curTd.rowspan,
              colspan: 1,
              value: [
                {
                  value: ZERO,
                  size: 16,
                  tableId: element.id,
                  trId: tr.id,
                  tdId
                }
              ]
            })
            d++
          }
        }
        d++
      }
    }
    // 재렌더링
    this.draw.render()
    this.tableTool.render()
  }

  public splitHorizontalTableCell() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    // 임시로 행열 연결 선택 무시
    const range = this.range.getRange()
    if (range.isCrossRowCol) return
    const { index, tdIndex, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]!
    const curTd = curTr.tdList[tdIndex!]
    // 추가된 행은 루프에서 제외
    let appendTrIndex = -1
    // 교차 행에 rowspan 증가, 현재 셀 아래에 행 tr 추가
    let t = 0
    while (t < curTrList.length) {
      if (t === appendTrIndex) {
        t++
        continue
      }
      const tr = curTrList[t]
      let d = 0
      while (d < tr.tdList.length) {
        const td = tr.tdList[d]
        if (td.id === curTd.id) {
          const trId = getUUID()
          const tdId = getUUID()
          curTrList.splice(t + curTd.rowspan, 0, {
            id: trId,
            height: this.options.table.defaultTrMinHeight,
            tdList: [
              {
                id: tdId,
                rowspan: 1,
                colspan: curTd.colspan,
                value: [
                  {
                    value: ZERO,
                    size: 16,
                    tableId: element.id,
                    trId,
                    tdId
                  }
                ]
              }
            ]
          })
          appendTrIndex = t + curTd.rowspan
        } else if (
          td.rowIndex! >= curTd.rowIndex! &&
          td.rowIndex! < curTd.rowIndex! + curTd.rowspan &&
          td.rowIndex! + td.rowspan >= curTd.rowIndex! + curTd.rowspan
        ) {
          // 1. 루프 td 상단이 현재 td 상단보다 크거나 같고 && 현재 td 하단보다 작음 => 교차점 존재
          // 2. 루프 td 하단이 현재 td 하단보다 크거나 같음
          td.rowspan++
        }
        d++
      }
      t++
    }
    // 재렌더링
    this.draw.render()
    this.tableTool.render()
  }

  public tableTdVerticalAlign(payload: VerticalAlign) {
    const rowCol = this.tableParticle.getRangeRowCol()
    if (!rowCol) return
    for (let r = 0; r < rowCol.length; r++) {
      const row = rowCol[r]
      for (let c = 0; c < row.length; c++) {
        const td = row[c]
        if (
          !td ||
          td.verticalAlign === payload ||
          (!td.verticalAlign && payload === VerticalAlign.TOP)
        ) {
          continue
        }
        // 수직 정렬 방식 재설정
        td.verticalAlign = payload
      }
    }
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex
    })
  }

  public tableBorderType(payload: TableBorder) {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    if (
      (!element.borderType && payload === TableBorder.ALL) ||
      element.borderType === payload
    ) {
      return
    }
    element.borderType = payload
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex
    })
  }

  public tableBorderColor(payload: string) {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    if (
      (!element.borderColor &&
        payload === this.options.table.defaultBorderColor) ||
      element.borderColor === payload
    ) {
      return
    }
    element.borderColor = payload
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex,
      isCompute: false
    })
  }

  public tableTdBorderType(payload: TdBorder) {
    const rowCol = this.tableParticle.getRangeRowCol()
    if (!rowCol) return
    const tdList = rowCol.flat()
    // 존재하면 테두리 유형 설정, 없으면 설정 취소
    const isSetBorderType = tdList.some(
      td => !td.borderTypes?.includes(payload)
    )
    tdList.forEach(td => {
      if (!td.borderTypes) {
        td.borderTypes = []
      }
      const borderTypeIndex = td.borderTypes.findIndex(type => type === payload)
      if (isSetBorderType) {
        if (!~borderTypeIndex) {
          td.borderTypes.push(payload)
        }
      } else {
        if (~borderTypeIndex) {
          td.borderTypes.splice(borderTypeIndex, 1)
        }
      }
      // 테두리 설정이 없을 때 필드 삭제
      if (!td.borderTypes.length) {
        delete td.borderTypes
      }
    })
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex
    })
  }

  public tableTdSlashType(payload: TdSlash) {
    const rowCol = this.tableParticle.getRangeRowCol()
    if (!rowCol) return
    const tdList = rowCol.flat()
    // 존재하면 셀 대각선 유형 설정, 없으면 설정 취소
    const isSetTdSlashType = tdList.some(
      td => !td.slashTypes?.includes(payload)
    )
    tdList.forEach(td => {
      if (!td.slashTypes) {
        td.slashTypes = []
      }
      const slashTypeIndex = td.slashTypes.findIndex(type => type === payload)
      if (isSetTdSlashType) {
        if (!~slashTypeIndex) {
          td.slashTypes.push(payload)
        }
      } else {
        if (~slashTypeIndex) {
          td.slashTypes.splice(slashTypeIndex, 1)
        }
      }
      // 대각선 설정이 없을 때 필드 삭제
      if (!td.slashTypes.length) {
        delete td.slashTypes
      }
    })
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex
    })
  }

  public tableTdBackgroundColor(payload: string) {
    const rowCol = this.tableParticle.getRangeRowCol()
    if (!rowCol) return
    for (let r = 0; r < rowCol.length; r++) {
      const row = rowCol[r]
      for (let c = 0; c < row.length; c++) {
        const col = row[c]
        col.backgroundColor = payload
      }
    }
    const { endIndex } = this.range.getRange()
    this.range.setRange(endIndex, endIndex)
    this.draw.render({
      isCompute: false
    })
  }

  public tableSelectAll() {
    const positionContext = this.position.getPositionContext()
    const { index, tableId, isTable } = positionContext
    if (!isTable || !tableId) return
    const { startIndex, endIndex } = this.range.getRange()
    const originalElementList = this.draw.getOriginalElementList()
    const trList = originalElementList[index!].trList!
    // 마지막 셀 위치
    const endTrIndex = trList.length - 1
    const endTdIndex = trList[endTrIndex].tdList.length - 1
    this.range.replaceRange({
      startIndex,
      endIndex,
      tableId,
      startTdIndex: 0,
      endTdIndex,
      startTrIndex: 0,
      endTrIndex
    })
    this.draw.render({
      isCompute: false,
      isSubmitHistory: false
    })
  }
}
