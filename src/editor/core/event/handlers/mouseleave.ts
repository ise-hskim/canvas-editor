import { CanvasEvent } from '../CanvasEvent'

export function mouseleave(evt: MouseEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  // 마우스가 페이지를 벗어날 때 선택 영역 비활성화
  if (!draw.getOptions().pageOuterSelectionDisable) return
  // 아직 캔버스 내부에 있는지 여부
  const pageContainer = draw.getPageContainer()
  const { x, y, width, height } = pageContainer.getBoundingClientRect()
  if (evt.x >= x && evt.x <= x + width && evt.y >= y && evt.y <= y + height) {
    return
  }
  host.setIsAllowSelection(false)
}
