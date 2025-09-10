import { IAreaBadge, IBadge } from '../../../interface/Badge'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

export class Badge {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private imageCache: Map<string, HTMLImageElement>
  private mainBadge: IBadge | null
  private areaBadgeMap: Map<string, IBadge>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.imageCache = new Map()
    this.mainBadge = null
    this.areaBadgeMap = new Map()
  }

  public setMainBadge(payload: IBadge | null) {
    this.mainBadge = payload
  }

  public setAreaBadgeMap(payload: IAreaBadge[]) {
    this.areaBadgeMap.clear()
    payload.forEach(areaBadge => {
      this.areaBadgeMap.set(areaBadge.areaId, areaBadge.badge)
    })
  }

  private _drawImage(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    value: string
  ) {
    if (this.imageCache.has(value)) {
      const img = this.imageCache.get(value)!
      ctx.drawImage(img, x, y, width, height)
    } else {
      const img = new Image()
      img.setAttribute('crossOrigin', 'Anonymous')
      img.src = value
      img.onload = () => {
        this.imageCache.set(value, img)
        ctx.drawImage(img, x, y, width, height)
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    // 문서 도장
    if (pageNo === 0 && this.mainBadge) {
      const { scale, badge } = this.options
      const { left, top, width, height, value } = this.mainBadge
      // 기본적으로 페이지 헤더 아래부터 시작
      const headerTop =
        this.draw.getMargins()[0] + this.draw.getHeader().getExtraHeight()
      const x = (left || badge.left) * scale
      const y = (top || badge.top) * scale + headerTop
      this._drawImage(ctx, x, y, width * scale, height * scale, value)
    }
    // 영역 도장
    if (this.areaBadgeMap.size) {
      const areaInfo = this.draw.getArea().getAreaInfo()
      if (areaInfo.size) {
        const { scale, badge } = this.options
        for (const areaItem of areaInfo) {
          // 비현재 페이지 영역 무시
          const { positionList } = areaItem[1]
          const firstPosition = positionList[0]
          if (firstPosition.pageNo !== pageNo) continue
          // 도장이 설정되지 않은 영역 무시
          const badgeItem = this.areaBadgeMap.get(areaItem[0])
          if (!badgeItem) continue
          const { left, top, width, height, value } = badgeItem
          const x = (left || badge.left) * scale
          const y =
            (top || badge.top) * scale + firstPosition.coordinate.leftTop[1]
          this._drawImage(ctx, x, y, width * scale, height * scale, value)
        }
      }
    }
  }
}
