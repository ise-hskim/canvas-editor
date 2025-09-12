import { ElementType } from '../../../editor/dataset/enum/Element'
import { RowFlex } from '../../../editor/dataset/enum/Row'
import { IElement } from '../../../editor/interface/Element'
import { IHWPXNode as HWPXNode } from '../types'
import { BaseProcessor, ProcessorContext } from './BaseProcessor'
import { StyleParser } from '../styles/StyleParser'

/**
 * 문단 요소 처리 Processor
 * HWPX의 문단(paragraph) 관련 노드를 처리
 */
export class ParagraphProcessor extends BaseProcessor {
  supportedTags = ['p', 'para', 'hp:p', 'hp:para']
  
  private processorManager: any // ProcessorManager 인스턴스 참조

  setProcessorManager(manager: any): void {
    this.processorManager = manager
  }

  process(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []
    
    // StyleParser를 사용하여 문단 스타일 추출
    const paraStyle = StyleParser.extractParaStyle(node)
    
    // 기존 문단 속성도 추출
    const paragraphProps = this.extractParagraphProperties(node)
    
    // 새로운 컨텍스트 생성 (스타일 병합)
    const paragraphContext: ProcessorContext = {
      ...context,
      alignment: paraStyle.align || paragraphProps.alignment,
      currentStyle: {
        ...context?.currentStyle,
        ...paragraphProps.style
      }
    }
    
    // 정렬 스타일을 첫 번째 요소에 적용
    let isFirstElement = true
    let alignmentToApply: RowFlex | undefined = undefined
    
    // 정렬 스타일 결정
    if (paraStyle.align) {
      const alignMap: Record<string, RowFlex> = {
        'left': RowFlex.LEFT,
        'center': RowFlex.CENTER,
        'right': RowFlex.RIGHT,
        'justify': RowFlex.ALIGNMENT
      }
      alignmentToApply = alignMap[paraStyle.align]
    }

    // 문단 내용 처리
    if (node.children?.length) {
      // ProcessorManager를 통해 자식 노드들 처리
      if (this.processorManager) {
        for (const child of node.children) {
          const childElements = this.processorManager.process(child, paragraphContext)
          
          // 첫 번째 요소에 정렬 스타일 적용
          if (isFirstElement && childElements.length > 0) {
            if (alignmentToApply !== undefined) {
              childElements[0].rowFlex = alignmentToApply
            } else if (paraStyle.align) {
              // convertAlignToRowFlex 사용
              const rowFlex = StyleParser.convertAlignToRowFlex(paraStyle.align)
              if (rowFlex !== undefined) {
                childElements[0].rowFlex = rowFlex
              }
            }
            isFirstElement = false
          }
          
          elements.push(...childElements)
        }
      } else {
        // ProcessorManager가 없으면 기존 방식으로 텍스트만 추출
        const text = this.extractText(node)
        if (text) {
          const textElements = this.createTextElements(text, paragraphContext)
          
          // 첫 번째 요소에 정렬 스타일 적용
          if (isFirstElement && textElements.length > 0) {
            if (alignmentToApply !== undefined) {
              textElements[0].rowFlex = alignmentToApply
            } else if (paraStyle.align) {
              // convertAlignToRowFlex 사용
              const rowFlex = StyleParser.convertAlignToRowFlex(paraStyle.align)
              if (rowFlex !== undefined) {
                textElements[0].rowFlex = rowFlex
              }
            }
            isFirstElement = false
          }
          
          elements.push(...textElements)
        }
      }
    }

    // 문단 끝에 줄바꿈 추가
    if (elements.length > 0) {
      elements.push({
        type: ElementType.TEXT,
        value: '\n'
      })
    }

    return elements
  }

  /**
   * 문단 속성 추출
   */
  private extractParagraphProperties(node: HWPXNode): {
    alignment?: 'left' | 'center' | 'right' | 'justify'
    style: Partial<IElement>
  } {
    const result: {
      alignment?: 'left' | 'center' | 'right' | 'justify'
      style: Partial<IElement>
    } = {
      style: {}
    }

    // paraPr 노드 찾기
    const paraPr = node.children?.find(child => child.tag === 'hp:paraPr')
    if (!paraPr) return result

    // 정렬
    const align = this.getAttribute(paraPr, 'align')
    if (align) {
      result.alignment = this.convertAlignment(align)
      result.style.rowFlex = this.convertAlignmentToRowFlex(align)
    }

    // 들여쓰기
    const indent = this.getAttribute(paraPr, 'indent')
    if (indent) {
      // TODO: 들여쓰기 처리 (공백 문자 추가 또는 스타일 적용)
    }

    // 줄 간격
    const lineSpacing = this.getAttribute(paraPr, 'lineSpacing')
    if (lineSpacing) {
      result.style.rowMargin = this.convertLineSpacing(lineSpacing)
    }

    // 문단 간격 (위)
    const spaceBefore = this.getAttribute(paraPr, 'spaceBefore')
    if (spaceBefore) {
      // TODO: 문단 위 간격 처리
    }

    // 문단 간격 (아래)
    const spaceAfter = this.getAttribute(paraPr, 'spaceAfter')
    if (spaceAfter) {
      // TODO: 문단 아래 간격 처리
    }

    return result
  }

  /**
   * 텍스트 요소 생성
   */
  private createTextElements(text: string, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []
    const chars = text.split('')

    for (const char of chars) {
      const element: IElement = {
        type: ElementType.TEXT,
        value: char
      }

      // 컨텍스트에서 스타일 적용
      if (context?.currentStyle) {
        Object.assign(element, context.currentStyle)
      }

      elements.push(element)
    }

    return elements
  }

  /**
   * HWPX 정렬을 표준 정렬로 변환
   */
  private convertAlignment(hwpxAlign: string): 'left' | 'center' | 'right' | 'justify' {
    switch (hwpxAlign) {
      case 'left':
      case 'start':
        return 'left'
      case 'center':
      case 'middle':
        return 'center'
      case 'right':
      case 'end':
        return 'right'
      case 'justify':
      case 'distribute':
        return 'justify'
      default:
        return 'left'
    }
  }

  /**
   * 정렬을 RowFlex로 변환
   */
  private convertAlignmentToRowFlex(hwpxAlign: string): RowFlex {
    switch (hwpxAlign) {
      case 'left':
      case 'start':
        return RowFlex.LEFT
      case 'center':
      case 'middle':
        return RowFlex.CENTER
      case 'right':
      case 'end':
        return RowFlex.RIGHT
      case 'justify':
      case 'distribute':
        return RowFlex.ALIGNMENT
      default:
        return RowFlex.LEFT
    }
  }

  /**
   * 줄 간격 변환
   */
  private convertLineSpacing(lineSpacing: string): number {
    const value = parseInt(lineSpacing)
    if (isNaN(value)) return 5 // 기본값

    // HWPX 줄 간격은 보통 1000 = 100%
    // Canvas Editor는 픽셀 단위 사용
    return Math.round(value * 20 / 1000)
  }
}