import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'
import { Footer } from './Footer'
import { Header } from './Header'

export class PageBorder {
  private draw: Draw
  private header: Header
  private footer: Footer
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.header = draw.getHeader()
    this.footer = draw.getFooter()
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D) {
    const {
      scale,
      pageBorder: { color, lineWidth, padding }
    } = this.options
    ctx.save()
    ctx.translate(0.5, 0.5)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth * scale
    const margins = this.draw.getMargins()
    // x: 왼쪽 여백 - 본문과의 왼쪽 거리
    const x = margins[3] - padding[3] * scale
    // y: 헤더 상단 여백 + 헤더 높이 - 본문과의 상단 거리
    const y = margins[0] + this.header.getExtraHeight() - padding[0] * scale
    // width: 페이지 너비 + 본문과의 좌우 거리
    const width = this.draw.getInnerWidth() + (padding[1] + padding[3]) * scale
    // height: 페이지 높이 - 본문 시작 위치 - 푸터 높이 - 하단 여백 - 본문과의 하단 거리
    const height =
      this.draw.getHeight() -
      y -
      this.footer.getExtraHeight() -
      margins[2] +
      padding[2] * scale
    ctx.rect(x, y, width, height)
    ctx.stroke()
    ctx.restore()
  }
}
