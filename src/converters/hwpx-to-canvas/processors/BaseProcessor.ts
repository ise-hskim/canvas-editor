import { IElement } from '../../../editor/interface/Element'
import { IHWPXNode as HWPXNode } from '../types'

/**
 * Processor 기본 인터페이스
 * 모든 ElementType별 Processor가 구현해야 하는 인터페이스
 */
export interface IProcessor {
  /**
   * 이 Processor가 처리할 수 있는 HWPX 노드 태그들
   */
  supportedTags: string[]

  /**
   * HWPX 노드를 Canvas Element로 변환
   * @param node HWPX 노드
   * @param context 변환 컨텍스트 (스타일, 부모 정보 등)
   * @returns 변환된 Canvas Element 배열
   */
  process(node: HWPXNode, context?: ProcessorContext): IElement[]

  /**
   * 노드를 처리할 수 있는지 확인
   * @param node HWPX 노드
   * @returns 처리 가능 여부
   */
  canProcess(node: HWPXNode): boolean
}

/**
 * Processor 실행 컨텍스트
 * 변환 과정에서 필요한 정보를 전달
 */
export interface ProcessorContext {
  /**
   * 현재 적용 중인 스타일
   */
  currentStyle?: Partial<IElement>

  /**
   * 부모 요소 타입
   */
  parentType?: string

  /**
   * 테이블 내부인지 여부
   */
  inTable?: boolean

  /**
   * 리스트 내부인지 여부
   */
  inList?: boolean

  /**
   * 리스트 레벨 (중첩 리스트)
   */
  listLevel?: number

  /**
   * 현재 문단 정렬
   */
  alignment?: 'left' | 'center' | 'right' | 'justify'

  /**
   * ID 생성기
   */
  generateId?: () => string
}

/**
 * Processor 기본 클래스
 * 공통 기능 제공
 */
export abstract class BaseProcessor implements IProcessor {
  abstract supportedTags: string[]
  
  // 무시해야 할 메타데이터 태그들
  protected static readonly METADATA_TAGS = new Set([
    'secPr', 'ctrl', 'container', 'linesegarray', 'markStart', 'markEnd',
    'colPr', 'pagePr', 'grid', 'startNum', 'visibility', 'lineNumberShape',
    'offset', 'orgSz', 'curSz', 'flip', 'rotationInfo', 'renderingInfo',
    'sz', 'pos', 'outMargin', 'rect', 'pageNum', 'drawText', 'linkinfo', 'lineseg',
    // 추가 메타데이터 태그들
    'pageBorderFill', 'footNotePr', 'endNotePr', 'pageHiding', 'placement',
    'noteLine', 'noteSpacing', 'layoutCompatibility', 'compatibleDocument',
    'docOption', 'trackchageConfig', 'winBrush', 'fillBrush',
    'pt0', 'pt1', 'pt2', 'pt3', 'rotMatrix', 'scaMatrix', 'transMatrix',
    'breakSetting', 'fwSpace', 'intent', 'newNum', 'beginNum',
    'lineShape', 'cellAddr', 'diagonal', 'backSlash', 'slash'
  ])

  abstract process(node: HWPXNode, context?: ProcessorContext): IElement[]

  canProcess(node: HWPXNode): boolean {
    return this.supportedTags.includes(node.tag)
  }

  /**
   * 자식 노드들을 재귀적으로 처리
   * @param children 자식 노드 배열
   * @param context 컨텍스트
   * @param processorMap Processor 맵
   * @returns 변환된 요소 배열
   */
  protected processChildren(
    children: HWPXNode[],
    context: ProcessorContext | undefined,
    processorMap: Map<string, IProcessor>
  ): IElement[] {
    const results: IElement[] = []

    for (const child of children) {
      // 메타데이터 태그는 건너뛰지만 자식은 처리
      if (BaseProcessor.METADATA_TAGS.has(child.tag)) {
        // 메타데이터 태그의 자식들은 재귀적으로 처리
        if (child.children?.length) {
          const childElements = this.processChildren(child.children, context, processorMap)
          results.push(...childElements)
        }
        continue
      }
      
      const processor = processorMap.get(child.tag)
      if (processor) {
        const elements = processor.process(child, context)
        results.push(...elements)
      } else {
        // 매칭되는 processor가 없으면 자식들을 계속 처리
        if (child.children?.length) {
          const childElements = this.processChildren(child.children, context, processorMap)
          results.push(...childElements)
        }
      }
    }

    return results
  }

  /**
   * 노드의 속성값 가져오기
   * @param node HWPX 노드
   * @param attrName 속성 이름
   * @returns 속성값
   */
  protected getAttribute(node: HWPXNode, attrName: string): string | undefined {
    return node.attrs?.[attrName]
  }

  /**
   * 노드의 텍스트 내용 추출
   * @param node HWPX 노드
   * @returns 텍스트 내용
   */
  protected extractText(node: HWPXNode): string {
    // null 텍스트는 무시
    if (node.text === null || node.text === 'null') return ''
    if (node.text) return node.text
    
    if (node.children?.length) {
      return node.children
        .map((child: HWPXNode) => {
          // 메타데이터 태그는 건너뛰지만 자식은 처리
          if (BaseProcessor.METADATA_TAGS.has(child.tag)) {
            // 메타데이터 태그의 자식들에서 텍스트 추출
            if (child.children?.length) {
              return child.children
                .map((grandchild: HWPXNode) => this.extractText(grandchild))
                .join('')
            }
            return ''
          }
          return this.extractText(child)
        })
        .filter(text => text !== 'null' && text !== '') // 'null' 문자열과 빈 문자열 필터링
        .join('')
    }
    
    return ''
  }
}