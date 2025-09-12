import { ElementType } from '../../../editor/dataset/enum/Element'
import { TitleLevel } from '../../../editor/dataset/enum/Title'
import { IElement } from '../../../editor/interface/Element'
import { ITitle } from '../../../editor/interface/Title'
import { IHWPXNode as HWPXNode } from '../types'
import { BaseProcessor, ProcessorContext } from './BaseProcessor'

/**
 * 제목 요소 처리 Processor
 * HWPX의 제목/헤더 관련 노드를 Canvas Editor의 TITLE 요소로 변환
 */
export class TitleProcessor extends BaseProcessor {
  supportedTags = ['hp:h1', 'hp:h2', 'hp:h3', 'hp:h4', 'hp:h5', 'hp:h6', 'hp:heading', 'hp:title']

  process(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []

    // 제목 레벨 결정
    const level = this.getTitleLevel(node)
    
    // 제목 내용 추출
    const titleText = this.extractText(node)
    if (!titleText) {
      return elements
    }

    // 제목 요소 생성
    const titleElement: IElement = {
      type: ElementType.TITLE,
      value: '',
      level,
      valueList: []
    }

    // 제목 ID 생성
    if (context?.generateId) {
      titleElement.titleId = context.generateId()
    }

    // 제목 텍스트를 요소 배열로 변환
    const textElements = this.createTitleTextElements(titleText, level, context)
    titleElement.valueList = textElements

    // 제목 메타데이터 설정
    const titleMeta = this.createTitleMetadata(node, level)
    if (titleMeta) {
      titleElement.title = titleMeta
    }

    elements.push(titleElement)

    // 제목 후 줄바꿈 추가
    elements.push({
      type: ElementType.TEXT,
      value: '\n'
    })

    return elements
  }

  /**
   * 제목 레벨 결정
   */
  private getTitleLevel(node: HWPXNode): TitleLevel {
    // 태그 이름으로 레벨 결정
    switch (node.tag) {
      case 'hp:h1':
        return TitleLevel.FIRST
      case 'hp:h2':
        return TitleLevel.SECOND
      case 'hp:h3':
        return TitleLevel.THIRD
      case 'hp:h4':
        return TitleLevel.FOURTH
      case 'hp:h5':
        return TitleLevel.FIFTH
      case 'hp:h6':
        return TitleLevel.SIXTH
      default:
        break
    }

    // level 속성으로 레벨 결정
    const levelAttr = this.getAttribute(node, 'level') || this.getAttribute(node, 'outlineLevel')
    if (levelAttr) {
      const level = parseInt(levelAttr)
      switch (level) {
        case 1:
          return TitleLevel.FIRST
        case 2:
          return TitleLevel.SECOND
        case 3:
          return TitleLevel.THIRD
        case 4:
          return TitleLevel.FOURTH
        case 5:
          return TitleLevel.FIFTH
        case 6:
          return TitleLevel.SIXTH
        default:
          return TitleLevel.FIRST
      }
    }

    // 스타일로 레벨 추정
    const style = this.getAttribute(node, 'style') || this.getAttribute(node, 'paraStyle')
    if (style) {
      if (style.includes('Heading1') || style.includes('제목1')) {
        return TitleLevel.FIRST
      } else if (style.includes('Heading2') || style.includes('제목2')) {
        return TitleLevel.SECOND
      } else if (style.includes('Heading3') || style.includes('제목3')) {
        return TitleLevel.THIRD
      } else if (style.includes('Heading4') || style.includes('제목4')) {
        return TitleLevel.FOURTH
      } else if (style.includes('Heading5') || style.includes('제목5')) {
        return TitleLevel.FIFTH
      } else if (style.includes('Heading6') || style.includes('제목6')) {
        return TitleLevel.SIXTH
      }
    }

    // 기본값
    return TitleLevel.FIRST
  }

  /**
   * 제목 텍스트 요소 생성
   */
  private createTitleTextElements(
    text: string,
    level: TitleLevel,
    context?: ProcessorContext
  ): IElement[] {
    const elements: IElement[] = []
    const chars = text.split('')

    // 레벨별 기본 스타일
    const levelStyles = this.getTitleStyleByLevel(level)

    for (const char of chars) {
      const element: IElement = {
        type: ElementType.TEXT,
        value: char,
        ...levelStyles
      }

      // 컨텍스트 스타일 병합
      if (context?.currentStyle) {
        Object.assign(element, context.currentStyle)
      }

      elements.push(element)
    }

    return elements
  }

  /**
   * 레벨별 제목 스타일
   */
  private getTitleStyleByLevel(level: TitleLevel): Partial<IElement> {
    switch (level) {
      case TitleLevel.FIRST:
        return {
          size: 28,
          bold: true
        }
      case TitleLevel.SECOND:
        return {
          size: 24,
          bold: true
        }
      case TitleLevel.THIRD:
        return {
          size: 20,
          bold: true
        }
      case TitleLevel.FOURTH:
        return {
          size: 18,
          bold: true
        }
      case TitleLevel.FIFTH:
        return {
          size: 16,
          bold: true
        }
      case TitleLevel.SIXTH:
        return {
          size: 14,
          bold: true
        }
      default:
        return {
          size: 16,
          bold: true
        }
    }
  }

  /**
   * 제목 메타데이터 생성
   */
  private createTitleMetadata(node: HWPXNode, level: TitleLevel): ITitle | undefined {
    // 제목 번호 추출
    const numberText = this.getAttribute(node, 'number') || this.getAttribute(node, 'numId')
    
    if (!numberText) {
      return undefined
    }

    const title: ITitle = {
      conceptId: `heading_${level}`
    }

    // 제목 번호 형식 파싱
    // 예: "1.", "1.1.", "1.1.1." 등
    if (numberText) {
      // TODO: 번호 형식 파싱 및 설정
      // Canvas Editor의 제목 번호 시스템에 맞게 변환
    }

    return title
  }
}