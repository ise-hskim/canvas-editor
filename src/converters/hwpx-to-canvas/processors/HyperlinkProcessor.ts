import { ElementType } from '../../../editor/dataset/enum/Element'
import { IElement } from '../../../editor/interface/Element'
import { IHWPXNode as HWPXNode } from '../types'
import { BaseProcessor, ProcessorContext } from './BaseProcessor'

/**
 * 하이퍼링크 요소 처리 Processor
 * HWPX의 하이퍼링크 관련 노드를 Canvas Editor의 HYPERLINK 요소로 변환
 */
export class HyperlinkProcessor extends BaseProcessor {
  supportedTags = ['hp:hyperlink', 'hp:link', 'hp:a']

  process(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []

    // URL 추출
    const url = this.extractUrl(node)
    if (!url) {
      // URL이 없으면 일반 텍스트로 처리
      const text = this.extractText(node)
      if (text) {
        elements.push(...this.createTextElements(text, context))
      }
      return elements
    }

    // 하이퍼링크 요소 생성
    const hyperlinkElement: IElement = {
      type: ElementType.HYPERLINK,
      value: '',
      url,
      valueList: []
    }

    // 하이퍼링크 ID 생성
    if (context?.generateId) {
      hyperlinkElement.hyperlinkId = context.generateId()
    }

    // 링크 텍스트 추출 및 처리
    const linkText = this.extractLinkText(node)
    if (linkText) {
      const textElements = this.createLinkTextElements(linkText, context)
      hyperlinkElement.valueList = textElements
    } else {
      // 텍스트가 없으면 URL을 텍스트로 사용
      const urlElements = this.createLinkTextElements(url, context)
      hyperlinkElement.valueList = urlElements
    }

    elements.push(hyperlinkElement)

    return elements
  }

  /**
   * URL 추출
   */
  private extractUrl(node: HWPXNode): string | undefined {
    // href 속성에서 URL 추출
    let url = this.getAttribute(node, 'href') || 
              this.getAttribute(node, 'url') ||
              this.getAttribute(node, 'link')

    if (!url) {
      // 자식 노드에서 URL 찾기
      if (node.children?.length) {
        for (const child of node.children) {
          if (child.tag === 'hp:url' || child.tag === 'hp:href') {
            url = child.text || this.extractText(child)
            if (url) break
          }
        }
      }
    }

    // URL 정규화
    if (url) {
      url = this.normalizeUrl(url)
    }

    return url
  }

  /**
   * 링크 텍스트 추출
   */
  private extractLinkText(node: HWPXNode): string {
    // 텍스트 속성에서 추출
    let text = this.getAttribute(node, 'text') || 
               this.getAttribute(node, 'title')

    if (!text) {
      // 자식 노드에서 텍스트 찾기
      if (node.children?.length) {
        for (const child of node.children) {
          if (child.tag === 'hp:text' || child.tag === 'hp:t') {
            text = child.text || this.extractText(child)
            if (text) break
          }
        }

        // 그래도 없으면 모든 텍스트 추출
        if (!text) {
          text = this.extractText(node)
        }
      }
    }

    return text || ''
  }

  /**
   * URL 정규화
   */
  private normalizeUrl(url: string): string {
    // 상대 경로를 절대 경로로 변환할 필요가 있을 수 있음
    
    // 프로토콜이 없으면 추가
    if (!url.startsWith('http://') && 
        !url.startsWith('https://') && 
        !url.startsWith('mailto:') &&
        !url.startsWith('tel:') &&
        !url.startsWith('ftp://')) {
      // 이메일인지 확인
      if (url.includes('@')) {
        return `mailto:${url}`
      }
      // 전화번호인지 확인
      else if (url.match(/^[\d\-\+\(\)\s]+$/)) {
        return `tel:${url.replace(/[\s\(\)\-]/g, '')}`
      }
      // 일반 URL로 처리
      else {
        return `https://${url}`
      }
    }

    return url
  }

  /**
   * 일반 텍스트 요소 생성
   */
  private createTextElements(text: string, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []
    const chars = text.split('')

    for (const char of chars) {
      const element: IElement = {
        type: ElementType.TEXT,
        value: char
      }

      // 컨텍스트 스타일 적용
      if (context?.currentStyle) {
        Object.assign(element, context.currentStyle)
      }

      elements.push(element)
    }

    return elements
  }

  /**
   * 링크 텍스트 요소 생성 (스타일 포함)
   */
  private createLinkTextElements(text: string, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []
    const chars = text.split('')

    // 하이퍼링크 기본 스타일
    const linkStyle: Partial<IElement> = {
      color: '#0066cc',
      underline: true
    }

    for (const char of chars) {
      const element: IElement = {
        type: ElementType.TEXT,
        value: char,
        ...linkStyle
      }

      // 컨텍스트 스타일 병합 (링크 스타일 우선)
      if (context?.currentStyle) {
        Object.assign(element, {
          ...context.currentStyle,
          ...linkStyle
        })
      }

      elements.push(element)
    }

    return elements
  }
}