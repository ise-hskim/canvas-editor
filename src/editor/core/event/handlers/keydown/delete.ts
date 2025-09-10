import { CanvasEvent } from '../../CanvasEvent'

// 커서 뒤의 숨겨진 요소 삭제
function deleteHideElement(host: CanvasEvent) {
  const draw = host.getDraw()
  const rangeManager = draw.getRange()
  const range = rangeManager.getRange()
  // 커서 위치가 숨겨진 요소일 때 루프 삭제 트리거
  const elementList = draw.getElementList()
  const nextElement = elementList[range.startIndex + 1]
  if (
    !nextElement.hide &&
    !nextElement.control?.hide &&
    !nextElement.area?.hide
  ) {
    return
  }
  // 뒤쪽으로 모든 숨겨진 요소 삭제
  const index = range.startIndex + 1
  while (index < elementList.length) {
    const element = elementList[index]
    let newIndex: number | null = null
    if (element.controlId) {
      newIndex = draw.getControl().removeControl(index)
    } else {
      draw.spliceElementList(elementList, index, 1)
      newIndex = index
    }
    const newElement = elementList[newIndex!]
    if (
      !newElement ||
      (!newElement.hide && !newElement.control?.hide && !newElement.area?.hide)
    ) {
      break
    }
  }
}

export function del(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly()) return
  // 입력 가능성 검증
  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return
  const { startIndex, endIndex, isCrossRowCol } = rangeManager.getRange()
  // 숨겨진 컴트롤 삭제
  const elementList = draw.getElementList()
  const control = draw.getControl()
  if (rangeManager.getIsCollapsed()) {
    deleteHideElement(host)
  }
  // 삭제 작업
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
  } else if (control.getActiveControl() && control.getIsRangeWithinControl()) {
    // 커서가 컴트롤 내부에 있음
    curIndex = control.keydown(evt)
    if (curIndex) {
      control.emitControlContentChange()
    }
  } else if (elementList[endIndex + 1]?.controlId) {
    // 커서가 컴트롤 앞에 있음
    curIndex = control.removeControl(endIndex + 1)
  } else {
    // 일반 요소
    const position = draw.getPosition()
    const cursorPosition = position.getCursorPosition()
    if (!cursorPosition) return
    const { index } = cursorPosition
    // 이미지 직접 히트 시 직접 삭제
    const positionContext = position.getPositionContext()
    if (positionContext.isDirectHit && positionContext.isImage) {
      draw.spliceElementList(elementList, index, 1)
      curIndex = index - 1
    } else {
      const isCollapsed = rangeManager.getIsCollapsed()
      if (!isCollapsed) {
        draw.spliceElementList(
          elementList,
          startIndex + 1,
          endIndex - startIndex
        )
      } else {
        if (!elementList[index + 1]) return
        draw.spliceElementList(elementList, index + 1, 1)
      }
      curIndex = isCollapsed ? index : startIndex
    }
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
