import { ElementType } from '../../../editor/dataset/enum/Element'
import { IElement } from '../../../editor/interface/Element'
import { IHWPXNode as HWPXNode } from '../types'
import { BaseProcessor, ProcessorContext } from './BaseProcessor'
import { StyleParser } from '../styles/StyleParser'

/**
 * 텍스트 요소 처리 Processor
 * HWPX의 텍스트 관련 노드를 Canvas Editor의 TEXT 요소로 변환
 */
export class TextProcessor extends BaseProcessor {
  supportedTags = ['t', 'run', 'char', 'hp:t', 'hp:run', 'hp:char']
  
  private processorManager: any // ProcessorManager 인스턴스 참조

  setProcessorManager(manager: any): void {
    this.processorManager = manager
  }

  process(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []

    // t 또는 hp:t - 텍스트 블록
    if (node.tag === 't' || node.tag === 'hp:t') {
      const text = this.extractTextFromNode(node)
      if (text) {
        elements.push(...this.createTextElements(text, context))
      }
    }
    // run 또는 hp:run - 텍스트 런 (스타일이 적용된 텍스트 단위)
    else if (node.tag === 'run' || node.tag === 'hp:run') {
      // StyleParser를 사용하여 run의 스타일 추출
      const runStyle = StyleParser.extractRunStyle(node)
      const charProperties = this.extractCharProperties(node)
      
      // 두 스타일 소스 병합
      const mergedStyle = { ...runStyle, ...charProperties }
      const newContext = this.mergeContext(context, mergedStyle)
      
      if (node.children?.length) {
        for (const child of node.children) {
          // 메타데이터 태그는 건너뛰지만 자식은 처리
          if (BaseProcessor.METADATA_TAGS.has(child.tag)) {
            // 메타데이터 태그의 자식들은 재귀적으로 처리
            if (child.children?.length && this.processorManager) {
              for (const grandchild of child.children) {
                const grandchildElements = this.processorManager.process(grandchild, newContext)
                elements.push(...grandchildElements)
              }
            }
            continue
          }
          // 테이블 처리
          if (child.tag === 'tbl' && this.processorManager) {
            const tableElements = this.processorManager.process(child, newContext)
            elements.push(...tableElements)
          }
          // 텍스트 처리
          else if (child.tag === 't' || child.tag === 'hp:t') {
            const text = this.extractTextFromNode(child)
            if (text) {
              elements.push(...this.createTextElements(text, newContext))
            }
          }
          // 기타 노드 처리
          else if (this.processorManager) {
            const childElements = this.processorManager.process(child, newContext)
            elements.push(...childElements)
          }
        }
      }
    }
    // hp:char - 단일 문자 (특수 문자 등)
    else if (node.tag === 'hp:char') {
      const charCode = this.getAttribute(node, 'charCode')
      if (charCode) {
        const char = this.convertCharCode(charCode)
        elements.push(this.createTextElement(char, context))
      }
    }

    return elements
  }

  /**
   * 텍스트 노드에서 텍스트 추출
   */
  private extractTextFromNode(node: HWPXNode): string {
    // null 텍스트는 무시
    if (node.text === null || node.text === 'null') return ''
    if (node.text) return node.text
    
    // 자식 노드들에서 텍스트 추출
    if (node.children?.length) {
      let result = ''
      for (const child of node.children) {
        // 메타데이터 태그는 건너뛰지만 자식은 처리
        if (BaseProcessor.METADATA_TAGS.has(child.tag)) {
          // 메타데이터 태그의 자식들에서 텍스트 추출
          if (child.children?.length) {
            result += this.extractTextFromNode({ ...child, tag: 'wrapper', children: child.children })
          }
        } else if (child.tag === '#text' || child.text) {
          const text = child.text || ''
          if (text !== 'null') {
            result += text
          }
        }
      }
      return result
    }
    
    return ''
  }

  /**
   * 문자열을 TEXT 요소 배열로 변환
   */
  private createTextElements(text: string, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []
    const chars = text.split('')

    for (const char of chars) {
      elements.push(this.createTextElement(char, context))
    }

    return elements
  }

  /**
   * 단일 TEXT 요소 생성
   */
  private createTextElement(value: string, context?: ProcessorContext): IElement {
    const element: IElement = {
      type: ElementType.TEXT,
      value
    }

    // 컨텍스트에서 스타일 적용
    if (context?.currentStyle) {
      StyleParser.applyCharStyle(element, context.currentStyle)
    }

    return element
  }

  /**
   * hp:run 노드에서 문자 속성 추출
   */
  private extractCharProperties(node: HWPXNode): Partial<IElement> {
    const properties: Partial<IElement> = {}
    
    // charPr 노드 찾기
    const charPr = node.children?.find(child => child.tag === 'hp:charPr')
    if (!charPr) return properties

    // 폰트 크기
    const fontSize = this.getAttribute(charPr, 'fontSize')
    if (fontSize) {
      properties.size = parseInt(fontSize) / 100 // HWPX는 100배수로 저장
    }

    // 굵게
    const bold = this.getAttribute(charPr, 'bold')
    if (bold === '1' || bold === 'true') {
      properties.bold = true
    }

    // 기울임
    const italic = this.getAttribute(charPr, 'italic')
    if (italic === '1' || italic === 'true') {
      properties.italic = true
    }

    // 밑줄
    const underline = this.getAttribute(charPr, 'underline')
    if (underline && underline !== '0' && underline !== 'false') {
      properties.underline = true
    }

    // 취소선
    const strikeout = this.getAttribute(charPr, 'strikeout')
    if (strikeout && strikeout !== '0' && strikeout !== 'false') {
      properties.strikeout = true
    }

    // 색상
    const color = this.getAttribute(charPr, 'textColor')
    if (color) {
      properties.color = this.convertColor(color)
    }

    // 배경색
    const highlight = this.getAttribute(charPr, 'backgroundColor')
    if (highlight) {
      properties.highlight = this.convertColor(highlight)
    }

    // 폰트
    const fontRef = this.getAttribute(charPr, 'fontRef')
    if (fontRef) {
      // TODO: fontRef를 실제 폰트 이름으로 변환 (font mapping 필요)
      properties.font = fontRef
    }

    return properties
  }

  /**
   * 컨텍스트 병합
   */
  private mergeContext(
    context: ProcessorContext | undefined,
    properties: Partial<IElement>
  ): ProcessorContext {
    const newContext = { ...context }
    newContext.currentStyle = {
      ...context?.currentStyle,
      ...properties
    }
    return newContext
  }

  /**
   * 문자 코드를 실제 문자로 변환
   */
  private convertCharCode(charCode: string): string {
    const code = parseInt(charCode)
    
    // 특수 문자 매핑
    switch (code) {
      case 9: return '\t'  // 탭
      case 10: return '\n' // 줄바꿈
      case 13: return '\r' // 캐리지 리턴
      case 30: return ' '  // 고정폭 공백
      case 31: return ' '  // 고정폭 공백
      default:
        return String.fromCharCode(code)
    }
  }

  /**
   * HWPX 색상값을 CSS 색상으로 변환
   */
  private convertColor(hwpxColor: string): string {
    // HWPX 색상은 보통 BGR 형식 또는 RGB 형식
    if (hwpxColor.startsWith('#')) {
      return hwpxColor
    }
    
    // 숫자 형식인 경우 (BGR)
    const colorNum = parseInt(hwpxColor)
    if (!isNaN(colorNum)) {
      const b = (colorNum >> 16) & 0xFF
      const g = (colorNum >> 8) & 0xFF
      const r = colorNum & 0xFF
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }

    return '#000000' // 기본값
  }
}