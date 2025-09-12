import { ElementType } from '../../../editor/dataset/enum/Element'
import { IElement } from '../../../editor/interface/Element'
import { IHWPXNode as HWPXNode } from '../types'
import { BaseProcessor, ProcessorContext } from './BaseProcessor'

/**
 * 구분선 요소 처리 Processor
 * HWPX의 구분선 관련 노드를 Canvas Editor의 SEPARATOR 요소로 변환
 */
export class SeparatorProcessor extends BaseProcessor {
  supportedTags = ['hr', 'separator', 'line', 'hp:hr', 'hp:separator', 'hp:line', 'pageBreak', 'columnBreak']

  process(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []

    // 페이지 구분
    if (node.tag === 'pageBreak' || this.getAttribute(node, 'pageBreak') === '1') {
      const pageBreakElement: IElement = {
        type: ElementType.PAGE_BREAK,
        value: ''
      }
      elements.push(pageBreakElement)
      return elements
    }

    // 구분선 요소 생성
    const separatorElement: IElement = {
      type: ElementType.SEPARATOR,
      value: ''
    }

    // 구분선 스타일 추출
    const style = this.extractSeparatorStyle(node)
    if (style) {
      Object.assign(separatorElement, style)
    }

    // ID 생성
    if (context?.generateId) {
      separatorElement.id = context.generateId()
    }

    elements.push(separatorElement)

    return elements
  }

  /**
   * 구분선 스타일 추출
   */
  private extractSeparatorStyle(node: HWPXNode): Partial<IElement> | null {
    const style: Partial<IElement> = {}

    // 선 스타일
    const lineStyle = this.getAttribute(node, 'lineStyle') || this.getAttribute(node, 'style')
    if (lineStyle) {
      // TODO: 선 스타일 매핑
      // solid, dashed, dotted 등
    }

    // 선 두께
    const lineWidth = this.getAttribute(node, 'lineWidth') || this.getAttribute(node, 'width')
    if (lineWidth) {
      style.width = this.convertSize(lineWidth)
    }

    // 선 색상
    const lineColor = this.getAttribute(node, 'lineColor') || this.getAttribute(node, 'color')
    if (lineColor) {
      style.color = this.convertColor(lineColor)
    }

    // 정렬
    const align = this.getAttribute(node, 'align')
    if (align) {
      // TODO: 정렬 처리
    }

    return Object.keys(style).length > 0 ? style : null
  }

  /**
   * 크기 변환
   */
  private convertSize(size: string): number {
    const value = parseFloat(size)
    if (isNaN(value)) return 1 // 기본값

    // pt to px
    if (size.includes('pt')) {
      return Math.round(value * 96 / 72)
    }

    return Math.round(value)
  }

  /**
   * 색상 변환
   */
  private convertColor(color: string): string {
    if (color.startsWith('#')) {
      return color
    }

    // BGR to RGB
    const colorNum = parseInt(color)
    if (!isNaN(colorNum)) {
      const b = (colorNum >> 16) & 0xFF
      const g = (colorNum >> 8) & 0xFF
      const r = colorNum & 0xFF
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }

    return '#000000' // 기본값
  }
}