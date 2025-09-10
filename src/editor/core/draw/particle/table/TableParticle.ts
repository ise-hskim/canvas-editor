import { ElementType, IElement, TableBorder } from '../../../..'
import { TdBorder, TdSlash } from '../../../../dataset/enum/table/Table'
import { DeepRequired } from '../../../../interface/Common'
import { IEditorOption } from '../../../../interface/Editor'
import { ITd } from '../../../../interface/table/Td'
import { ITr } from '../../../../interface/table/Tr'
import { deepClone } from '../../../../utils'
import { RangeManager } from '../../../range/RangeManager'
import { Draw } from '../../Draw'

interface IDrawTableBorderOption {
  ctx: CanvasRenderingContext2D
  startX: number
  startY: number
  width: number
  height: number
  borderExternalWidth?: number
  isDrawFullBorder?: boolean
}

export class TableParticle {
  private draw: Draw
  private range: RangeManager
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.options = draw.getOptions()
  }

  public getTrListGroupByCol(payload: ITr[]): ITr[] {
    const trList = deepClone(payload)
    for (let t = 0; t < payload.length; t++) {
      const tr = trList[t]
      for (let d = tr.tdList.length - 1; d >= 0; d--) {
        const td = tr.tdList[d]
        const { rowspan, rowIndex, colIndex } = td
        const curRowIndex = rowIndex! + rowspan - 1
        if (curRowIndex !== d) {
          const changeTd = tr.tdList.splice(d, 1)[0]
          trList[curRowIndex]?.tdList.splice(colIndex!, 0, changeTd)
        }
      }
    }
    return trList
  }

  public getRangeRowCol(): ITd[][] | null {
    const { isTable, index, trIndex, tdIndex } = this.draw
      .getPosition()
      .getPositionContext()
    if (!isTable) return null
    const {
      isCrossRowCol,
      startTdIndex,
      endTdIndex,
      startTrIndex,
      endTrIndex
    } = this.range.getRange()
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    // 비 크로스 열인 경우 커서가 있는 셀을 직접 반환
    if (!isCrossRowCol) {
      return [[curTrList[trIndex!].tdList[tdIndex!]]]
    }
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
    return rowCol.length ? rowCol : null
  }

  private _drawOuterBorder(payload: IDrawTableBorderOption) {
    const {
      ctx,
      startX,
      startY,
      width,
      height,
      isDrawFullBorder,
      borderExternalWidth
    } = payload
    const { scale } = this.options
    // 외부 테두리 별도 설정
    const lineWidth = ctx.lineWidth
    if (borderExternalWidth) {
      ctx.lineWidth = borderExternalWidth * scale
    }
    ctx.beginPath()
    const x = Math.round(startX)
    const y = Math.round(startY)
    ctx.translate(0.5, 0.5)
    if (isDrawFullBorder) {
      ctx.rect(x, y, width, height)
    } else {
      ctx.moveTo(x, y + height)
      ctx.lineTo(x, y)
      ctx.lineTo(x + width, y)
    }
    ctx.stroke()
    // 테두리 설정 복원
    if (borderExternalWidth) {
      ctx.lineWidth = lineWidth
    }
    ctx.translate(-0.5, -0.5)
  }

  private _drawSlash(
    ctx: CanvasRenderingContext2D,
    td: ITd,
    startX: number,
    startY: number
  ) {
    const { scale } = this.options
    ctx.save()
    const width = td.width! * scale
    const height = td.height! * scale
    const x = Math.round(td.x! * scale + startX)
    const y = Math.round(td.y! * scale + startY)
    // 정사선 /
    if (td.slashTypes?.includes(TdSlash.FORWARD)) {
      ctx.moveTo(x + width, y)
      ctx.lineTo(x, y + height)
    }
    // 역사선 \
    if (td.slashTypes?.includes(TdSlash.BACK)) {
      ctx.moveTo(x, y)
      ctx.lineTo(x + width, y + height)
    }
    ctx.stroke()
    ctx.restore()
  }

  private _drawBorder(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number
  ) {
    const {
      colgroup,
      trList,
      borderType,
      borderColor,
      borderWidth = 1,
      borderExternalWidth
    } = element
    if (!colgroup || !trList) return
    const {
      scale,
      table: { defaultBorderColor }
    } = this.options
    const tableWidth = element.width! * scale
    const tableHeight = element.height! * scale
    // 테두리 없음
    const isEmptyBorderType = borderType === TableBorder.EMPTY
    // 외부 테두리만
    const isExternalBorderType = borderType === TableBorder.EXTERNAL
    // 내부 테두리
    const isInternalBorderType = borderType === TableBorder.INTERNAL
    ctx.save()
    // 점선
    if (borderType === TableBorder.DASH) {
      ctx.setLineDash([3, 3])
    }
    ctx.lineWidth = borderWidth * scale
    ctx.strokeStyle = borderColor || defaultBorderColor
    // 테두리 렌더링
    if (!isEmptyBorderType && !isInternalBorderType) {
      this._drawOuterBorder({
        ctx,
        startX,
        startY,
        width: tableWidth,
        height: tableHeight,
        borderExternalWidth,
        isDrawFullBorder: isExternalBorderType
      })
    }
    // 셀 렌더링
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        // 셀 내부 대각선
        if (td.slashTypes?.length) {
          this._drawSlash(ctx, td, startX, startY)
        }
        // 셀 테두리 설정이 없고 && 테이블 테두리 설정이 없으면 무시
        if (
          !td.borderTypes?.length &&
          (isEmptyBorderType || isExternalBorderType)
        ) {
          continue
        }
        const width = td.width! * scale
        const height = td.height! * scale
        const x = Math.round(td.x! * scale + startX + width)
        const y = Math.round(td.y! * scale + startY)
        ctx.translate(0.5, 0.5)
        // 선 그리기
        ctx.beginPath()
        // 셀 테두리
        if (td.borderTypes?.includes(TdBorder.TOP)) {
          ctx.moveTo(x - width, y)
          ctx.lineTo(x, y)
          ctx.stroke()
        }
        if (td.borderTypes?.includes(TdBorder.RIGHT)) {
          ctx.moveTo(x, y)
          ctx.lineTo(x, y + height)
          ctx.stroke()
        }
        if (td.borderTypes?.includes(TdBorder.BOTTOM)) {
          ctx.moveTo(x, y + height)
          ctx.lineTo(x - width, y + height)
          ctx.stroke()
        }
        if (td.borderTypes?.includes(TdBorder.LEFT)) {
          ctx.moveTo(x - width, y)
          ctx.lineTo(x - width, y + height)
          ctx.stroke()
        }
        // 테이블 선
        if (!isEmptyBorderType && !isExternalBorderType) {
          // 오른쪽 테두리
          if (
            !isInternalBorderType ||
            td.colIndex! + td.colspan < colgroup.length
          ) {
            ctx.moveTo(x, y)
            ctx.lineTo(x, y + height)
            // 외부 테두리 넓이 설정 시 => 최우측 테두리 넓이 별도 설정
            if (
              borderExternalWidth &&
              borderExternalWidth !== borderWidth &&
              td.colIndex! + td.colspan === colgroup.length
            ) {
              const lineWidth = ctx.lineWidth
              ctx.lineWidth = borderExternalWidth * scale
              ctx.stroke()
              // path 비우기
              ctx.beginPath()
              ctx.lineWidth = lineWidth
            }
          }
          // 하단 테두리
          if (
            !isInternalBorderType ||
            td.rowIndex! + td.rowspan < trList.length
          ) {
            // 외부 테두리 너비 설정 시 => 즉시 세로선 그리기
            const isSetExternalBottomBorder =
              borderExternalWidth &&
              borderExternalWidth !== borderWidth &&
              td.rowIndex! + td.rowspan === trList.length
            if (isSetExternalBottomBorder) {
              ctx.stroke()
              // path 비우기
              ctx.beginPath()
            }
            ctx.moveTo(x, y + height)
            ctx.lineTo(x - width, y + height)
            // 외부 테두리 너비 설정 시 => 최하단 테두리 너비 별도 설정
            if (isSetExternalBottomBorder) {
              const lineWidth = ctx.lineWidth
              ctx.lineWidth = borderExternalWidth * scale
              ctx.stroke()
              // path 비우기
              ctx.beginPath()
              ctx.lineWidth = lineWidth
            }
          }
          ctx.stroke()
        }
        ctx.translate(-0.5, -0.5)
      }
    }
    ctx.restore()
  }

  private _drawBackgroundColor(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number
  ) {
    const { trList } = element
    if (!trList) return
    const { scale } = this.options
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        if (!td.backgroundColor) continue
        ctx.save()
        const width = td.width! * scale
        const height = td.height! * scale
        const x = Math.round(td.x! * scale + startX)
        const y = Math.round(td.y! * scale + startY)
        ctx.fillStyle = td.backgroundColor
        ctx.fillRect(x, y, width, height)
        ctx.restore()
      }
    }
  }

  public getTableWidth(element: IElement): number {
    return element.colgroup!.reduce((pre, cur) => pre + cur.width, 0)
  }

  public getTableHeight(element: IElement): number {
    const trList = element.trList
    if (!trList?.length) return 0
    return this.getTdListByColIndex(trList, 0).reduce(
      (pre, cur) => pre + cur.height!,
      0
    )
  }

  public getRowCountByColIndex(trList: ITr[], colIndex: number): number {
    return this.getTdListByColIndex(trList, colIndex).reduce(
      (pre, cur) => pre + cur.rowspan,
      0
    )
  }

  public getTdListByColIndex(trList: ITr[], colIndex: number): ITd[] {
    const data: ITd[] = []
    for (let r = 0; r < trList.length; r++) {
      const tdList = trList[r].tdList
      for (let d = 0; d < tdList.length; d++) {
        const td = tdList[d]
        const min = td.colIndex!
        const max = min + td.colspan - 1
        if (colIndex >= min && colIndex <= max) {
          data.push(td)
        }
      }
    }
    return data
  }

  public getTdListByRowIndex(trList: ITr[], rowIndex: number) {
    const data: ITd[] = []
    for (let r = 0; r < trList.length; r++) {
      const tdList = trList[r].tdList
      for (let d = 0; d < tdList.length; d++) {
        const td = tdList[d]
        const min = td.rowIndex!
        const max = min + td.rowspan - 1
        if (rowIndex >= min && rowIndex <= max) {
          data.push(td)
        }
      }
    }
    return data
  }

  public computeRowColInfo(element: IElement) {
    const { colgroup, trList } = element
    if (!colgroup || !trList) return
    let preX = 0
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t]
      // 테이블의 마지막 행
      const isLastTr = trList.length - 1 === t
      // 현재 행의 최소 높이
      let rowMinHeight = 0
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        // 현재 td가 속하는 열 인덱스 계산
        let colIndex = 0
        // 첫 번째 행 td 위치는 현재 열 인덱스 + 이전 셀 colspan, 그렇지 않으면 첫 번째 행부터 열 오프셋 계산
        if (trList.length > 1 && t !== 0) {
          // 현재 열 시작 인덱스: 이전 셀을 시작점으로
          const preTd = tr.tdList[d - 1]
          const start = preTd ? preTd.colIndex! + preTd.colspan : d
          for (let c = start; c < colgroup.length; c++) {
            // 동일한 인덱스 열의 이전 행 수를 찾아 더하여 위치가 점유되었는지 판단
            const rowCount = this.getRowCountByColIndex(trList.slice(0, t), c)
            // 점유가 없으면 기본적으로 현재 셀이 해당 위치에 존재할 수 있음
            if (rowCount === t) {
              colIndex = c
              // 셀 시작 위치 좌표 재설정
              let preColWidth = 0
              for (let preC = 0; preC < c; preC++) {
                preColWidth += colgroup[preC].width
              }
              preX = preColWidth
              break
            }
          }
        } else {
          const preTd = tr.tdList[d - 1]
          if (preTd) {
            colIndex = preTd.colIndex! + preTd.colspan
          }
        }
        // 셀 너비와 높이 계산
        let width = 0
        for (let col = 0; col < td.colspan; col++) {
          width += colgroup[col + colIndex].width
        }
        let height = 0
        for (let row = 0; row < td.rowspan; row++) {
          const curTr = trList[row + t] || trList[t]
          height += curTr.height
        }
        // y 오프셋
        if (rowMinHeight === 0 || rowMinHeight > height) {
          rowMinHeight = height
        }
        // 현재 행의 마지막 td
        const isLastRowTd = tr.tdList.length - 1 === d
        // 현재 열의 마지막 td
        let isLastColTd = isLastTr
        if (!isLastColTd) {
          if (td.rowspan > 1) {
            const nextTrLength = trList.length - 1 - t
            isLastColTd = td.rowspan - 1 === nextTrLength
          }
        }
        // 현재 테이블의 마지막 td
        const isLastTd = isLastTr && isLastRowTd
        td.isLastRowTd = isLastRowTd
        td.isLastColTd = isLastColTd
        td.isLastTd = isLastTd
        // 현재 셀 clientBox 수정
        td.x = preX
        // 이전 행 동일 열의 높이
        let preY = 0
        for (let preR = 0; preR < t; preR++) {
          const preTdList = trList[preR].tdList
          for (let preD = 0; preD < preTdList.length; preD++) {
            const td = preTdList[preD]
            if (
              colIndex >= td.colIndex! &&
              colIndex < td.colIndex! + td.colspan
            ) {
              preY += td.height!
              break
            }
          }
        }
        td.y = preY
        td.width = width
        td.height = height
        td.rowIndex = t
        td.colIndex = colIndex
        td.trIndex = t
        td.tdIndex = d
        // 현재 열 x축 누적
        preX += width
        // 한 행의 마지막 td
        if (isLastRowTd && !isLastTd) {
          preX = 0
        }
      }
    }
  }

  public drawRange(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number
  ) {
    const { scale, rangeAlpha, rangeColor } = this.options
    const { type, trList } = element
    if (!trList || type !== ElementType.TABLE) return
    const {
      isCrossRowCol,
      startTdIndex,
      endTdIndex,
      startTrIndex,
      endTrIndex
    } = this.range.getRange()
    // 행/열 병합 존재
    if (!isCrossRowCol) return
    let startTd = trList[startTrIndex!].tdList[startTdIndex!]
    let endTd = trList[endTrIndex!].tdList[endTdIndex!]
    // 시작 위치 교체
    if (startTd.x! > endTd.x! || startTd.y! > endTd.y!) {
      // prettier-ignore
      [startTd, endTd] = [endTd, startTd]
    }
    const startColIndex = startTd.colIndex!
    const endColIndex = endTd.colIndex! + (endTd.colspan - 1)
    const startRowIndex = startTd.rowIndex!
    const endRowIndex = endTd.rowIndex! + (endTd.rowspan - 1)
    ctx.save()
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t]
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
          const x = td.x! * scale
          const y = td.y! * scale
          const width = td.width! * scale
          const height = td.height! * scale
          ctx.globalAlpha = rangeAlpha
          ctx.fillStyle = rangeColor
          ctx.fillRect(x + startX, y + startY, width, height)
        }
      }
    }
    ctx.restore()
  }

  public render(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number
  ) {
    this._drawBackgroundColor(ctx, element, startX, startY)
    this._drawBorder(ctx, element, startX, startY)
  }
}
