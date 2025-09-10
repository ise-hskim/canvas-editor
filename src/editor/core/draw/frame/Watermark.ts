import { IEditorOption } from '../../..'
import { FORMAT_PLACEHOLDER } from '../../../dataset/constant/PageNumber'
import { WatermarkType } from '../../../dataset/enum/Watermark'
import { DeepRequired } from '../../../interface/Common'
import { Draw } from '../Draw'
import { PageNumber } from './PageNumber'

export class Watermark {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private imageCache: Map<string, HTMLImageElement>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = <DeepRequired<IEditorOption>>draw.getOptions()
    this.imageCache = new Map()
  }

  public renderText(ctx: CanvasRenderingContext2D, pageNo: number) {
    const {
      watermark: { data, opacity, font, size, color, repeat, gap, numberType },
      scale
    } = this.options
    const width = this.draw.getWidth()
    const height = this.draw.getHeight()
    // 그리기 시작
    ctx.save()
    ctx.globalAlpha = opacity
    ctx.font = `${size * scale}px ${font}`
    // 텍스트 포맷
    let text = data
    const pageNoReg = new RegExp(FORMAT_PLACEHOLDER.PAGE_NO)
    if (pageNoReg.test(text)) {
      text = PageNumber.formatNumberPlaceholder(
        text,
        pageNo + 1,
        pageNoReg,
        numberType
      )
    }
    const pageCountReg = new RegExp(FORMAT_PLACEHOLDER.PAGE_COUNT)
    if (pageCountReg.test(text)) {
      text = PageNumber.formatNumberPlaceholder(
        text,
        this.draw.getPageCount(),
        pageCountReg,
        numberType
      )
    }
    // 길이 측정 및 그리기
    const measureText = ctx.measureText(text)
    if (repeat) {
      const dpr = this.draw.getPagePixelRatio()
      const temporaryCanvas = document.createElement('canvas')
      const temporaryCtx = temporaryCanvas.getContext('2d')!
      // 피타고라스 정리로 회전 후 대각선 크기 계산 a^2 + b^2 = c^2
      const textWidth = measureText.width
      const textHeight =
        measureText.actualBoundingBoxAscent +
        measureText.actualBoundingBoxDescent
      const diagonalLength = Math.sqrt(
        Math.pow(textWidth, 2) + Math.pow(textHeight, 2)
      )
      // gap 간격 추가
      const patternWidth = diagonalLength + 2 * gap[0] * scale
      const patternHeight = diagonalLength + 2 * gap[1] * scale
      // 너비와 높이 설정
      temporaryCanvas.width = patternWidth
      temporaryCanvas.height = patternHeight
      temporaryCanvas.style.width = `${patternWidth * dpr}px`
      temporaryCanvas.style.height = `${patternHeight * dpr}px`
      // 45도 회전
      temporaryCtx.translate(patternWidth / 2, patternHeight / 2)
      temporaryCtx.rotate((-45 * Math.PI) / 180)
      temporaryCtx.translate(-patternWidth / 2, -patternHeight / 2)
      // 텍스트 그리기
      temporaryCtx.font = `${size * scale}px ${font}`
      temporaryCtx.fillStyle = color
      temporaryCtx.fillText(
        text,
        (patternWidth - textWidth) / 2,
        (patternHeight - textHeight) / 2 + measureText.actualBoundingBoxAscent
      )
      // 타일 패턴 생성
      const pattern = ctx.createPattern(temporaryCanvas, 'repeat')
      if (pattern) {
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, width, height)
      }
    } else {
      const x = width / 2
      const y = height / 2
      ctx.fillStyle = color
      ctx.translate(x, y)
      ctx.rotate((-45 * Math.PI) / 180)
      ctx.fillText(
        text,
        -measureText.width / 2,
        measureText.actualBoundingBoxAscent - (size * scale) / 2
      )
    }
    ctx.restore()
  }

  public renderImage(ctx: CanvasRenderingContext2D) {
    const {
      watermark: { width, height, data, opacity, repeat, gap },
      scale
    } = this.options
    if (!this.imageCache.has(data)) {
      const img = new Image()
      img.setAttribute('crossOrigin', 'Anonymous')
      img.src = data
      img.onload = () => {
        this.imageCache.set(data, img)
        // 레이어 바로 뜨지 않도록 하여 에디터 재렌더링 트리거 방지
        this.draw.render({
          isCompute: false,
          isSubmitHistory: false
        })
      }
      return
    }
    const docWidth = this.draw.getWidth()
    const docHeight = this.draw.getHeight()
    const imageWidth = width * scale
    const imageHeight = height * scale
    // 그리기 시작
    ctx.save()
    ctx.globalAlpha = opacity
    if (repeat) {
      const dpr = this.draw.getPagePixelRatio()
      const temporaryCanvas = document.createElement('canvas')
      const temporaryCtx = temporaryCanvas.getContext('2d')!
      // 피타고라스 정리로 회전 후 대각선 크기 계산 a^2 + b^2 = c^2
      const diagonalLength = Math.sqrt(
        Math.pow(imageWidth, 2) + Math.pow(imageHeight, 2)
      )
      // gap 간격 추가
      const patternWidth = diagonalLength + 2 * gap[0] * scale
      const patternHeight = diagonalLength + 2 * gap[1] * scale
      // 너비와 높이 설정
      temporaryCanvas.width = patternWidth
      temporaryCanvas.height = patternHeight
      temporaryCanvas.style.width = `${patternWidth * dpr}px`
      temporaryCanvas.style.height = `${patternHeight * dpr}px`
      // 45도 회전
      temporaryCtx.translate(patternWidth / 2, patternHeight / 2)
      temporaryCtx.rotate((-45 * Math.PI) / 180)
      temporaryCtx.translate(-patternWidth / 2, -patternHeight / 2)
      // 이미지 그리기
      temporaryCtx.drawImage(
        this.imageCache.get(data)!,
        (patternWidth - imageWidth) / 2,
        (patternHeight - imageHeight) / 2,
        imageWidth,
        imageHeight
      )
      // 타일 패턴 생성
      const pattern = ctx.createPattern(temporaryCanvas, 'repeat')
      if (pattern) {
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, docWidth, docHeight)
      }
    } else {
      const x = docWidth / 2
      const y = docHeight / 2
      ctx.translate(x, y)
      ctx.rotate((-45 * Math.PI) / 180)
      ctx.drawImage(
        this.imageCache.get(data)!,
        -imageWidth / 2,
        -imageHeight / 2,
        imageWidth,
        imageHeight
      )
    }
    ctx.restore()
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    if (this.options.watermark.type === WatermarkType.IMAGE) {
      this.renderImage(ctx)
    } else {
      this.renderText(ctx, pageNo)
    }
  }
}
