/**
 * HWPX to Canvas Editor Converter
 * HWPX JSON을 Canvas Editor JSON으로 변환하는 메인 클래스
 */

import {
  IHWPXJson,
  IConverterOptions,
  IConversionResult,
  IConversionContext,
  IHWPXNode,
  IEditorResult,
  IEditorData,
  IElement
} from './types'
import { ProcessorManager } from './processors'

export class HWPXToCanvasConverter {
  private options: IConverterOptions
  private context!: IConversionContext
  private processorManager: ProcessorManager
  
  constructor(options: IConverterOptions = {}) {
    // 기본 옵션 설정
    this.options = {
      preserveStyles: true,
      preserveIds: false,
      preserveLayout: true,
      defaultFont: '바탕',
      defaultSize: 16,
      defaultColor: '#000000',
      embedImages: true,
      tableDefaultBorder: true,
      preserveTableStyles: true,
      skipEmptyParagraphs: false,
      normalizeWhitespace: true,
      ...options
    }
    
    // 변환 컨텍스트 초기화
    this.context = this.initializeContext()
    
    // ProcessorManager 초기화
    this.processorManager = new ProcessorManager()
  }
  
  /**
   * 변환 컨텍스트 초기화
   */
  private initializeContext(): IConversionContext {
    return {
      currentSection: 0,
      currentParagraph: 0,
      currentRun: 0,
      styleStack: [],
      idMap: new Map(),
      images: new Map(),
      fonts: new Map(),
      stats: {
        totalParagraphs: 0,
        totalTables: 0,
        totalImages: 0,
        totalHyperlinks: 0,
        convertedElements: 0,
        skippedElements: 0,
        errors: 0,
        warnings: 0,
        startTime: Date.now()
      },
      options: this.options
    }
  }
  
  /**
   * 비동기 변환 메서드
   */
  async convert(hwpxJson: IHWPXJson, options?: IConverterOptions): Promise<IConversionResult> {
    // 옵션 업데이트
    if (options) {
      this.options = { ...this.options, ...options }
      this.context.options = this.options
    }
    
    // 컨텍스트 리셋
    this.context = this.initializeContext()
    
    try {
      // 변환 수행
      const result = this.performConversion(hwpxJson)
      
      // 통계 완료
      this.context.stats.endTime = Date.now()
      
      return {
        success: true,
        data: result,
        stats: this.context.stats
      }
    } catch (error) {
      this.context.stats.errors++
      this.context.stats.endTime = Date.now()
      
      return {
        success: false,
        stats: this.context.stats,
        errors: [error as Error]
      }
    }
  }
  
  /**
   * 동기 변환 메서드
   */
  convertSync(hwpxJson: IHWPXJson, options?: IConverterOptions): IConversionResult {
    // 옵션 업데이트
    if (options) {
      this.options = { ...this.options, ...options }
      this.context.options = this.options
    }
    
    // 컨텍스트 리셋
    this.context = this.initializeContext()
    
    try {
      // 변환 수행
      const result = this.performConversion(hwpxJson)
      
      // 통계 완료
      this.context.stats.endTime = Date.now()
      
      return {
        success: true,
        data: result,
        stats: this.context.stats
      }
    } catch (error) {
      this.context.stats.errors++
      this.context.stats.endTime = Date.now()
      
      return {
        success: false,
        stats: this.context.stats,
        errors: [error as Error]
      }
    }
  }
  
  /**
   * 실제 변환 수행
   */
  private performConversion(hwpxJson: IHWPXJson): IEditorResult {
    // 1. 메타데이터 추출
    const metadata = this.extractMetadata(hwpxJson)
    
    // 2. 섹션 변환
    const mainElements = this.convertSections(hwpxJson.content?.sections || [])
    
    // 3. 결과 구성
    const editorData: IEditorData = {
      main: mainElements,
      header: [], // TODO: 헤더 처리
      footer: []  // TODO: 푸터 처리
    }
    
    // 4. 에디터 옵션 생성
    const editorOptions = this.createEditorOptions(metadata)
    
    return {
      version: '0.9.115',
      data: editorData,
      options: editorOptions
    }
  }
  
  /**
   * 메타데이터 추출
   */
  private extractMetadata(_hwpxJson: IHWPXJson): any {
    // TODO: 구현 필요
    return {
      fonts: [],
      styles: []
    }
  }
  
  /**
   * 섹션들 변환
   */
  private convertSections(sections: any[]): IElement[] {
    const elements: IElement[] = []
    
    if (sections && Array.isArray(sections) && sections.length > 0) {
      for (const section of sections) {
        if (section && this.context) {
          this.context.currentSection = (this.context.currentSection || 0) + 1
          const sectionElements = this.convertSection(section)
          elements.push(...sectionElements)
        }
      }
    }
    
    return elements
  }
  
  /**
   * 단일 섹션 변환
   */
  private convertSection(section: any): IElement[] {
    const elements: IElement[] = []
    
    // 섹션의 parsed_structure 확인
    if (section.data?.parsed_structure) {
      const sectionNode = section.data.parsed_structure
      
      // 섹션의 children (문단들) 처리
      if (sectionNode.children) {
        for (const child of sectionNode.children) {
          const childElements = this.convertNode(child)
          elements.push(...childElements)
        }
      }
    }
    
    return elements
  }
  
  /**
   * 노드 변환 (재귀적)
   */
  private convertNode(node: IHWPXNode): IElement[] {
    // ProcessorManager를 통해 노드 처리
    const elements = this.processorManager.process(node)
    
    // 통계 업데이트
    if (elements.length > 0) {
      this.context.stats.convertedElements += elements.length
      
      // 요소 타입별 통계
      for (const element of elements) {
        switch (element.type) {
          case 'table':
            this.context.stats.totalTables++
            break
          case 'image':
            this.context.stats.totalImages++
            break
          case 'hyperlink':
            this.context.stats.totalHyperlinks++
            break
        }
      }
    } else {
      // 처리되지 않은 태그
      if (this.options.onWarning) {
        this.options.onWarning(`Unhandled tag: ${node.tag}`, node)
      }
      this.context.stats.skippedElements++
    }
    
    return elements
  }
  
  // 임시 구현 메서드들 제거 (ProcessorManager가 처리)
  
  // 텍스트 추출 메서드 제거 (ProcessorManager가 처리)
  
  /**
   * 에디터 옵션 생성
   */
  private createEditorOptions(_metadata: any): any {
    // TODO: 실제 구현 필요
    return {
      mode: 'edit',
      locale: 'koKR',
      defaultFont: this.options.defaultFont,
      defaultSize: this.options.defaultSize,
      defaultColor: this.options.defaultColor
    }
  }
}