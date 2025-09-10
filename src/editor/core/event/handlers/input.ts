import { ZERO } from '../../../dataset/constant/Common'
import {
  EDITOR_ELEMENT_COPY_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR
} from '../../../dataset/constant/Element'
import { ElementType } from '../../../dataset/enum/Element'
import { IElement } from '../../../interface/Element'
import { IRangeElementStyle } from '../../../interface/Range'
import { splitText } from '../../../utils'
import { formatElementContext } from '../../../utils/element'
import { CanvasEvent } from '../CanvasEvent'

export function input(data: string, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly() || draw.isDisabled()) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!data || !cursorPosition) return
  const isComposing = host.isComposing
  // 텍스트 합성 중 비입력 작업 수행
  if (isComposing && host.compositionInfo?.value === data) return
  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return
  // 합성 제거 전, 설정된 기본 스타일 설정 캐시
  const defaultStyle =
    rangeManager.getDefaultStyle() || host.compositionInfo?.defaultStyle || null
  // 합성 입력 제거
  removeComposingInput(host)
  if (!isComposing) {
    const cursor = draw.getCursor()
    cursor.clearAgentDomValue()
  }
  const { TEXT, HYPERLINK, SUBSCRIPT, SUPERSCRIPT, DATE, TAB } = ElementType
  const text = data.replaceAll(`\n`, ZERO)
  const { startIndex, endIndex } = rangeManager.getRange()
  // 요소 포맷팅
  const elementList = draw.getElementList()
  const copyElement = rangeManager.getRangeAnchorStyle(elementList, endIndex)
  if (!copyElement) return
  const isDesignMode = draw.isDesignMode()
  const inputData: IElement[] = splitText(text).map(value => {
    const newElement: IElement = {
      value
    }
    if (
      isDesignMode ||
      (!copyElement.title?.disabled && !copyElement.control?.disabled)
    ) {
      const nextElement = elementList[endIndex + 1]
      // 텍스트, 하이퍼링크, 날짜, 위아래 첨자: 모든 정보 복사 (요소 유형, 스타일, 특수 속성)
      if (
        !copyElement.type ||
        copyElement.type === TEXT ||
        (copyElement.type === HYPERLINK && nextElement?.type === HYPERLINK) ||
        (copyElement.type === DATE && nextElement?.type === DATE) ||
        (copyElement.type === SUBSCRIPT && nextElement?.type === SUBSCRIPT) ||
        (copyElement.type === SUPERSCRIPT && nextElement?.type === SUPERSCRIPT)
      ) {
        EDITOR_ELEMENT_COPY_ATTR.forEach(attr => {
          // 그룹 외부에서는 그룹 정보 복사 불필요
          if (attr === 'groupIds' && !nextElement?.groupIds) return
          const value = copyElement[attr] as never
          if (value !== undefined) {
            newElement[attr] = value
          }
        })
      }
      // 스타일만 복사: 기본 스타일 설정이 있거나 || 텍스트 유형 요소와 매치할 수 없는 경우 (TAB)
      if (defaultStyle || copyElement.type === TAB) {
        EDITOR_ELEMENT_STYLE_ATTR.forEach(attr => {
          const value =
            defaultStyle?.[attr as keyof IRangeElementStyle] ||
            copyElement[attr]
          if (value !== undefined) {
            newElement[attr] = value as never
          }
        })
      }
      if (isComposing) {
        newElement.underline = true
      }
    }
    return newElement
  })
  // 컨트롤 - placeholder 제거
  const control = draw.getControl()
  let curIndex: number
  if (control.getActiveControl() && control.getIsRangeWithinControl()) {
    curIndex = control.setValue(inputData)
    if (!isComposing) {
      control.emitControlContentChange()
    }
  } else {
    const start = startIndex + 1
    if (startIndex !== endIndex) {
      draw.spliceElementList(elementList, start, endIndex - startIndex)
    }
    formatElementContext(elementList, inputData, startIndex, {
      editorOptions: draw.getOptions()
    })
    draw.spliceElementList(elementList, start, 0, inputData)
    curIndex = startIndex + inputData.length
  }
  if (~curIndex) {
    rangeManager.setRange(curIndex, curIndex)
    draw.render({
      curIndex,
      isSubmitHistory: !isComposing
    })
  }
  if (isComposing) {
    host.compositionInfo = {
      elementList,
      value: text,
      startIndex: curIndex - inputData.length,
      endIndex: curIndex,
      defaultStyle
    }
  }
}

export function removeComposingInput(host: CanvasEvent) {
  if (!host.compositionInfo) return
  const { elementList, startIndex, endIndex } = host.compositionInfo
  elementList.splice(startIndex + 1, endIndex - startIndex)
  const rangeManager = host.getDraw().getRange()
  rangeManager.setRange(startIndex, startIndex)
  host.compositionInfo = null
}
