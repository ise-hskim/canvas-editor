import { AbstractRichText } from './AbstractRichText'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'
import { DashType, TextDecorationStyle } from '../../../dataset/enum/Text'

export class Underline extends AbstractRichText {
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    super()
    this.options = draw.getOptions()
  }

  // 밑줄
  private _drawLine(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    width: number,
    dashType?: DashType
  ) {
    const endX = startX + width
    ctx.beginPath()
    switch (dashType) {
      case DashType.DASHED:
        // 긴 대시선 - - - - - -
        ctx.setLineDash([3, 1])
        break
      case DashType.DOTTED:
        // 점 대시선 . . . . . .
        ctx.setLineDash([1, 1])
        break
    }
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, startY)
    ctx.stroke()
  }

  // 이중 실선
  private _drawDouble(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    width: number
  ) {
    const SPACING = 3 // 이중 실선 간격
    const endX = startX + width
    const endY = startY + SPACING * this.options.scale
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, startY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(startX, endY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  }

  // 물결선
  private _drawWave(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    width: number
  ) {
    const { scale } = this.options
    const AMPLITUDE = 1.2 * scale // 진폭
    const FREQUENCY = 1 / scale // 주파수
    const adjustY = startY + 2 * AMPLITUDE // 2배 진폭 증가
    ctx.beginPath()
    for (let x = 0; x < width; x++) {
      const y = AMPLITUDE * Math.sin(FREQUENCY * x)
      ctx.lineTo(startX + x, adjustY + y)
    }
    ctx.stroke()
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.fillRect.width) return
    const { underlineColor, scale } = this.options
    const { x, y, width } = this.fillRect
    ctx.save()
    ctx.strokeStyle = this.fillColor || underlineColor
    ctx.lineWidth = scale
    const adjustY = Math.floor(y + 2 * ctx.lineWidth) + 0.5 // +0.5로 1에서 렌더링하여 선 너비가 3이 되는 것을 방지
    switch (this.fillDecorationStyle) {
      case TextDecorationStyle.WAVY:
        this._drawWave(ctx, x, adjustY, width)
        break
      case TextDecorationStyle.DOUBLE:
        this._drawDouble(ctx, x, adjustY, width)
        break
      case TextDecorationStyle.DASHED:
        this._drawLine(ctx, x, adjustY, width, DashType.DASHED)
        break
      case TextDecorationStyle.DOTTED:
        this._drawLine(ctx, x, adjustY, width, DashType.DOTTED)
        break
      default:
        this._drawLine(ctx, x, adjustY, width)
        break
    }
    ctx.restore()
    this.clearFillInfo()
  }
}
