import { ElementType } from '../../../../dataset/enum/Element'
import { KeyMap } from '../../../../dataset/enum/KeyMap'
import { MoveDirection } from '../../../../dataset/enum/Observer'
import { IElementPosition } from '../../../../interface/Element'
import { CanvasEvent } from '../../CanvasEvent'

interface IGetNextPositionIndexPayload {
  positionList: IElementPosition[]
  index: number
  rowNo: number
  isUp: boolean
  cursorX: number
}
// 현재 위치 인덱스를 기반으로 위아래 행에서 가장 가까운 인덱스 위치 찾기
function getNextPositionIndex(payload: IGetNextPositionIndexPayload) {
  const { positionList, index, isUp, rowNo, cursorX } = payload
  let nextIndex = -1
  // 다음 행 위치 목록 찾기
  const probablePosition: IElementPosition[] = []
  if (isUp) {
    let p = index - 1
    // 0일 때 이전 행은 첫 번째 행
    while (p >= 0) {
      const position = positionList[p]
      p--
      if (position.rowNo === rowNo) continue
      if (probablePosition[0] && probablePosition[0].rowNo !== position.rowNo) {
        break
      }
      probablePosition.unshift(position)
    }
  } else {
    let p = index + 1
    while (p < positionList.length) {
      const position = positionList[p]
      p++
      if (position.rowNo === rowNo) continue
      if (probablePosition[0] && probablePosition[0].rowNo !== position.rowNo) {
        break
      }
      probablePosition.push(position)
    }
  }
  // 다음 행 위치 찾기: 교차 너비가 있는 첫 번째 요소 위치
  for (let p = 0; p < probablePosition.length; p++) {
    const nextPosition = probablePosition[p]
    const {
      coordinate: {
        leftTop: [nextLeftX],
        rightTop: [nextRightX]
      }
    } = nextPosition
    if (p === probablePosition.length - 1) {
      nextIndex = nextPosition.index
    }
    if (cursorX < nextLeftX || cursorX > nextRightX) continue
    nextIndex = nextPosition.index
    break
  }
  return nextIndex
}

export function updown(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  let positionList = position.getPositionList()
  const isUp = evt.key === KeyMap.Up
  // 새로운 커서 시작 종료 위치
  let anchorStartIndex = -1
  let anchorEndIndex = -1
  // 셀 간 이동 및 테이블 나가기 로직
  const positionContext = position.getPositionContext()
  if (
    !evt.shiftKey &&
    positionContext.isTable &&
    ((isUp && cursorPosition.rowIndex === 0) ||
      (!isUp && cursorPosition.rowIndex === draw.getRowCount() - 1))
  ) {
    const { index, trIndex, tdIndex, tableId } = positionContext
    if (isUp) {
      // 위로 이동 - 첫 번째 행이면 테이블 밖으로 이동, 그렇지 않으면 이전 행 동일 열 위치
      if (trIndex === 0) {
        position.setPositionContext({
          isTable: false
        })
        anchorStartIndex = index! - 1
        anchorEndIndex = anchorStartIndex
        draw.getTableTool().dispose()
      } else {
        // 이전 행 동일 열 인덱스 위치 정보 찾기
        let preTrIndex = -1
        let preTdIndex = -1
        const originalElementList = draw.getOriginalElementList()
        const trList = originalElementList[index!].trList!
        // 현재 셀이 위치한 열의 실제 인덱스
        const curTdColIndex = trList[trIndex!].tdList[tdIndex!].colIndex!
        outer: for (let r = trIndex! - 1; r >= 0; r--) {
          const tr = trList[r]
          const tdList = tr.tdList!
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            if (
              td.colIndex === curTdColIndex ||
              (td.colIndex! + td.colspan - 1 >= curTdColIndex &&
                td.colIndex! <= curTdColIndex)
            ) {
              preTrIndex = r
              preTdIndex = d
              break outer
            }
          }
        }
        if (!~preTrIndex || !~preTdIndex) return
        const preTr = trList[preTrIndex]
        const preTd = preTr.tdList[preTdIndex]
        position.setPositionContext({
          isTable: true,
          index,
          trIndex: preTrIndex,
          tdIndex: preTdIndex,
          tdId: preTd.id,
          trId: preTr.id,
          tableId
        })
        anchorStartIndex = preTd.value.length - 1
        anchorEndIndex = anchorStartIndex
        draw.getTableTool().render()
      }
    } else {
      // 아래로 이동 - 마지막 행이면 테이블 밖으로 이동, 그렇지 않으면 다음 행 동일 열 위치
      const originalElementList = draw.getOriginalElementList()
      const trList = originalElementList[index!].trList!
      if (trIndex === trList.length - 1) {
        position.setPositionContext({
          isTable: false
        })
        anchorStartIndex = index!
        anchorEndIndex = anchorStartIndex
        draw.getTableTool().dispose()
      } else {
        // 다음 행 동일 열 인덱스 위치 정보 찾기
        let nexTrIndex = -1
        let nextTdIndex = -1
        // 현재 셀이 위치한 열의 실제 인덱스
        const curTdColIndex = trList[trIndex!].tdList[tdIndex!].colIndex!
        outer: for (let r = trIndex! + 1; r < trList.length; r++) {
          const tr = trList[r]
          const tdList = tr.tdList!
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            if (
              td.colIndex === curTdColIndex ||
              (td.colIndex! + td.colspan - 1 >= curTdColIndex &&
                td.colIndex! <= curTdColIndex)
            ) {
              nexTrIndex = r
              nextTdIndex = d
              break outer
            }
          }
        }
        if (!~nexTrIndex || !~nextTdIndex) return
        const nextTr = trList[nexTrIndex]
        const nextTd = nextTr.tdList[nextTdIndex]
        position.setPositionContext({
          isTable: true,
          index,
          trIndex: nexTrIndex,
          tdIndex: nextTdIndex,
          tdId: nextTd.id,
          trId: nextTr.id,
          tableId
        })
        anchorStartIndex = nextTd.value.length - 1
        anchorEndIndex = anchorStartIndex
        draw.getTableTool().render()
      }
    }
  } else {
    // 일반 요소 및 테이블 진입 로직
    let anchorPosition: IElementPosition = cursorPosition
    // 선택 영역 확대 시 이동 커서 위치 판단
    if (evt.shiftKey) {
      if (startIndex === cursorPosition.index) {
        anchorPosition = positionList[endIndex]
      } else {
        anchorPosition = positionList[startIndex]
      }
    }
    const {
      index,
      rowNo,
      rowIndex,
      coordinate: {
        rightTop: [curRightX]
      }
    } = anchorPosition
    // 위로 이동 시 첫 번째 행, 아래로 이동 시 마지막 행이면 무시
    if (
      (isUp && rowIndex === 0) ||
      (!isUp && rowIndex === draw.getRowCount() - 1)
    ) {
      return
    }
    // 다음 행 위치 목록 찾기
    const nextIndex = getNextPositionIndex({
      positionList,
      index,
      rowNo,
      isUp,
      cursorX: curRightX
    })
    if (nextIndex < 0) return
    // shift 키로 선택 영역 조정
    anchorStartIndex = nextIndex
    anchorEndIndex = nextIndex
    if (evt.shiftKey) {
      if (startIndex !== endIndex) {
        if (startIndex === cursorPosition.index) {
          anchorStartIndex = startIndex
        } else {
          anchorEndIndex = endIndex
        }
      } else {
        if (isUp) {
          anchorEndIndex = endIndex
        } else {
          anchorStartIndex = startIndex
        }
      }
    }
    // 다음 행이 테이블이면 셀 내부로 진입
    const elementList = draw.getElementList()
    const nextElement = elementList[nextIndex]
    if (nextElement.type === ElementType.TABLE) {
      const { scale } = draw.getOptions()
      const margins = draw.getMargins()
      const trList = nextElement.trList!
      // 진입할 셀 및 요소 위치 찾기
      let trIndex = -1
      let tdIndex = -1
      let tdPositionIndex = -1
      if (isUp) {
        outer: for (let r = trList.length - 1; r >= 0; r--) {
          const tr = trList[r]
          const tdList = tr.tdList!
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            const tdX = td.x! * scale + margins[3]
            const tdWidth = td.width! * scale
            if (curRightX >= tdX && curRightX <= tdX + tdWidth) {
              const tdPositionList = td.positionList!
              const lastPosition = tdPositionList[tdPositionList.length - 1]
              const nextPositionIndex =
                getNextPositionIndex({
                  positionList: tdPositionList,
                  index: lastPosition.index + 1, // 가상 시작 위치+1 (왼쪽에서 오른쪽으로 찾기)
                  rowNo: lastPosition.rowNo - 1, // 가상 시작 행 번호-1 (아래에서 위로 찾기)
                  isUp,
                  cursorX: curRightX
                }) || lastPosition.index
              trIndex = r
              tdIndex = d
              tdPositionIndex = nextPositionIndex
              break outer
            }
          }
        }
      } else {
        outer: for (let r = 0; r < trList.length; r++) {
          const tr = trList[r]
          const tdList = tr.tdList!
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            const tdX = td.x! * scale + margins[3]
            const tdWidth = td.width! * scale
            if (curRightX >= tdX && curRightX <= tdX + tdWidth) {
              const tdPositionList = td.positionList!
              const nextPositionIndex =
                getNextPositionIndex({
                  positionList: tdPositionList,
                  index: -1, // 가상 시작 위치-1 (오른쪽에서 왼쪽으로 찾기)
                  rowNo: -1, // 가상 시작 행 번호-1 (위에서 아래로 찾기)
                  isUp,
                  cursorX: curRightX
                }) || 0
              trIndex = r
              tdIndex = d
              tdPositionIndex = nextPositionIndex
              break outer
            }
          }
        }
      }
      // 컨텍스트 설정
      if (~trIndex && ~tdIndex && ~tdPositionIndex) {
        const nextTr = trList[trIndex]
        const nextTd = nextTr.tdList[tdIndex]
        position.setPositionContext({
          isTable: true,
          index: nextIndex,
          trIndex: trIndex,
          tdIndex: tdIndex,
          tdId: nextTd.id,
          trId: nextTr.id,
          tableId: nextElement.id
        })
        anchorStartIndex = tdPositionIndex
        anchorEndIndex = anchorStartIndex
        positionList = position.getPositionList()
        draw.getTableTool().render()
      }
    }
  }
  // 이동 실행
  if (!~anchorStartIndex || !~anchorEndIndex) return
  if (anchorStartIndex > anchorEndIndex) {
    // prettier-ignore
    [anchorStartIndex, anchorEndIndex] = [anchorEndIndex, anchorStartIndex]
  }
  rangeManager.setRange(anchorStartIndex, anchorEndIndex)
  const isCollapsed = anchorStartIndex === anchorEndIndex
  draw.render({
    curIndex: isCollapsed ? anchorStartIndex : undefined,
    isSetCursor: isCollapsed,
    isSubmitHistory: false,
    isCompute: false
  })
  // 커서를 보이는 범위로 이동
  draw.getCursor().moveCursorToVisible({
    cursorPosition: positionList[isUp ? anchorStartIndex : anchorEndIndex],
    direction: isUp ? MoveDirection.UP : MoveDirection.DOWN
  })
}
