/**
 * ID 생성 유틸리티
 */

/**
 * ID 생성기 클래스
 */
export class IdGenerator {
  private counters: Map<string, number> = new Map()
  private prefix: string
  
  constructor(prefix = '') {
    this.prefix = prefix
  }
  
  /**
   * 새로운 ID 생성
   * @param type 요소 타입 (선택사항)
   * @returns 생성된 ID
   */
  generate(type?: string): string {
    const key = type || 'default'
    const count = (this.counters.get(key) || 0) + 1
    this.counters.set(key, count)
    
    if (type) {
      return `${this.prefix}${type}_${count}`
    }
    return `${this.prefix}element_${count}`
  }
  
  /**
   * UUID v4 생성
   * @returns UUID 문자열
   */
  generateUUID(): string {
    // 브라우저 환경
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    
    // Node.js 환경 또는 폴백
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
  
  /**
   * 타임스탬프 기반 ID 생성
   * @param type 요소 타입 (선택사항)
   * @returns 생성된 ID
   */
  generateTimestampId(type?: string): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    
    if (type) {
      return `${this.prefix}${type}_${timestamp}_${random}`
    }
    return `${this.prefix}${timestamp}_${random}`
  }
  
  /**
   * 카운터 리셋
   * @param type 특정 타입만 리셋 (선택사항)
   */
  reset(type?: string): void {
    if (type) {
      this.counters.delete(type)
    } else {
      this.counters.clear()
    }
  }
  
  /**
   * 현재 카운터 값 가져오기
   * @param type 요소 타입
   * @returns 현재 카운터 값
   */
  getCount(type = 'default'): number {
    return this.counters.get(type) || 0
  }
  
  /**
   * 프리픽스 변경
   * @param prefix 새로운 프리픽스
   */
  setPrefix(prefix: string): void {
    this.prefix = prefix
  }
}

/**
 * 기본 ID 생성기 인스턴스
 */
export const defaultIdGenerator = new IdGenerator('ce_')

/**
 * 간단한 ID 생성 함수
 */
export function generateId(type?: string): string {
  return defaultIdGenerator.generate(type)
}

/**
 * UUID 생성 함수
 */
export function generateUUID(): string {
  return defaultIdGenerator.generateUUID()
}

/**
 * 타임스탬프 ID 생성 함수
 */
export function generateTimestampId(type?: string): string {
  return defaultIdGenerator.generateTimestampId(type)
}

/**
 * HWPX ID를 Canvas Editor ID로 변환
 * @param hwpxId HWPX ID
 * @param type 요소 타입
 * @returns Canvas Editor ID
 */
export function convertHwpxId(hwpxId: string, type?: string): string {
  // HWPX ID 정규화
  const normalized = hwpxId.replace(/[^a-zA-Z0-9_-]/g, '_')
  
  if (type) {
    return `${type}_${normalized}`
  }
  return normalized
}

/**
 * ID 매핑 관리자
 */
export class IdMapper {
  private hwpxToCanvas: Map<string, string> = new Map()
  private canvasToHwpx: Map<string, string> = new Map()
  private idGenerator: IdGenerator
  
  constructor(prefix = '') {
    this.idGenerator = new IdGenerator(prefix)
  }
  
  /**
   * HWPX ID를 Canvas Editor ID로 매핑
   * @param hwpxId HWPX ID
   * @param type 요소 타입 (선택사항)
   * @returns Canvas Editor ID
   */
  mapId(hwpxId: string, type?: string): string {
    // 이미 매핑된 경우
    if (this.hwpxToCanvas.has(hwpxId)) {
      return this.hwpxToCanvas.get(hwpxId)!
    }
    
    // 새로운 ID 생성
    const canvasId = this.idGenerator.generate(type)
    
    // 양방향 매핑 저장
    this.hwpxToCanvas.set(hwpxId, canvasId)
    this.canvasToHwpx.set(canvasId, hwpxId)
    
    return canvasId
  }
  
  /**
   * Canvas Editor ID로 원본 HWPX ID 가져오기
   * @param canvasId Canvas Editor ID
   * @returns HWPX ID 또는 undefined
   */
  getOriginalId(canvasId: string): string | undefined {
    return this.canvasToHwpx.get(canvasId)
  }
  
  /**
   * 매핑된 Canvas Editor ID 가져오기
   * @param hwpxId HWPX ID
   * @returns Canvas Editor ID 또는 undefined
   */
  getMappedId(hwpxId: string): string | undefined {
    return this.hwpxToCanvas.get(hwpxId)
  }
  
  /**
   * 매핑 초기화
   */
  clear(): void {
    this.hwpxToCanvas.clear()
    this.canvasToHwpx.clear()
    this.idGenerator.reset()
  }
  
  /**
   * 매핑 정보 내보내기
   * @returns 매핑 정보 객체
   */
  export(): { hwpxToCanvas: Record<string, string>, canvasToHwpx: Record<string, string> } {
    return {
      hwpxToCanvas: Object.fromEntries(this.hwpxToCanvas),
      canvasToHwpx: Object.fromEntries(this.canvasToHwpx)
    }
  }
  
  /**
   * 매핑 정보 가져오기
   * @param mapping 매핑 정보 객체
   */
  import(mapping: { hwpxToCanvas: Record<string, string>, canvasToHwpx: Record<string, string> }): void {
    this.clear()
    
    for (const [hwpxId, canvasId] of Object.entries(mapping.hwpxToCanvas)) {
      this.hwpxToCanvas.set(hwpxId, canvasId)
    }
    
    for (const [canvasId, hwpxId] of Object.entries(mapping.canvasToHwpx)) {
      this.canvasToHwpx.set(canvasId, hwpxId)
    }
  }
}