import { EditorMode } from '../../../..'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { ElementType } from '../../../../dataset/enum/Element'
import { MoveDirection } from '../../../../dataset/enum/Observer'
import { getNonHideElementIndex } from '../../../../utils/element'
import { isMod } from '../../../../utils/hotkey'
import { CanvasEvent } from '../../CanvasEvent'

export function left(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const positionContext = position.getPositionContext()
  const { index } = cursorPosition
  if (index <= 0 && !positionContext.isTable) return
  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  const isCollapsed = rangeManager.getIsCollapsed()
  const elementList = draw.getElementList()
  // 폼 모드에서 컨트롤 이동
  const control = draw.getControl()
  if (
    draw.getMode() === EditorMode.FORM &&
    control.getActiveControl() &&
    (elementList[index]?.controlComponent === ControlComponent.PREFIX ||
      elementList[index]?.controlComponent === ControlComponent.PRE_TEXT)
  ) {
    control.initNextControl({
      direction: MoveDirection.UP
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
    if (LETTER_REG.test(elementList[moveStartIndex]?.value)) {
      let i = moveStartIndex - 1
      while (i > 0) {
        const element = elementList[i]
        if (!LETTER_REG.test(element.value)) {
          break
        }
        moveCount++
        i--
      }
    }
  }
  const curIndex = startIndex - moveCount
  // shift 키로 선택 영역 조정
  let anchorStartIndex = curIndex
  let anchorEndIndex = curIndex
  if (evt.shiftKey && cursorPosition) {
    if (startIndex !== endIndex) {
      if (startIndex === cursorPosition.index) {
        // 선택 영역 축소
        anchorStartIndex = startIndex
        anchorEndIndex = endIndex - moveCount
      } else {
        anchorStartIndex = curIndex
        anchorEndIndex = endIndex
      }
    } else {
      anchorEndIndex = endIndex
    }
  }
  // 테이블 셀 간 이동
  if (!evt.shiftKey) {
    const element = elementList[startIndex]
    // 이전이 테이블이면 마지막 셀의 마지막 요소로 진입
    if (element.type === ElementType.TABLE) {
      const trList = element.trList!
      const lastTrIndex = trList.length - 1
      const lastTr = trList[lastTrIndex]
      const lastTdIndex = lastTr.tdList.length - 1
      const lastTd = lastTr.tdList[lastTdIndex]
      position.setPositionContext({
        isTable: true,
        index: startIndex,
        trIndex: lastTrIndex,
        tdIndex: lastTdIndex,
        tdId: lastTd.id,
        trId: lastTr.id,
        tableId: element.id
      })
      anchorStartIndex = lastTd.value.length - 1
      anchorEndIndex = anchorStartIndex
      draw.getTableTool().render()
    } else if (element.tableId) {
      // 테이블 셀 내부 & 첫 번째 위치에서 이전 셀로 이동
      if (startIndex === 0) {
        const originalElementList = draw.getOriginalElementList()
        const trList = originalElementList[positionContext.index!].trList!
        outer: for (let r = 0; r < trList.length; r++) {
          const tr = trList[r]
          if (tr.id !== element.trId) continue
          const tdList = tr.tdList
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            if (td.id !== element.tdId) continue
            // 테이블 앞으로 이동
            if (r === 0 && d === 0) {
              position.setPositionContext({
                isTable: false
              })
              anchorStartIndex = positionContext.index! - 1
              anchorEndIndex = anchorStartIndex
              draw.getTableTool().dispose()
            } else {
              // 이전 셀
              let preTrIndex = r
              let preTdIndex = d - 1
              if (preTdIndex < 0) {
                preTrIndex = r - 1
                preTdIndex = trList[preTrIndex].tdList.length - 1
              }
              const preTr = trList[preTrIndex]
              const preTd = preTr.tdList[preTdIndex]
              position.setPositionContext({
                isTable: true,
                index: positionContext.index,
                trIndex: preTrIndex,
                tdIndex: preTdIndex,
                tdId: preTd.id,
                trId: preTr.id,
                tableId: element.tableId
              })
              anchorStartIndex = preTd.value.length - 1
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
  if (!~anchorStartIndex || !~anchorEndIndex) return
  // 숨겨진 요소 건너뛰기
  const newElementList = draw.getElementList()
  anchorStartIndex = getNonHideElementIndex(newElementList, anchorStartIndex)
  anchorEndIndex = getNonHideElementIndex(newElementList, anchorEndIndex)
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
