/**
 * HWPX to Canvas Editor 변환 에러 처리
 */

import { IHWPXNode } from '../types'

/**
 * 변환 에러 타입
 */
export enum ConversionErrorType {
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PROCESSOR_ERROR = 'PROCESSOR_ERROR',
  MAPPING_ERROR = 'MAPPING_ERROR',
  UNKNOWN_TAG = 'UNKNOWN_TAG',
  UNSUPPORTED_FEATURE = 'UNSUPPORTED_FEATURE',
  INVALID_DATA = 'INVALID_DATA'
}

/**
 * 변환 에러 클래스
 */
export class ConversionError extends Error {
  public type: ConversionErrorType
  public node?: IHWPXNode
  public details?: any
  public recoverable: boolean

  constructor(
    message: string,
    type: ConversionErrorType = ConversionErrorType.UNKNOWN_TAG,
    node?: IHWPXNode,
    details?: any,
    recoverable = true
  ) {
    super(message)
    this.name = 'ConversionError'
    this.type = type
    this.node = node
    this.details = details
    this.recoverable = recoverable
  }
}

/**
 * 에러 핸들러 인터페이스
 */
export interface IErrorHandler {
  handleError(error: ConversionError): void
  handleWarning(message: string, node?: IHWPXNode): void
  getErrors(): ConversionError[]
  getWarnings(): string[]
  hasErrors(): boolean
  hasWarnings(): boolean
  clear(): void
}

/**
 * 기본 에러 핸들러
 */
export class ErrorHandler implements IErrorHandler {
  private errors: ConversionError[] = []
  private warnings: string[] = []
  private options: ErrorHandlerOptions

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      maxErrors: options.maxErrors || 100,
      maxWarnings: options.maxWarnings || 100,
      throwOnError: options.throwOnError || false,
      logErrors: options.logErrors !== false,
      logWarnings: options.logWarnings !== false,
      onError: options.onError,
      onWarning: options.onWarning
    }
  }

  /**
   * 에러 처리
   */
  handleError(error: ConversionError): void {
    // 최대 에러 수 체크
    if (this.errors.length >= this.options.maxErrors!) {
      return
    }

    this.errors.push(error)

    // 로깅
    if (this.options.logErrors) {
      console.error(`[ConversionError] ${error.type}: ${error.message}`)
      if (error.node) {
        console.error('  Node:', error.node.tag)
      }
      if (error.details) {
        console.error('  Details:', error.details)
      }
    }

    // 콜백 호출
    if (this.options.onError) {
      this.options.onError(error)
    }

    // 복구 불가능한 에러인 경우 예외 발생
    if (!error.recoverable && this.options.throwOnError) {
      throw error
    }
  }

  /**
   * 경고 처리
   */
  handleWarning(message: string, node?: IHWPXNode): void {
    // 최대 경고 수 체크
    if (this.warnings.length >= this.options.maxWarnings!) {
      return
    }

    this.warnings.push(message)

    // 로깅
    if (this.options.logWarnings) {
      console.warn(`[ConversionWarning] ${message}`)
      if (node) {
        console.warn('  Node:', node.tag)
      }
    }

    // 콜백 호출
    if (this.options.onWarning) {
      this.options.onWarning(message, node)
    }
  }

  /**
   * 에러 목록 반환
   */
  getErrors(): ConversionError[] {
    return [...this.errors]
  }

  /**
   * 경고 목록 반환
   */
  getWarnings(): string[] {
    return [...this.warnings]
  }

  /**
   * 에러 존재 여부
   */
  hasErrors(): boolean {
    return this.errors.length > 0
  }

  /**
   * 경고 존재 여부
   */
  hasWarnings(): boolean {
    return this.warnings.length > 0
  }

  /**
   * 에러/경고 초기화
   */
  clear(): void {
    this.errors = []
    this.warnings = []
  }

  /**
   * 에러 통계 반환
   */
  getStatistics(): ErrorStatistics {
    const errorsByType: Record<string, number> = {}
    
    for (const error of this.errors) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1
    }

    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errorsByType,
      recoverableErrors: this.errors.filter(e => e.recoverable).length,
      unrecoverableErrors: this.errors.filter(e => !e.recoverable).length
    }
  }
}

/**
 * 에러 핸들러 옵션
 */
export interface ErrorHandlerOptions {
  maxErrors?: number
  maxWarnings?: number
  throwOnError?: boolean
  logErrors?: boolean
  logWarnings?: boolean
  onError?: (error: ConversionError) => void
  onWarning?: (message: string, node?: IHWPXNode) => void
}

/**
 * 에러 통계
 */
export interface ErrorStatistics {
  totalErrors: number
  totalWarnings: number
  errorsByType: Record<string, number>
  recoverableErrors: number
  unrecoverableErrors: number
}

/**
 * 에러 복구 전략
 */
export class ErrorRecovery {
  /**
   * 노드 처리 실패 시 복구
   */
  static recoverFromNodeError(
    node: IHWPXNode,
    error: ConversionError,
    fallback?: any
  ): any {
    // 복구 전략
    switch (error.type) {
      case ConversionErrorType.UNKNOWN_TAG:
        // 알 수 없는 태그는 텍스트만 추출
        return this.extractTextFallback(node)
      
      case ConversionErrorType.INVALID_DATA:
        // 잘못된 데이터는 기본값 사용
        return fallback || null
      
      case ConversionErrorType.UNSUPPORTED_FEATURE:
        // 지원하지 않는 기능은 건너뛰기
        return null
      
      default:
        return fallback || null
    }
  }

  /**
   * 텍스트 추출 폴백
   */
  private static extractTextFallback(node: IHWPXNode): any {
    const text = this.extractAllText(node)
    if (text) {
      return {
        type: 'text',
        value: text
      }
    }
    return null
  }

  /**
   * 모든 텍스트 추출
   */
  private static extractAllText(node: IHWPXNode): string {
    let text = ''
    
    if (node.text) {
      text += node.text
    }
    
    if (node.children) {
      for (const child of node.children) {
        text += this.extractAllText(child)
      }
    }
    
    return text
  }
}

/**
 * 에러 메시지 생성 유틸리티
 */
export class ErrorMessages {
  static unknownTag(tag: string): string {
    return `Unknown tag: ${tag}`
  }

  static invalidAttribute(tag: string, attr: string, value: any): string {
    return `Invalid attribute "${attr}" with value "${value}" in tag "${tag}"`
  }

  static missingRequiredAttribute(tag: string, attr: string): string {
    return `Missing required attribute "${attr}" in tag "${tag}"`
  }

  static invalidData(tag: string, details: string): string {
    return `Invalid data in tag "${tag}": ${details}`
  }

  static unsupportedFeature(feature: string): string {
    return `Unsupported feature: ${feature}`
  }

  static processorError(processorName: string, details: string): string {
    return `Error in ${processorName}: ${details}`
  }

  static mappingError(from: string, to: string, details: string): string {
    return `Error mapping from "${from}" to "${to}": ${details}`
  }
}