import { ZERO } from '../../../../dataset/constant/Common'
import {
  AREA_CONTEXT_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR,
  EDITOR_ROW_ATTR
} from '../../../../dataset/constant/Element'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { IElement } from '../../../../interface/Element'
import { omitObject } from '../../../../utils'
import { formatElementContext } from '../../../../utils/element'
import { CanvasEvent } from '../../CanvasEvent'

export function enter(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly()) return
  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return
  const { startIndex, endIndex } = rangeManager.getRange()
  const isCollapsed = rangeManager.getIsCollapsed()
  const elementList = draw.getElementList()
  const startElement = elementList[startIndex]
  const endElement = elementList[endIndex]
  // 마지막 목록 항목 행 시작에서 엔터 시 목록 설정 취소
  if (
    isCollapsed &&
    endElement.listId &&
    endElement.value === ZERO &&
    elementList[endIndex + 1]?.listId !== endElement.listId
  ) {
    draw.getListParticle().unsetList()
    return
  }
  // 목록 블록 내 개행
  let enterText: IElement = {
    value: ZERO
  }
  if (evt.shiftKey && startElement.listId) {
    enterText.listWrap = true
  }
  // 컨텍스트 포맷팅
  formatElementContext(elementList, [enterText], startIndex, {
    isBreakWhenWrap: true,
    editorOptions: draw.getOptions()
  })
  // Shift 길게 누르기 && 마지막 위치에서 엔터 시 영역 컨텍스트 복사 불필요
  if (
    evt.shiftKey &&
    endElement.areaId &&
    endElement.areaId !== elementList[endIndex + 1]?.areaId
  ) {
    enterText = omitObject(enterText, AREA_CONTEXT_ATTR)
  }
  // 제목 끝에서 엔터 시 포맷팅 및 스타일 복사 불필요
  if (
    !(
      endElement.titleId &&
      endElement.titleId !== elementList[endIndex + 1]?.titleId
    )
  ) {
    // 스타일 속성 복사
    const copyElement = rangeManager.getRangeAnchorStyle(elementList, endIndex)
    if (copyElement) {
      const copyAttr = [...EDITOR_ROW_ATTR]
      // 컴트롤 접미사 스타일 복사 안 함
      if (copyElement.controlComponent !== ControlComponent.POSTFIX) {
        copyAttr.push(...EDITOR_ELEMENT_STYLE_ATTR)
      }
      copyAttr.forEach(attr => {
        const value = copyElement[attr] as never
        if (value !== undefined) {
          enterText[attr] = value
        }
      })
    }
  }
  // 컴트롤 또는 문서에 개행 요소 삽입
  const control = draw.getControl()
  const activeControl = control.getActiveControl()
  let curIndex: number
  if (activeControl && control.getIsRangeWithinControl()) {
    curIndex = control.setValue([enterText])
    control.emitControlContentChange()
  } else {
    const position = draw.getPosition()
    const cursorPosition = position.getCursorPosition()
    if (!cursorPosition) return
    const { index } = cursorPosition
    if (isCollapsed) {
      draw.spliceElementList(elementList, index + 1, 0, [enterText])
    } else {
      draw.spliceElementList(
        elementList,
        startIndex + 1,
        endIndex - startIndex,
        [enterText]
      )
    }
    curIndex = index + 1
  }
  if (~curIndex) {
    rangeManager.setRange(curIndex, curIndex)
    draw.render({ curIndex })
  }
  evt.preventDefault()
}
