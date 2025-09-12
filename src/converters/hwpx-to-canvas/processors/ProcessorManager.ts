import { IElement } from '../../../editor/interface/Element'
import { IHWPXNode as HWPXNode } from '../types'
import { IProcessor, ProcessorContext } from './BaseProcessor'
import { TextProcessor } from './TextProcessor'
import { TableProcessor } from './TableProcessor'
import { ParagraphProcessor } from './ParagraphProcessor'
import { ImageProcessor } from './ImageProcessor'
import { ListProcessor } from './ListProcessor'
import { TitleProcessor } from './TitleProcessor'
import { HyperlinkProcessor } from './HyperlinkProcessor'
import { SeparatorProcessor } from './SeparatorProcessor'
import { ControlProcessor } from './ControlProcessor'
import { BlockProcessor } from './BlockProcessor'

/**
 * Processor 관리자
 * 모든 Processor를 등록하고 적절한 Processor로 노드를 라우팅
 */
export class ProcessorManager {
  private processors: Map<string, IProcessor> = new Map()
  private defaultProcessor?: IProcessor
  private idCounter = 0

  constructor() {
    this.registerDefaultProcessors()
  }

  /**
   * 기본 Processor들 등록
   */
  private registerDefaultProcessors(): void {
    // 텍스트 처리
    const textProcessor = new TextProcessor()
    // ProcessorManager 참조 설정
    ;(textProcessor as any).setProcessorManager(this)
    this.registerProcessor(textProcessor)

    // 문단 처리
    const paragraphProcessor = new ParagraphProcessor()
    // ProcessorManager 참조 설정
    ;(paragraphProcessor as any).setProcessorManager(this)
    this.registerProcessor(paragraphProcessor)

    // 테이블 처리
    const tableProcessor = new TableProcessor()
    // ProcessorManager 참조 설정
    ;(tableProcessor as any).setProcessorManager(this)
    this.registerProcessor(tableProcessor)

    // 이미지 처리
    const imageProcessor = new ImageProcessor()
    this.registerProcessor(imageProcessor)

    // 목록 처리
    const listProcessor = new ListProcessor()
    this.registerProcessor(listProcessor)

    // 제목 처리
    const titleProcessor = new TitleProcessor()
    this.registerProcessor(titleProcessor)

    // 하이퍼링크 처리
    const hyperlinkProcessor = new HyperlinkProcessor()
    this.registerProcessor(hyperlinkProcessor)

    // 구분선 처리
    const separatorProcessor = new SeparatorProcessor()
    this.registerProcessor(separatorProcessor)

    // 컨트롤 처리
    const controlProcessor = new ControlProcessor()
    this.registerProcessor(controlProcessor)

    // 블록 처리
    const blockProcessor = new BlockProcessor()
    this.registerProcessor(blockProcessor)

    // TODO: 추가 Processor 등록
    // - DateProcessor (날짜)
    // - SuperscriptProcessor (위첨자)
    // - SubscriptProcessor (아래첨자)
  }

  /**
   * Processor 등록
   */
  registerProcessor(processor: IProcessor): void {
    for (const tag of processor.supportedTags) {
      this.processors.set(tag, processor)
    }
  }

  /**
   * 기본 Processor 설정
   */
  setDefaultProcessor(processor: IProcessor): void {
    this.defaultProcessor = processor
  }

  /**
   * 노드 처리
   */
  process(node: HWPXNode, context?: ProcessorContext): IElement[] {
    // 메타데이터 태그는 건너뛰지만 자식은 처리
    // 주의: sz, pos, outMargin은 테이블 컨텍스트에서는 처리해야 함
    const METADATA_TAGS = new Set([
      'secPr', 'ctrl', 'container', 'linesegarray', 'markStart', 'markEnd',
      'colPr', 'pagePr', 'grid', 'startNum', 'visibility', 'lineNumberShape',
      'offset', 'orgSz', 'curSz', 'flip', 'rotationInfo', 'renderingInfo',
      // 'sz', 'pos', 'outMargin' - 테이블에서 필요하므로 제거
      'rect', 'pageNum', 'drawText', 'linkinfo', 'lineseg',
      // 추가 메타데이터 태그들
      'pageBorderFill', 'footNotePr', 'endNotePr', 'pageHiding', 'placement',
      'noteLine', 'noteSpacing', 'layoutCompatibility', 'compatibleDocument',
      'docOption', 'trackchageConfig', 'winBrush', 'fillBrush',
      'pt0', 'pt1', 'pt2', 'pt3', 'rotMatrix', 'scaMatrix', 'transMatrix',
      'breakSetting', 'fwSpace', 'intent', 'newNum', 'beginNum',
      'lineShape', 'cellAddr', 'diagonal', 'backSlash', 'slash'
    ])
    
    if (METADATA_TAGS.has(node.tag)) {
      // 메타데이터 태그 자체는 무시하지만, 자식 노드들은 처리
      if (node.children?.length) {
        return this.processChildren(node.children, context)
      }
      return []
    }

    // 컨텍스트에 ID 생성기 추가
    const enrichedContext: ProcessorContext = {
      ...context,
      generateId: () => this.generateId()
    }

    // 적절한 Processor 찾기
    const processor = this.findProcessor(node)
    
    if (processor) {
      // TableProcessor는 메타데이터 태그를 직접 처리해야 함
      if (processor instanceof TableProcessor) {
        // 테이블은 원본 노드 그대로 전달 (메타데이터 포함)
        return processor.process(node, enrichedContext)
      }
      // Processor에 processorMap 전달을 위해 특별 처리
      if (processor instanceof ParagraphProcessor) {
        // 자식 노드 처리를 위해 ProcessorManager 참조 필요
        return this.processWithChildren(node, processor, enrichedContext)
      }
      return processor.process(node, enrichedContext)
    }

    // 매칭되는 Processor가 없으면 자식 노드들 처리
    return this.processChildren(node.children || [], enrichedContext)
  }

  /**
   * 자식 노드 처리가 필요한 Processor 실행
   */
  private processWithChildren(
    node: HWPXNode,
    processor: IProcessor,
    context: ProcessorContext
  ): IElement[] {
    // TODO: Processor 내부에서 ProcessorManager를 참조할 수 있도록 개선 필요
    // 현재는 임시로 직접 처리
    const elements = processor.process(node, context)
    
    // 테이블 셀 내용 등 자식 요소 처리가 필요한 경우
    if (node.tag === 'hp:tc' && elements.length > 0) {
      const td = elements[0] as any
      if (td.value && Array.isArray(td.value) && td.value.length === 0) {
        // 빈 셀의 경우 자식 노드 처리
        td.value = this.processChildren(node.children || [], {
          ...context,
          inTable: true
        })
      }
    }

    return elements
  }

  /**
   * 자식 노드들 처리
   */
  processChildren(children: HWPXNode[], context?: ProcessorContext): IElement[] {
    const results: IElement[] = []

    for (const child of children) {
      // process 메서드가 이미 메타데이터 태그를 처리하므로 여기서는 모든 자식을 처리
      const elements = this.process(child, context)
      results.push(...elements)
    }

    return results
  }

  /**
   * 노드에 맞는 Processor 찾기
   */
  private findProcessor(node: HWPXNode): IProcessor | undefined {
    // 태그로 직접 매칭
    const processor = this.processors.get(node.tag)
    if (processor) {
      return processor
    }

    // canProcess 메서드로 확인
    for (const [, proc] of this.processors) {
      if (proc.canProcess(node)) {
        return proc
      }
    }

    // 기본 Processor
    return this.defaultProcessor
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return `element_${++this.idCounter}`
  }

  /**
   * HWPX 문서 전체 처리
   */
  processDocument(rootNode: HWPXNode): IElement[] {
    const results: IElement[] = []
    
    // 문서 구조 탐색
    const bodyNode = this.findBodyNode(rootNode)
    if (!bodyNode) {
      console.warn('ProcessorManager: No body node found')
      return results
    }

    // 섹션들 처리
    const sections = this.findSections(bodyNode)
    for (const section of sections) {
      const sectionElements = this.processSection(section)
      results.push(...sectionElements)
    }

    return results
  }

  /**
   * Body 노드 찾기
   */
  private findBodyNode(node: HWPXNode): HWPXNode | null {
    if (node.tag === 'hp:body' || node.tag === 'hp:content') {
      return node
    }

    if (node.children?.length) {
      for (const child of node.children) {
        const body = this.findBodyNode(child)
        if (body) return body
      }
    }

    return null
  }

  /**
   * 섹션 노드들 찾기
   */
  private findSections(bodyNode: HWPXNode): HWPXNode[] {
    const sections: HWPXNode[] = []

    if (bodyNode.children?.length) {
      for (const child of bodyNode.children) {
        if (child.tag === 'hp:section' || child.tag === 'hp:sec') {
          sections.push(child)
        }
      }
    }

    // 섹션이 없으면 body 자체를 섹션으로 처리
    if (sections.length === 0) {
      sections.push(bodyNode)
    }

    return sections
  }

  /**
   * 섹션 처리
   */
  private processSection(section: HWPXNode): IElement[] {
    return this.processChildren(section.children || [])
  }

  /**
   * 등록된 Processor 목록 반환
   */
  getProcessors(): Map<string, IProcessor> {
    return new Map(this.processors)
  }

  /**
   * 특정 태그의 Processor 반환
   */
  getProcessor(tag: string): IProcessor | undefined {
    return this.processors.get(tag)
  }
}