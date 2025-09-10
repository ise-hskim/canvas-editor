import {
  CONTROL_CONTEXT_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR
} from '../../../dataset/constant/Element'
import { ImageDisplay } from '../../../dataset/enum/Common'
import { ControlComponent, ControlType } from '../../../dataset/enum/Control'
import { ElementType } from '../../../dataset/enum/Element'
import { IElement } from '../../../interface/Element'
import { deepClone, getUUID, omitObject } from '../../../utils'
import { formatElementContext, formatElementList } from '../../../utils/element'
import { CanvasEvent } from '../CanvasEvent'

type IDragElement = IElement & { dragId: string }

function createDragId(element: IElement): string {
  const dragId = getUUID()
  Reflect.set(element, 'dragId', dragId)
  return dragId
}

function getElementIndexByDragId(dragId: string, elementList: IElement[]) {
  return (<IDragElement[]>elementList).findIndex(el => el.dragId === dragId)
}

// 플로팅 이미지 위치 이동
function moveImgPosition(
  element: IElement,
  evt: MouseEvent,
  host: CanvasEvent
) {
  const draw = host.getDraw()
  if (
    element.imgDisplay === ImageDisplay.SURROUND ||
    element.imgDisplay === ImageDisplay.FLOAT_TOP ||
    element.imgDisplay === ImageDisplay.FLOAT_BOTTOM
  ) {
    const moveX = evt.offsetX - host.mouseDownStartPosition!.x!
    const moveY = evt.offsetY - host.mouseDownStartPosition!.y!
    const imgFloatPosition = element.imgFloatPosition!
    element.imgFloatPosition = {
      x: imgFloatPosition.x + moveX,
      y: imgFloatPosition.y + moveY,
      pageNo: draw.getPageNo()
    }
  }
  draw.getImageParticle().destroyFloatImage()
}

export function mouseup(evt: MouseEvent, host: CanvasEvent) {
  // 드래그 및 드롭 허용 여부 판단
  if (host.isAllowDrop) {
    const draw = host.getDraw()
    if (draw.isReadonly() || draw.isDisabled()) {
      host.mousedown(evt)
      return
    }
    const position = draw.getPosition()
    const positionList = position.getPositionList()
    const positionContext = position.getPositionContext()
    const rangeManager = draw.getRange()
    const cacheRange = host.cacheRange!
    const cacheElementList = host.cacheElementList!
    const cachePositionList = host.cachePositionList!
    const cachePositionContext = host.cachePositionContext
    const range = rangeManager.getRange()
    // 캐시된 선택 영역 정보
    const isCacheRangeCollapsed = cacheRange.startIndex === cacheRange.endIndex
    // 선택 영역이 닫혀 있을 때, 시작 위치를 앞으로 한 칸 이동하여 확장 선택
    const cacheStartIndex = isCacheRangeCollapsed
      ? cacheRange.startIndex - 1
      : cacheRange.startIndex
    const cacheEndIndex = cacheRange.endIndex
    // 드래그 필요 여부 - 위치 변경 여부
    if (
      range.startIndex >= cacheStartIndex &&
      range.endIndex <= cacheEndIndex &&
      host.cachePositionContext?.tdId === positionContext.tdId
    ) {
      // 렌더링 부작용 제거
      draw.clearSideEffect()
      // 플로팅 요소 드래그 시 히스토리 제출 필요
      let isSubmitHistory = false
      let isCompute = false
      if (isCacheRangeCollapsed) {
        // 이미지 이동
        const dragElement = cacheElementList[cacheEndIndex]
        if (
          dragElement.type === ElementType.IMAGE ||
          dragElement.type === ElementType.LATEX
        ) {
          moveImgPosition(dragElement, evt, host)
          if (
            dragElement.imgDisplay === ImageDisplay.SURROUND ||
            dragElement.imgDisplay === ImageDisplay.FLOAT_TOP ||
            dragElement.imgDisplay === ImageDisplay.FLOAT_BOTTOM
          ) {
            draw.getPreviewer().drawResizer(dragElement)
            isSubmitHistory = true
          } else {
            const cachePosition = cachePositionList[cacheEndIndex]
            draw.getPreviewer().drawResizer(dragElement, cachePosition)
          }
          // 사방면 텍스트 래핑 요소는 계산 필요
          isCompute = dragElement.imgDisplay === ImageDisplay.SURROUND
        }
      }
      rangeManager.replaceRange({
        ...cacheRange
      })
      draw.render({
        isCompute,
        isSubmitHistory,
        isSetCursor: false
      })
      return
    }
    // 드래그할 수 없는 컨트롤 구조 요소인지 확인
    const dragElementList = cacheElementList.slice(
      cacheStartIndex + 1,
      cacheEndIndex + 1
    )
    const isContainControl = dragElementList.find(element => element.controlId)
    if (isContainControl) {
      // (첫 번째/마지막 요소가 컨트롤이 아님 || 컨트롤 전후 || 텍스트 컨트롤이며 값임) 드래그만 허용
      const cacheStartElement = cacheElementList[cacheStartIndex + 1]
      const cacheEndElement = cacheElementList[cacheEndIndex]
      const isAllowDragControl =
        ((!cacheStartElement.controlId ||
          cacheStartElement.controlComponent === ControlComponent.PREFIX) &&
          (!cacheEndElement.controlId ||
            cacheEndElement.controlComponent === ControlComponent.POSTFIX)) ||
        (cacheStartElement.controlId === cacheEndElement.controlId &&
          cacheStartElement.controlComponent === ControlComponent.PREFIX &&
          cacheEndElement.controlComponent === ControlComponent.POSTFIX) ||
        (cacheStartElement.control?.type === ControlType.TEXT &&
          cacheStartElement.controlComponent === ControlComponent.VALUE &&
          cacheEndElement.control?.type === ControlType.TEXT &&
          cacheEndElement.controlComponent === ControlComponent.VALUE)
      if (!isAllowDragControl) {
        draw.render({
          curIndex: range.startIndex,
          isCompute: false,
          isSubmitHistory: false
        })
        return
      }
    }
    // 요소 포맷팅
    const control = draw.getControl()
    const elementList = draw.getElementList()
    // 컨트롤 속성 제외 여부(1.컨트롤 미포함 2.새 위치가 컨트롤 내부 3.선택 영역이 완전한 컨트롤 미포함)
    const isOmitControlAttr =
      !isContainControl ||
      !!elementList[range.startIndex].controlId ||
      !control.getIsElementListContainFullControl(dragElementList)
    const editorOptions = draw.getOptions()
    // 요소 속성 복사(1.텍스트는 스타일 및 관련 컨텍스트 추출 2.비텍스트는 관련 컨텍스트 제외)
    const replaceElementList = dragElementList.map(el => {
      if (!el.type || el.type === ElementType.TEXT) {
        const newElement: IElement = {
          value: el.value
        }
        const copyAttr = EDITOR_ELEMENT_STYLE_ATTR
        if (!isOmitControlAttr) {
          copyAttr.push(...CONTROL_CONTEXT_ATTR)
        }
        copyAttr.forEach(attr => {
          const value = el[attr] as never
          if (value !== undefined) {
            newElement[attr] = value
          }
        })
        return newElement
      } else {
        let newElement = deepClone(el)
        if (isOmitControlAttr) {
          newElement = omitObject(newElement, CONTROL_CONTEXT_ATTR)
        }
        formatElementList([newElement], {
          isHandleFirstElement: false,
          editorOptions
        })
        return newElement
      }
    })
    formatElementContext(elementList, replaceElementList, range.startIndex, {
      editorOptions: draw.getOptions()
    })
    // 드래그 선택 영역의 시작 요소, 위치, 시작/종료 ID 캐시
    const cacheStartElement = cacheElementList[cacheStartIndex]
    const cacheStartPosition = cachePositionList[cacheStartIndex]
    const cacheRangeStartId = createDragId(cacheElementList[cacheStartIndex])
    const cacheRangeEndId = createDragId(cacheElementList[cacheEndIndex])
    // 드래그 값 설정
    const replaceLength = replaceElementList.length
    let rangeStart = range.startIndex
    let rangeEnd = rangeStart + replaceLength
    const activeControl = control.getActiveControl()
    if (
      activeControl &&
      cacheElementList[rangeStart].controlComponent !== ControlComponent.POSTFIX
    ) {
      rangeEnd = activeControl.setValue(replaceElementList)
      rangeStart = rangeEnd - replaceLength
    } else {
      draw.spliceElementList(elementList, rangeStart + 1, 0, replaceElementList)
    }
    if (!~rangeEnd) {
      draw.render({
        isSetCursor: false
      })
      return
    }
    // 현재 시작/종료 ID 캐시
    const rangeStartId = createDragId(elementList[rangeStart])
    const rangeEndId = createDragId(elementList[rangeEnd])
    // 기존 드래그 요소 삭제
    const cacheRangeStartIndex = getElementIndexByDragId(
      cacheRangeStartId,
      cacheElementList
    )
    const cacheRangeEndIndex = getElementIndexByDragId(
      cacheRangeEndId,
      cacheElementList
    )
    const cacheEndElement = cacheElementList[cacheRangeEndIndex]
    if (
      cacheEndElement.controlId &&
      cacheEndElement.controlComponent !== ControlComponent.POSTFIX
    ) {
      rangeManager.replaceRange({
        ...cacheRange,
        startIndex: cacheRangeStartIndex,
        endIndex: cacheRangeEndIndex
      })
      control.getActiveControl()?.cut()
    } else {
      // td 삭제 불가능 여부 판단
      let isTdElementDeletable = true
      if (cachePositionContext?.isTable) {
        const { tableId, trIndex, tdIndex } = cachePositionContext
        const originElementList = draw.getOriginalElementList()
        isTdElementDeletable = !originElementList.some(
          el =>
            el.id === tableId &&
            el?.trList?.[trIndex!]?.tdList?.[tdIndex!]?.deletable === false
        )
      }
      if (isTdElementDeletable) {
        draw.spliceElementList(
          cacheElementList,
          cacheRangeStartIndex + 1,
          cacheRangeEndIndex - cacheRangeStartIndex
        )
      }
    }
    // 컨텍스트 재설정
    const startElement = elementList[range.startIndex]
    const startPosition = positionList[range.startIndex]
    let positionContextIndex = positionContext.index
    if (positionContextIndex) {
      if (startElement.tableId && !cacheStartElement.tableId) {
        // 테이블 외부에서 테이블 내부로 이동 && 테이블 앞에
        if (cacheStartPosition.index < positionContextIndex) {
          positionContextIndex -= replaceLength
        }
      } else if (!startElement.tableId && cacheStartElement.tableId) {
        // 테이블 내부에서 테이블 외부로 이동 && 테이블 앞에
        if (startPosition.index < positionContextIndex) {
          positionContextIndex += replaceLength
        }
      }
      position.setPositionContext({
        ...positionContext,
        index: positionContextIndex
      })
    }
    // 선택 영역 재설정
    const rangeStartIndex = getElementIndexByDragId(rangeStartId, elementList)
    const rangeEndIndex = getElementIndexByDragId(rangeEndId, elementList)
    rangeManager.setRange(
      isCacheRangeCollapsed ? rangeEndIndex : rangeStartIndex,
      rangeEndIndex,
      range.tableId,
      range.startTdIndex,
      range.endTdIndex,
      range.startTrIndex,
      range.endTrIndex
    )
    // 렌더링 부작용 제거
    draw.clearSideEffect()
    // 이미지 이동
    let imgElement: IElement | null = null
    if (isCacheRangeCollapsed) {
      const elementList = draw.getElementList()
      const dragElement = elementList[rangeEndIndex]
      if (
        dragElement.type === ElementType.IMAGE ||
        dragElement.type === ElementType.LATEX
      ) {
        moveImgPosition(dragElement, evt, host)
        imgElement = dragElement
      }
    }
    // 다시 렌더링
    draw.render({
      isSetCursor: false
    })
    // 컨트롤 값 변경 콜백
    if (activeControl) {
      control.emitControlContentChange()
    } else if (cacheStartElement.controlId) {
      control.emitControlContentChange({
        context: {
          range: cacheRange,
          elementList: cacheElementList
        },
        controlElement: cacheStartElement
      })
    }
    // 드래그 후 이미지 도구 렌더링
    if (imgElement) {
      if (
        imgElement.imgDisplay === ImageDisplay.SURROUND ||
        imgElement.imgDisplay === ImageDisplay.FLOAT_TOP ||
        imgElement.imgDisplay === ImageDisplay.FLOAT_BOTTOM
      ) {
        draw.getPreviewer().drawResizer(imgElement)
      } else {
        const dragPositionList = position.getPositionList()
        const dragPosition = dragPositionList[rangeEndIndex]
        draw.getPreviewer().drawResizer(imgElement, dragPosition)
      }
    }
  } else if (host.isAllowDrag) {
    // 드래그 허용, 드롭 불허(선택 영역 클릭 시 커서 닫힘)인 경우 커서 재설정
    if (host.cacheRange?.startIndex !== host.cacheRange?.endIndex) {
      host.mousedown(evt)
    }
  }
}
