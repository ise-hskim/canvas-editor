import { LocationPosition } from '../../../../dataset/enum/Common'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { EditorMode } from '../../../../dataset/enum/Editor'
import { ElementType } from '../../../../dataset/enum/Element'
import { MoveDirection } from '../../../../dataset/enum/Observer'
import { getNonHideElementIndex } from '../../../../utils/element'
import { isMod } from '../../../../utils/hotkey'
import { CanvasEvent } from '../../CanvasEvent'

export function right(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const { index } = cursorPosition
  const positionList = position.getPositionList()
  const positionContext = position.getPositionContext()
  if (index > positionList.length - 1 && !positionContext.isTable) return
  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  const isCollapsed = rangeManager.getIsCollapsed()
  let elementList = draw.getElementList()
  // 폼 모드에서 컨트롤 이동
  const control = draw.getControl()
  if (
    draw.getMode() === EditorMode.FORM &&
    control.getActiveControl() &&
    (elementList[index + 1]?.controlComponent === ControlComponent.POSTFIX ||
      elementList[index + 1]?.controlComponent === ControlComponent.POST_TEXT)
  ) {
    control.initNextControl({
      direction: MoveDirection.DOWN
    })
    return
  }
  // 단어 전체 이동
  let moveCount = 1
  if (isMod(evt)) {
    const LETTER_REG = draw.getLetterReg()
    // 시작 위치
    const moveStartIndex =
      evt.shiftKey && !isCollapsed && startIndex === cursorPosition?.index
        ? endIndex
        : startIndex
    if (LETTER_REG.test(elementList[moveStartIndex + 1]?.value)) {
      let i = moveStartIndex + 2
      while (i < elementList.length) {
        const element = elementList[i]
        if (!LETTER_REG.test(element.value)) {
          break
        }
        moveCount++
        i++
      }
    }
  }
  const curIndex = endIndex + moveCount
  // shift 키로 선택 영역 조정
  let anchorStartIndex = curIndex
  let anchorEndIndex = curIndex
  if (evt.shiftKey && cursorPosition) {
    if (startIndex !== endIndex) {
      if (startIndex === cursorPosition.index) {
        // 선택 영역 확대
        anchorStartIndex = startIndex
        anchorEndIndex = curIndex
      } else {
        anchorStartIndex = startIndex + moveCount
        anchorEndIndex = endIndex
      }
    } else {
      anchorStartIndex = startIndex
    }
  }
  // 테이블 셀 간 이동
  if (!evt.shiftKey) {
    const element = elementList[endIndex]
    const nextElement = elementList[endIndex + 1]
    // 다음 요소가 테이블이면 셀의 첫 번째 시작 위치로 진입
    if (nextElement?.type === ElementType.TABLE) {
      const trList = nextElement.trList!
      const nextTr = trList[0]
      const nextTd = nextTr.tdList[0]
      position.setPositionContext({
        isTable: true,
        index: endIndex + 1,
        trIndex: 0,
        tdIndex: 0,
        tdId: nextTd.id,
        trId: nextTr.id,
        tableId: nextElement.id
      })
      anchorStartIndex = 0
      anchorEndIndex = 0
      draw.getTableTool().render()
    } else if (element.tableId) {
      // 테이블 셀 내부 & 셀 요소의 마지막
      if (!nextElement) {
        const originalElementList = draw.getOriginalElementList()
        const trList = originalElementList[positionContext.index!].trList!
        outer: for (let r = 0; r < trList.length; r++) {
          const tr = trList[r]
          if (tr.id !== element.trId) continue
          const tdList = tr.tdList
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            if (td.id !== element.tdId) continue
            // 테이블 뒤로 이동
            if (r === trList.length - 1 && d === tdList.length - 1) {
              position.setPositionContext({
                isTable: false
              })
              anchorStartIndex = positionContext.index!
              anchorEndIndex = anchorStartIndex
              elementList = draw.getElementList()
              draw.getTableTool().dispose()
            } else {
              // 다음 셀
              let nextTrIndex = r
              let nextTdIndex = d + 1
              if (nextTdIndex > tdList.length - 1) {
                nextTrIndex = r + 1
                nextTdIndex = 0
              }
              const preTr = trList[nextTrIndex]
              const preTd = preTr.tdList[nextTdIndex]
              position.setPositionContext({
                isTable: true,
                index: positionContext.index,
                trIndex: nextTrIndex,
                tdIndex: nextTdIndex,
                tdId: preTd.id,
                trId: preTr.id,
                tableId: element.tableId
              })
              anchorStartIndex = 0
              anchorEndIndex = anchorStartIndex
              draw.getTableTool().render()
            }
            break outer
          }
        }
      }
    }
  }
  // 이동 실행
  const maxElementListIndex = elementList.length - 1
  if (
    anchorStartIndex > maxElementListIndex ||
    anchorEndIndex > maxElementListIndex
  ) {
    return
  }
  // 숨겨진 요소 건너뛰기
  const newElementList = draw.getElementList()
  anchorStartIndex = getNonHideElementIndex(
    newElementList,
    anchorStartIndex,
    LocationPosition.AFTER
  )
  anchorEndIndex = getNonHideElementIndex(
    newElementList,
    anchorEndIndex,
    LocationPosition.AFTER
  )
  // 컨텍스트 설정
  rangeManager.setRange(anchorStartIndex, anchorEndIndex)
  const isAnchorCollapsed = anchorStartIndex === anchorEndIndex
  draw.render({
    curIndex: isAnchorCollapsed ? anchorStartIndex : undefined,
    isSetCursor: isAnchorCollapsed,
    isSubmitHistory: false,
    isCompute: false
  })
  evt.preventDefault()
}
