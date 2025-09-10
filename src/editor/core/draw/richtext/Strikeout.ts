import { AbstractRichText } from './AbstractRichText'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

export class Strikeout extends AbstractRichText {
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    super()
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.fillRect.width) return
    const { scale, strikeoutColor } = this.options
    const { x, y, width } = this.fillRect
    ctx.save()
    ctx.lineWidth = scale
    ctx.strokeStyle = strikeoutColor
    const adjustY = y + 0.5 // 1에서 렌더링하여 선 너비가 3이 되는 것을 방지
    ctx.beginPath()
    ctx.moveTo(x, adjustY)
    ctx.lineTo(x + width, adjustY)
    ctx.stroke()
    ctx.restore()
    this.clearFillInfo()
  }
}
