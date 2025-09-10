import { ZERO } from '../../../../dataset/constant/Common'
import { CanvasEvent } from '../../CanvasEvent'

// 커서 앞의 숨겨진 요소 삭제
function backspaceHideElement(host: CanvasEvent) {
  const draw = host.getDraw()
  const rangeManager = draw.getRange()
  const range = rangeManager.getRange()
  // 커서 위치가 숨겨진 요소일 때 루프 삭제 트리거
  const elementList = draw.getElementList()
  const element = elementList[range.startIndex]
  if (!element.hide && !element.control?.hide && !element.area?.hide) return
  // 앞쪽으로 모든 숨겨진 요소 삭제
  let index = range.startIndex
  while (index > 0) {
    const element = elementList[index]
    let newIndex: number | null = null
    if (element.controlId) {
      newIndex = draw.getControl().removeControl(index)
      if (newIndex !== null) {
        index = newIndex
      }
    } else {
      draw.spliceElementList(elementList, index, 1)
      newIndex = index - 1
      index--
    }
    const newElement = elementList[newIndex!]
    if (
      !newElement ||
      (!newElement.hide && !newElement.control?.hide && !newElement.area?.hide)
    ) {
      // 컨텍스트 정보 업데이트
      if (newIndex) {
        // 선택 영역 정보 업데이트
        range.startIndex = newIndex
        range.endIndex = newIndex
        rangeManager.replaceRange(range)
        // 위치 정보 업데이트
        const position = draw.getPosition()
        const positionList = position.getPositionList()
        position.setCursorPosition(positionList[newIndex])
      }
      break
    }
  }
}

export function backspace(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly()) return
  // 입력 가능성 검증
  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return
  // 숨겨진 요소 삭제
  if (rangeManager.getIsCollapsed()) {
    backspaceHideElement(host)
  }
  // 삭제 작업
  const control = draw.getControl()
  const { startIndex, endIndex, isCrossRowCol } = rangeManager.getRange()
  let curIndex: number | null
  if (isCrossRowCol) {
    // 테이블 행열 넘나들기 선택 시 셀 내용 지우기
    const rowCol = draw.getTableParticle().getRangeRowCol()
    if (!rowCol) return
    let isDeleted = false
    for (let r = 0; r < rowCol.length; r++) {
      const row = rowCol[r]
      for (let c = 0; c < row.length; c++) {
        const col = row[c]
        if (col.value.length > 1) {
          draw.spliceElementList(col.value, 1, col.value.length - 1)
          isDeleted = true
        }
      }
    }
    // 삭제 성공 후 위치 지정
    curIndex = isDeleted ? 0 : null
  } else if (
    control.getActiveControl() &&
    control.getIsRangeCanCaptureEvent()
  ) {
    // 커서가 컴트롤 내부에 있음
    curIndex = control.keydown(evt)
    if (curIndex) {
      control.emitControlContentChange()
    }
  } else {
    // 일반 요소 삭제
    const cursorPosition = draw.getPosition().getCursorPosition()
    if (!cursorPosition) return
    const { index } = cursorPosition
    const isCollapsed = rangeManager.getIsCollapsed()
    const elementList = draw.getElementList()
    // 삭제 허용 여부 판단
    if (isCollapsed && index === 0) {
      const firstElement = elementList[index]
      if (firstElement.value === ZERO) {
        // 첫 번째 문자 목록 설정 취소
        if (firstElement.listId) {
          draw.getListParticle().unsetList()
        }
        evt.preventDefault()
        return
      }
    }
    // 현재 행 정렬 방식 교체
    const startElement = elementList[startIndex]
    if (isCollapsed && startElement.rowFlex && startElement.value === ZERO) {
      const rowFlexElementList = rangeManager.getRangeRowElementList()
      if (rowFlexElementList) {
        const preElement = elementList[startIndex - 1]
        rowFlexElementList.forEach(element => {
          element.rowFlex = preElement?.rowFlex
        })
      }
    }
    if (!isCollapsed) {
      draw.spliceElementList(elementList, startIndex + 1, endIndex - startIndex)
    } else {
      draw.spliceElementList(elementList, index, 1)
    }
    curIndex = isCollapsed ? index - 1 : startIndex
  }
  draw.getGlobalEvent().setCanvasEventAbility()
  if (curIndex === null) {
    rangeManager.setRange(startIndex, startIndex)
    draw.render({
      curIndex: startIndex,
      isSubmitHistory: false
    })
  } else {
    rangeManager.setRange(curIndex, curIndex)
    draw.render({
      curIndex
    })
  }
}
