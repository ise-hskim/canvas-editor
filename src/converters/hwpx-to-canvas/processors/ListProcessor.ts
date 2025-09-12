import { ElementType } from '../../../editor/dataset/enum/Element'
import { ListStyle, ListType } from '../../../editor/dataset/enum/List'
import { IElement } from '../../../editor/interface/Element'
import { IHWPXNode as HWPXNode } from '../types'
import { BaseProcessor, ProcessorContext } from './BaseProcessor'

/**
 * 목록 요소 처리 Processor
 * HWPX의 목록 관련 노드를 Canvas Editor의 LIST 요소로 변환
 */
export class ListProcessor extends BaseProcessor {
  supportedTags = ['hp:list', 'hp:ul', 'hp:ol', 'hp:li']

  process(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []

    if (node.tag === 'hp:list' || node.tag === 'hp:ul' || node.tag === 'hp:ol') {
      // 목록 전체 처리
      const listElements = this.processList(node, context)
      elements.push(...listElements)
    } else if (node.tag === 'hp:li') {
      // 목록 항목 처리
      const itemElements = this.processListItem(node, context)
      elements.push(...itemElements)
    }

    return elements
  }

  /**
   * 목록 처리
   */
  private processList(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []
    
    // 목록 타입 결정
    const listType = this.getListType(node)
    const listStyle = this.getListStyle(node)
    
    // 목록 레벨 (중첩 목록)
    const listLevel = (context?.listLevel || 0) + 1
    
    // 새로운 컨텍스트 생성
    const listContext: ProcessorContext = {
      ...context,
      inList: true,
      listLevel
    }

    // 목록 항목들 처리
    if (node.children?.length) {
      for (const child of node.children) {
        if (child.tag === 'hp:li') {
          // 목록 요소 생성
          const listElement: IElement = {
            type: ElementType.LIST,
            value: '',
            listType,
            listStyle,
            valueList: []
          }

          // 목록 ID 생성
          if (context?.generateId) {
            listElement.listId = context.generateId()
          }

          // 목록 항목 내용 처리
          const itemContent = this.extractListItemContent(child, listContext)
          if (itemContent.length > 0) {
            listElement.valueList = itemContent
          }

          elements.push(listElement)
        }
      }
    }

    return elements
  }

  /**
   * 목록 항목 처리
   */
  private processListItem(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []

    // 목록 항목 내용 추출
    const itemContent = this.extractListItemContent(node, context)
    
    // 목록 요소 생성
    if (itemContent.length > 0) {
      const listElement: IElement = {
        type: ElementType.LIST,
        value: '',
        listType: ListType.OL, // 기본값
        listStyle: ListStyle.DECIMAL, // 기본값
        valueList: itemContent
      }

      // 부모 목록에서 타입 상속 (가능한 경우)
      if (context?.inList) {
        // TODO: 부모 목록 정보 참조
      }

      elements.push(listElement)
    }

    return elements
  }

  /**
   * 목록 항목 내용 추출
   */
  private extractListItemContent(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []

    // 텍스트 내용 추출
    const text = this.extractText(node)
    if (text) {
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
    }

    return elements
  }

  /**
   * 목록 타입 결정
   */
  private getListType(node: HWPXNode): ListType {
    const tag = node.tag
    const type = this.getAttribute(node, 'type') || this.getAttribute(node, 'listType')

    // 태그로 판단
    if (tag === 'hp:ul') {
      return ListType.UL
    } else if (tag === 'hp:ol') {
      return ListType.OL
    }

    // 속성으로 판단
    if (type) {
      switch (type.toLowerCase()) {
        case 'bullet':
        case 'unordered':
        case 'ul':
          return ListType.UL
        case 'number':
        case 'ordered':
        case 'ol':
          return ListType.OL
        default:
          return ListType.OL
      }
    }

    return ListType.OL // 기본값
  }

  /**
   * 목록 스타일 결정
   */
  private getListStyle(node: HWPXNode): ListStyle {
    const style = this.getAttribute(node, 'style') || this.getAttribute(node, 'listStyle')
    const type = this.getListType(node)

    if (style) {
      // 번호 목록 스타일
      if (type === ListType.OL) {
        switch (style.toLowerCase()) {
          case 'decimal':
          case '1':
            return ListStyle.DECIMAL
          // 지원하지 않는 스타일은 DECIMAL로 대체
          case 'lower-alpha':
          case 'a':
          case 'upper-alpha':
          case 'A':
          case 'lower-roman':
          case 'i':
          case 'upper-roman':
          case 'I':
          case 'cjk':
          case 'cjk-ideographic':
            return ListStyle.DECIMAL
          default:
            return ListStyle.DECIMAL
        }
      }
      // 불릿 목록 스타일
      else {
        switch (style.toLowerCase()) {
          case 'disc':
          case 'circle':
            return ListStyle.CIRCLE
          case 'square':
            return ListStyle.SQUARE
          default:
            return ListStyle.CIRCLE
        }
      }
    }

    // 기본 스타일
    return type === ListType.OL ? ListStyle.DECIMAL : ListStyle.CIRCLE
  }
}