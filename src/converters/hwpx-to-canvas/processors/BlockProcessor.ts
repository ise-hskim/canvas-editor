import { ElementType } from '../../../editor/dataset/enum/Element'
import { IElement } from '../../../editor/interface/Element'
import { IBlock } from '../../../editor/interface/Block'
import { BlockType } from '../../../editor/dataset/enum/Block'
import { IHWPXNode as HWPXNode } from '../types'
import { BaseProcessor, ProcessorContext } from './BaseProcessor'

/**
 * 블록 요소 처리 Processor
 * HWPX의 블록 관련 노드를 Canvas Editor의 BLOCK 요소로 변환
 */
export class BlockProcessor extends BaseProcessor {
  supportedTags = [
    'block', 'div', 'section', 'article', 'aside', 'container',
    'hp:block', 'hp:div', 'hp:section', 'hp:container',
    'rect', 'drawText', 'textBox', 'shape'
  ]

  process(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []

    // 블록 요소 생성
    const blockElement = this.createBlock(node, context)
    if (blockElement) {
      elements.push(blockElement)
    }

    return elements
  }

  /**
   * 블록 요소 생성
   */
  private createBlock(node: HWPXNode, context?: ProcessorContext): IElement | null {
    // Canvas Editor는 IFRAME과 VIDEO 블록만 지원하므로
    // 다른 블록 타입은 일반 요소로 처리
    const blockTypeStr = this.getBlockType(node)
    
    // IFRAME 또는 VIDEO가 아니면 일반 텍스트로 처리
    if (blockTypeStr !== 'iframe' && blockTypeStr !== 'video') {
      // 블록 내용을 텍스트로 처리
      const text = this.extractText(node)
      if (text) {
        return {
          type: ElementType.TEXT,
          value: text,
          id: context?.generateId ? context.generateId() : undefined
        }
      }
      return null
    }
    
    const block: IBlock = {
      type: blockTypeStr as BlockType
    }

    // 블록 스타일 추출
    const styles = this.extractBlockStyles(node)
    
    const element: IElement = {
      type: ElementType.BLOCK,
      value: '',
      block,
      ...styles
    }

    // ID 생성
    if (context?.generateId) {
      element.id = context.generateId()
    }

    // 블록 내용 처리
    const content = this.extractBlockContent(node, context)
    if (content.length > 0) {
      element.valueList = content
    }

    return element
  }

  /**
   * 블록 타입 결정
   */
  private getBlockType(node: HWPXNode): string {
    // 태그별 블록 타입
    const tagTypeMap: Record<string, string> = {
      'div': 'div',
      'section': 'section',
      'article': 'article',
      'aside': 'aside',
      'container': 'container',
      'rect': 'rect',
      'drawText': 'text-box',
      'textBox': 'text-box',
      'shape': 'shape'
    }

    const baseTag = node.tag.replace('hp:', '')
    if (tagTypeMap[baseTag]) {
      return tagTypeMap[baseTag]
    }

    // 속성으로 타입 결정
    const blockType = this.getAttribute(node, 'type') || this.getAttribute(node, 'blockType')
    if (blockType) {
      return blockType
    }

    return 'div' // 기본값
  }

  /**
   * 블록 스타일 추출
   */
  private extractBlockStyles(node: HWPXNode): Partial<IElement> {
    const styles: Partial<IElement> = {}

    // 크기
    const width = this.getAttribute(node, 'width') || this.getAttribute(node, 'w')
    const height = this.getAttribute(node, 'height') || this.getAttribute(node, 'h')
    
    if (width) {
      styles.width = this.convertSize(width)
    }
    
    if (height) {
      styles.height = this.convertSize(height)
    }

    // 배경색
    const backgroundColor = this.getAttribute(node, 'backgroundColor') || 
                          this.getAttribute(node, 'bgColor') ||
                          this.getAttribute(node, 'fillColor')
    if (backgroundColor) {
      styles.highlight = this.convertColor(backgroundColor)
    }

    // 테두리
    const borderWidth = this.getAttribute(node, 'borderWidth') || this.getAttribute(node, 'strokeWidth')
    const borderColor = this.getAttribute(node, 'borderColor') || this.getAttribute(node, 'strokeColor')
    
    if (borderWidth || borderColor) {
      // TODO: 테두리 스타일 저장
      styles.extension = {
        border: {
          width: borderWidth ? this.convertSize(borderWidth) : 1,
          color: borderColor ? this.convertColor(borderColor) : '#000000'
        }
      }
    }

    // 패딩/마진
    const padding = this.getAttribute(node, 'padding') || this.getAttribute(node, 'inMargin')
    const margin = this.getAttribute(node, 'margin') || this.getAttribute(node, 'outMargin')
    
    if (padding || margin) {
      const ext = (styles.extension || {}) as any
      if (padding) ext.padding = this.convertSpacing(padding)
      if (margin) ext.margin = this.convertSpacing(margin)
      styles.extension = ext
    }

    return styles
  }

  /**
   * 블록 내용 추출
   */
  private extractBlockContent(node: HWPXNode, _context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []

    // 직접 텍스트가 있는 경우
    const text = this.extractText(node)
    if (text) {
      const chars = text.split('')
      for (const char of chars) {
        elements.push({
          type: ElementType.TEXT,
          value: char
        })
      }
    }

    // 자식 노드가 있는 경우 (ProcessorManager를 통해 처리해야 함)
    // 현재는 텍스트만 추출
    if (!text && node.children?.length) {
      // TODO: ProcessorManager를 통한 자식 노드 처리
      const childText = this.extractText(node)
      if (childText) {
        const chars = childText.split('')
        for (const char of chars) {
          elements.push({
            type: ElementType.TEXT,
            value: char
          })
        }
      }
    }

    return elements
  }

  /**
   * 크기 변환
   */
  private convertSize(size: string): number {
    const value = parseFloat(size)
    if (isNaN(value)) return 100 // 기본값

    // 단위 처리
    if (size.includes('pt')) {
      return Math.round(value * 96 / 72)
    } else if (size.includes('mm')) {
      return Math.round(value * 96 / 25.4)
    } else if (size.includes('%')) {
      return Math.round(value)
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

    return '#000000'
  }

  /**
   * 간격 변환 (padding/margin)
   */
  private convertSpacing(spacing: string): any {
    // 단일 값
    const value = parseFloat(spacing)
    if (!isNaN(value)) {
      return this.convertSize(spacing)
    }

    // 공백으로 구분된 값들 (top right bottom left)
    const values = spacing.split(/\s+/).map(v => this.convertSize(v))
    
    if (values.length === 1) {
      return values[0]
    } else if (values.length === 2) {
      return { vertical: values[0], horizontal: values[1] }
    } else if (values.length === 4) {
      return {
        top: values[0],
        right: values[1],
        bottom: values[2],
        left: values[3]
      }
    }

    return 0
  }
}