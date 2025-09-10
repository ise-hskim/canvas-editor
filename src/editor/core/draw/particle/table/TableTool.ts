import { IElement } from '../../../..'
import { EDITOR_PREFIX } from '../../../../dataset/constant/Editor'
import { TableOrder } from '../../../../dataset/enum/table/TableTool'
import { DeepRequired } from '../../../../interface/Common'
import { IEditorOption } from '../../../../interface/Editor'
import { Position } from '../../../position/Position'
import { RangeManager } from '../../../range/RangeManager'
import { Draw } from '../../Draw'

interface IAnchorMouseDown {
  evt: MouseEvent
  order: TableOrder
  index: number
  element: IElement
}

export class TableTool {
  // 셀의 최소 너비
  private readonly MIN_TD_WIDTH = 20
  // 행열 도구의 테이블 대비 오프셋 값
  private readonly ROW_COL_OFFSET = 18
  // 빠른 행열 추가 도구 너비
  private readonly ROW_COL_QUICK_WIDTH = 16
  // 빠른 행열 추가 도구 오프셋 값
  private readonly ROW_COL_QUICK_OFFSET = 5
  // 빠른 행열 추가 도구의 테이블 대비 위치
  private readonly ROW_COL_QUICK_POSITION =
    this.ROW_COL_OFFSET + (this.ROW_COL_OFFSET - this.ROW_COL_QUICK_WIDTH) / 2
  // 테두리 도구 너비/높이
  private readonly BORDER_VALUE = 4
  // 빠른 선택 도구 오프셋 값
  private readonly TABLE_SELECT_OFFSET = 20

  private draw: Draw
  private canvas: HTMLCanvasElement
  private options: DeepRequired<IEditorOption>
  private position: Position
  private range: RangeManager
  private container: HTMLDivElement
  private toolRowContainer: HTMLDivElement | null
  private toolRowAddBtn: HTMLDivElement | null
  private toolColAddBtn: HTMLDivElement | null
  private toolTableSelectBtn: HTMLDivElement | null
  private toolColContainer: HTMLDivElement | null
  private toolBorderContainer: HTMLDivElement | null
  private anchorLine: HTMLDivElement | null
  private mousedownX: number
  private mousedownY: number

  constructor(draw: Draw) {
    this.draw = draw
    this.canvas = draw.getPage()
    this.options = draw.getOptions()
    this.position = draw.getPosition()
    this.range = draw.getRange()
    this.container = draw.getContainer()
    // x, y축
    this.toolRowContainer = null
    this.toolRowAddBtn = null
    this.toolColAddBtn = null
    this.toolTableSelectBtn = null
    this.toolColContainer = null
    this.toolBorderContainer = null
    this.anchorLine = null
    this.mousedownX = 0
    this.mousedownY = 0
  }

  public dispose() {
    this.toolRowContainer?.remove()
    this.toolRowAddBtn?.remove()
    this.toolColAddBtn?.remove()
    this.toolTableSelectBtn?.remove()
    this.toolColContainer?.remove()
    this.toolBorderContainer?.remove()
    this.toolRowContainer = null
    this.toolRowAddBtn = null
    this.toolColAddBtn = null
    this.toolTableSelectBtn = null
    this.toolColContainer = null
    this.toolBorderContainer = null
  }

  public render() {
    const { isTable, index, trIndex, tdIndex } =
      this.position.getPositionContext()
    if (!isTable) return
    // 이전 도구 소거
    this.dispose()
    const elementList = this.draw.getOriginalElementList()
    const positionList = this.position.getOriginalPositionList()
    const element = elementList[index!]
    // 테이블 도구 설정이 비활성화되고 디자인 모드가 아닐 때 렌더링 안 함
    if (element.tableToolDisabled && !this.draw.isDesignMode()) return
    // 렌더링 필요 데이터
    const { scale } = this.options
    const position = positionList[index!]
    const { colgroup, trList } = element
    const {
      coordinate: { leftTop }
    } = position
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const prePageHeight = this.draw.getPageNo() * (height + pageGap)
    const tableX = leftTop[0]
    const tableY = leftTop[1] + prePageHeight
    const td = element.trList![trIndex!].tdList[tdIndex!]
    const rowIndex = td.rowIndex
    const colIndex = td.colIndex
    const tableHeight = element.height! * scale
    const tableWidth = element.width! * scale
    // 테이블 선택 도구
    const tableSelectBtn = document.createElement('div')
    tableSelectBtn.classList.add(`${EDITOR_PREFIX}-table-tool__select`)
    tableSelectBtn.style.height = `${tableHeight * scale}`
    tableSelectBtn.style.left = `${tableX}px`
    tableSelectBtn.style.top = `${tableY}px`
    tableSelectBtn.style.transform = `translate(-${
      this.TABLE_SELECT_OFFSET * scale
    }px, ${-this.TABLE_SELECT_OFFSET * scale}px)`
    // 빠른 전체 선택
    tableSelectBtn.onclick = () => {
      this.draw.getTableOperate().tableSelectAll()
    }
    this.container.append(tableSelectBtn)
    this.toolTableSelectBtn = tableSelectBtn
    // 행 도구 렌더링
    const rowHeightList = trList!.map(tr => tr.height)
    const rowContainer = document.createElement('div')
    rowContainer.classList.add(`${EDITOR_PREFIX}-table-tool__row`)
    rowContainer.style.transform = `translateX(-${
      this.ROW_COL_OFFSET * scale
    }px)`
    for (let r = 0; r < rowHeightList.length; r++) {
      const rowHeight = rowHeightList[r] * scale
      const rowItem = document.createElement('div')
      rowItem.classList.add(`${EDITOR_PREFIX}-table-tool__row__item`)
      if (r === rowIndex) {
        rowItem.classList.add('active')
      }
      // 빠른 행 선택
      rowItem.onclick = () => {
        const tdList = this.draw
          .getTableParticle()
          .getTdListByRowIndex(trList!, r)
        const firstTd = tdList[0]
        const lastTd = tdList[tdList.length - 1]
        this.position.setPositionContext({
          index,
          isTable: true,
          trIndex: firstTd.trIndex,
          tdIndex: firstTd.tdIndex,
          tableId: element.id
        })
        this.range.setRange(
          0,
          0,
          element.id,
          firstTd.tdIndex,
          lastTd.tdIndex,
          firstTd.trIndex,
          lastTd.trIndex
        )
        this.draw.render({
          curIndex: 0,
          isCompute: false,
          isSubmitHistory: false
        })
        this._setAnchorActive(rowContainer, r)
      }
      const rowItemAnchor = document.createElement('div')
      rowItemAnchor.classList.add(`${EDITOR_PREFIX}-table-tool__anchor`)
      // 행 높이 드래그 시작
      rowItemAnchor.onmousedown = evt => {
        this._mousedown({
          evt,
          element,
          index: r,
          order: TableOrder.ROW
        })
      }
      rowItem.append(rowItemAnchor)
      rowItem.style.height = `${rowHeight}px`
      rowContainer.append(rowItem)
    }
    rowContainer.style.left = `${tableX}px`
    rowContainer.style.top = `${tableY}px`
    this.container.append(rowContainer)
    this.toolRowContainer = rowContainer
    // 행 추가 버튼
    const rowAddBtn = document.createElement('div')
    rowAddBtn.classList.add(`${EDITOR_PREFIX}-table-tool__quick__add`)
    rowAddBtn.style.height = `${tableHeight * scale}`
    rowAddBtn.style.left = `${tableX}px`
    rowAddBtn.style.top = `${tableY + tableHeight}px`
    rowAddBtn.style.transform = `translate(-${
      this.ROW_COL_QUICK_POSITION * scale
    }px, ${this.ROW_COL_QUICK_OFFSET * scale}px)`
    // 빠른 행 추가
    rowAddBtn.onclick = () => {
      this.position.setPositionContext({
        index,
        isTable: true,
        trIndex: trList!.length - 1,
        tdIndex: 0,
        tableId: element.id
      })
      this.draw.getTableOperate().insertTableBottomRow()
    }
    this.container.append(rowAddBtn)
    this.toolRowAddBtn = rowAddBtn
    // 열 도구 렌더링
    const colWidthList = colgroup!.map(col => col.width)
    const colContainer = document.createElement('div')
    colContainer.classList.add(`${EDITOR_PREFIX}-table-tool__col`)
    colContainer.style.transform = `translateY(-${
      this.ROW_COL_OFFSET * scale
    }px)`
    for (let c = 0; c < colWidthList.length; c++) {
      const colWidth = colWidthList[c] * scale
      const colItem = document.createElement('div')
      colItem.classList.add(`${EDITOR_PREFIX}-table-tool__col__item`)
      if (c === colIndex) {
        colItem.classList.add('active')
      }
      // 빠른 열 선택
      colItem.onclick = () => {
        const tdList = this.draw
          .getTableParticle()
          .getTdListByColIndex(trList!, c)
        const firstTd = tdList[0]
        const lastTd = tdList[tdList.length - 1]
        this.position.setPositionContext({
          index,
          isTable: true,
          trIndex: firstTd.trIndex,
          tdIndex: firstTd.tdIndex,
          tableId: element.id
        })
        this.range.setRange(
          0,
          0,
          element.id,
          firstTd.tdIndex,
          lastTd.tdIndex,
          firstTd.trIndex,
          lastTd.trIndex
        )
        this.draw.render({
          curIndex: 0,
          isCompute: false,
          isSubmitHistory: false
        })
        this._setAnchorActive(colContainer, c)
      }
      const colItemAnchor = document.createElement('div')
      colItemAnchor.classList.add(`${EDITOR_PREFIX}-table-tool__anchor`)
      // 열 높이 드래그 시작
      colItemAnchor.onmousedown = evt => {
        this._mousedown({
          evt,
          element,
          index: c,
          order: TableOrder.COL
        })
      }
      colItem.append(colItemAnchor)
      colItem.style.width = `${colWidth}px`
      colContainer.append(colItem)
    }
    colContainer.style.left = `${tableX}px`
    colContainer.style.top = `${tableY}px`
    this.container.append(colContainer)
    this.toolColContainer = colContainer
    // 열 추가 버튼
    const colAddBtn = document.createElement('div')
    colAddBtn.classList.add(`${EDITOR_PREFIX}-table-tool__quick__add`)
    colAddBtn.style.height = `${tableHeight * scale}`
    colAddBtn.style.left = `${tableX + tableWidth}px`
    colAddBtn.style.top = `${tableY}px`
    colAddBtn.style.transform = `translate(${
      this.ROW_COL_QUICK_OFFSET * scale
    }px, -${this.ROW_COL_QUICK_POSITION * scale}px)`
    // 빠른 열 추가
    colAddBtn.onclick = () => {
      this.position.setPositionContext({
        index,
        isTable: true,
        trIndex: 0,
        tdIndex: trList![0].tdList.length - 1 || 0,
        tableId: element.id
      })
      this.draw.getTableOperate().insertTableRightCol()
    }
    this.container.append(colAddBtn)
    this.toolColAddBtn = colAddBtn
    // 셀 테두리 드래그 도구 렌더링
    const borderContainer = document.createElement('div')
    borderContainer.classList.add(`${EDITOR_PREFIX}-table-tool__border`)
    borderContainer.style.height = `${tableHeight}px`
    borderContainer.style.width = `${tableWidth}px`
    borderContainer.style.left = `${tableX}px`
    borderContainer.style.top = `${tableY}px`
    for (let r = 0; r < trList!.length; r++) {
      const tr = trList![r]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        const rowBorder = document.createElement('div')
        rowBorder.classList.add(`${EDITOR_PREFIX}-table-tool__border__row`)
        rowBorder.style.width = `${td.width! * scale}px`
        rowBorder.style.height = `${this.BORDER_VALUE}px`
        rowBorder.style.top = `${
          (td.y! + td.height!) * scale - this.BORDER_VALUE / 2
        }px`
        rowBorder.style.left = `${td.x! * scale}px`
        // 행 너비 드래그 시작
        rowBorder.onmousedown = evt => {
          this._mousedown({
            evt,
            element,
            index: td.rowIndex! + td.rowspan - 1,
            order: TableOrder.ROW
          })
        }
        borderContainer.appendChild(rowBorder)
        const colBorder = document.createElement('div')
        colBorder.classList.add(`${EDITOR_PREFIX}-table-tool__border__col`)
        colBorder.style.width = `${this.BORDER_VALUE}px`
        colBorder.style.height = `${td.height! * scale}px`
        colBorder.style.top = `${td.y! * scale}px`
        colBorder.style.left = `${
          (td.x! + td.width!) * scale - this.BORDER_VALUE / 2
        }px`
        // 열 높이 드래그 시작
        colBorder.onmousedown = evt => {
          this._mousedown({
            evt,
            element,
            index: td.colIndex! + td.colspan - 1,
            order: TableOrder.COL
          })
        }
        borderContainer.appendChild(colBorder)
      }
    }
    this.container.append(borderContainer)
    this.toolBorderContainer = borderContainer
  }

  private _setAnchorActive(container: HTMLDivElement, index: number) {
    const children = container.children
    for (let c = 0; c < children.length; c++) {
      const child = children[c]
      if (c === index) {
        child.classList.add('active')
      } else {
        child.classList.remove('active')
      }
    }
  }

  private _mousedown(payload: IAnchorMouseDown) {
    const { evt, index, order, element } = payload
    this.canvas = this.draw.getPage()
    const { scale } = this.options
    const width = this.draw.getWidth()
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const prePageHeight = this.draw.getPageNo() * (height + pageGap)
    this.mousedownX = evt.x
    this.mousedownY = evt.y
    const target = evt.target as HTMLDivElement
    const canvasRect = this.canvas.getBoundingClientRect()
    // 커서 변경
    const cursor = window.getComputedStyle(target).cursor
    document.body.style.cursor = cursor
    this.canvas.style.cursor = cursor
    // 드래그 선
    let startX = 0
    let startY = 0
    const anchorLine = document.createElement('div')
    anchorLine.classList.add(`${EDITOR_PREFIX}-table-anchor__line`)
    if (order === TableOrder.ROW) {
      anchorLine.classList.add(`${EDITOR_PREFIX}-table-anchor__line__row`)
      anchorLine.style.width = `${width}px`
      startX = 0
      startY = prePageHeight + this.mousedownY - canvasRect.top
    } else {
      anchorLine.classList.add(`${EDITOR_PREFIX}-table-anchor__line__col`)
      anchorLine.style.height = `${height}px`
      startX = this.mousedownX - canvasRect.left
      startY = prePageHeight
    }
    anchorLine.style.left = `${startX}px`
    anchorLine.style.top = `${startY}px`
    this.container.append(anchorLine)
    this.anchorLine = anchorLine
    // 전역 이벤트 추가
    let dx = 0
    let dy = 0
    const mousemoveFn = (evt: MouseEvent) => {
      const movePosition = this._mousemove(evt, order, startX, startY)
      if (movePosition) {
        dx = movePosition.dx
        dy = movePosition.dy
      }
    }
    document.addEventListener('mousemove', mousemoveFn)
    document.addEventListener(
      'mouseup',
      () => {
        let isChangeSize = false
        // 크기 변경
        if (order === TableOrder.ROW) {
          const trList = element.trList!
          const tr = trList[index] || trList[index - 1]
          // 최대 이동 높이 - 위로 이동시 최소 높이 제한을 초과하면 이동량 감소
          const { defaultTrMinHeight } = this.options.table
          if (dy < 0 && tr.height + dy < defaultTrMinHeight) {
            dy = defaultTrMinHeight - tr.height
          }
          if (dy) {
            tr.height += dy
            tr.minHeight = tr.height
            isChangeSize = true
          }
        } else {
          const { colgroup } = element
          if (colgroup && dx) {
            // 너비 분배
            const innerWidth = this.draw.getInnerWidth()
            const curColWidth = colgroup[index].width
            // 최소 이동 거리 계산 - 왼쪽으로 이동시 셀이 최소 너비보다 작아지면 이동량 감소
            if (dx < 0 && curColWidth + dx < this.MIN_TD_WIDTH) {
              dx = this.MIN_TD_WIDTH - curColWidth
            }
            // 최대 이동 거리 계산 - 오른쪽으로 이동시 다음 셀이 최소 너비보다 작아지면 이동량 감소
            const nextColWidth = colgroup[index + 1]?.width
            if (
              dx > 0 &&
              nextColWidth &&
              nextColWidth - dx < this.MIN_TD_WIDTH
            ) {
              dx = nextColWidth - this.MIN_TD_WIDTH
            }
            const moveColWidth = curColWidth + dx
            // 이동 시작, 테이블의 마지막 열만 테이블 너비를 변경하고 다른 경우는 테이블 초과 계산 불필요
            if (index === colgroup.length - 1) {
              let moveTableWidth = 0
              for (let c = 0; c < colgroup.length; c++) {
                const group = colgroup[c]
                // 다음 열에서 오프셋 값 차감
                if (c === index + 1) {
                  moveTableWidth -= dx
                }
                // 현재 열에 오프셋 값 추가
                if (c === index) {
                  moveTableWidth += moveColWidth
                }
                if (c !== index) {
                  moveTableWidth += group.width
                }
              }
              if (moveTableWidth > innerWidth) {
                const tableWidth = element.width!
                dx = innerWidth - tableWidth
              }
            }
            if (dx) {
              // 현재 열 증가, 뒤열 감소
              if (colgroup.length - 1 !== index) {
                colgroup[index + 1].width -= dx / scale
              }
              colgroup[index].width += dx / scale
              isChangeSize = true
            }
          }
        }
        if (isChangeSize) {
          this.draw.render({ isSetCursor: false })
        }
        // 부작용 복원
        anchorLine.remove()
        document.removeEventListener('mousemove', mousemoveFn)
        document.body.style.cursor = ''
        this.canvas.style.cursor = 'text'
      },
      {
        once: true
      }
    )
    evt.preventDefault()
  }

  private _mousemove(
    evt: MouseEvent,
    tableOrder: TableOrder,
    startX: number,
    startY: number
  ): { dx: number; dy: number } | null {
    if (!this.anchorLine) return null
    const dx = evt.x - this.mousedownX
    const dy = evt.y - this.mousedownY
    if (tableOrder === TableOrder.ROW) {
      this.anchorLine.style.top = `${startY + dy}px`
    } else {
      this.anchorLine.style.left = `${startX + dx}px`
    }
    evt.preventDefault()
    return { dx, dy }
  }
}
