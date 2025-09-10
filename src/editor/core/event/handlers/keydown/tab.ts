import { EDITOR_ELEMENT_STYLE_ATTR } from '../../../../dataset/constant/Element'
import { ElementType } from '../../../../dataset/enum/Element'
import { MoveDirection } from '../../../../dataset/enum/Observer'
import { IElement } from '../../../../interface/Element'
import { pickObject } from '../../../../utils'
import { formatElementContext } from '../../../../utils/element'
import { CanvasEvent } from '../../CanvasEvent'

export function tab(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  evt.preventDefault()
  // 컨트롤 컨텍스트에서 tab 키로 컨트롤 간 이동 제어
  const control = draw.getControl()
  const activeControl = control.getActiveControl()
  if (activeControl && control.getIsRangeWithinControl()) {
    control.initNextControl({
      direction: evt.shiftKey ? MoveDirection.UP : MoveDirection.DOWN
    })
  } else {
    const rangeManager = draw.getRange()
    const elementList = draw.getElementList()
    const { startIndex, endIndex } = rangeManager.getRange()
    // tab 문자 삽입
    const anchorStyle = rangeManager.getRangeAnchorStyle(elementList, endIndex)
    // 스타일만 복사
    const copyStyle = anchorStyle
      ? pickObject(anchorStyle, EDITOR_ELEMENT_STYLE_ATTR)
      : null
    const tabElement: IElement = {
      ...copyStyle,
      type: ElementType.TAB,
      value: ''
    }
    formatElementContext(elementList, [tabElement], startIndex, {
      editorOptions: draw.getOptions()
    })
    draw.insertElementList([tabElement])
  }
}
