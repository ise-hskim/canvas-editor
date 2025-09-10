import { ImageDisplay } from '../../../dataset/enum/Common'
import { ElementType } from '../../../dataset/enum/Element'
import { findParent } from '../../../utils'
import { CanvasEvent } from '../CanvasEvent'

function dragover(evt: DragEvent | MouseEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  evt.preventDefault()
  // 비에디터 영역에서 드래그 앤 드롭 금지
  const pageContainer = draw.getPageContainer()
  const editorRegion = findParent(
    evt.target as Element,
    (node: Element) => node === pageContainer,
    true
  )
  if (!editorRegion) return
  const target = evt.target as HTMLDivElement
  const pageIndex = target.dataset.index
  // pageNo 설정
  if (pageIndex) {
    draw.setPageNo(Number(pageIndex))
  }
  const position = draw.getPosition()
  const positionContext = position.adjustPositionContext({
    x: evt.offsetX,
    y: evt.offsetY
  })
  if (!positionContext) return
  const { isTable, tdValueIndex, index } = positionContext
  // 선택 영역 및 커서 위치 설정
  const positionList = position.getPositionList()
  const curIndex = isTable ? tdValueIndex! : index
  if (~index) {
    const rangeManager = draw.getRange()
    rangeManager.setRange(curIndex, curIndex)
    position.setCursorPosition(positionList[curIndex])
  }
  const cursor = draw.getCursor()
  const {
    cursor: { dragColor, dragWidth, dragFloatImageDisabled }
  } = draw.getOptions()
  // 드래그한 이미지에 커서 위치 지정 여부
  if (dragFloatImageDisabled) {
    const dragElement = host.cacheElementList?.[host.cacheRange!.startIndex]
    if (
      dragElement?.type === ElementType.IMAGE &&
      (dragElement.imgDisplay === ImageDisplay.FLOAT_TOP ||
        dragElement.imgDisplay === ImageDisplay.FLOAT_BOTTOM ||
        dragElement.imgDisplay === ImageDisplay.SURROUND)
    ) {
      return
    }
  }
  cursor.drawCursor({
    width: dragWidth,
    color: dragColor,
    isBlink: false,
    isFocus: false
  })
}

export default {
  dragover
}
