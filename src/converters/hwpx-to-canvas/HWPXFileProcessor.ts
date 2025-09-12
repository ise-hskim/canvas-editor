/**
 * HWPX 파일 처리기
 * HWPX 파일(ZIP)을 파싱하여 JSON으로 변환
 */

import JSZip from 'jszip'
import { parseStringPromise } from 'xml2js'

export interface IHWPXFileProcessor {
  processFile(file: File | Buffer): Promise<any>
  extractAndParse(zipData: ArrayBuffer | Buffer): Promise<any>
}

export class HWPXFileProcessor implements IHWPXFileProcessor {
  /**
   * 파일 처리 (브라우저 또는 Node.js)
   */
  async processFile(file: File | Buffer): Promise<any> {
    let arrayBuffer: ArrayBuffer
    
    if (file instanceof File) {
      // 브라우저 환경
      arrayBuffer = await file.arrayBuffer()
    } else {
      // Node.js 환경
      arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
    }
    
    return this.extractAndParse(arrayBuffer)
  }
  
  /**
   * ZIP 파일 추출 및 파싱
   */
  async extractAndParse(zipData: ArrayBuffer | Buffer): Promise<any> {
    const zip = new JSZip()
    const contents = await zip.loadAsync(zipData)
    
    const result: any = {
      metadata: {},
      content: {
        sections: []
      }
    }
    
    // 주요 파일 추출
    for (const [path, file] of Object.entries(contents.files)) {
      if (path.endsWith('.xml')) {
        const content = await file.async('string')
        const parsed = await this.parseXML(content)
        
        if (path.includes('section')) {
          // 섹션 파일
          const sectionNumber = this.extractSectionNumber(path)
          result.content.sections[sectionNumber] = {
            path,
            data: {
              parsed_structure: this.transformXMLToJSON(parsed)
            }
          }
        } else if (path === 'version.xml') {
          result.metadata.version = parsed
        } else if (path === 'settings.xml') {
          result.metadata.settings = parsed
        }
      } else if (path.includes('Preview/PrvImage')) {
        // 미리보기 이미지
        const imageData = await file.async('base64')
        result.metadata.preview = `data:image/png;base64,${imageData}`
      }
    }
    
    // 이미지 추출
    result.images = await this.extractImages(contents)
    
    return result
  }
  
  /**
   * XML 파싱
   */
  private async parseXML(xmlContent: string): Promise<any> {
    try {
      const options = {
        explicitArray: false,
        ignoreAttrs: false,
        tagNameProcessors: [(name: string) => name.replace(/^.*:/, '')]
      }
      
      return await parseStringPromise(xmlContent, options)
    } catch (error) {
      console.error('XML 파싱 에러:', error)
      return null
    }
  }
  
  /**
   * XML을 JSON 구조로 변환
   */
  private transformXMLToJSON(parsed: any): any {
    if (!parsed) return null
    
    // HWPX XML 구조를 우리의 JSON 구조로 변환
    const transform = (node: any, tagName?: string): any => {
      if (typeof node === 'string') {
        return {
          tag: tagName || 'text',
          text: node,
          children: []
        }
      }
      
      if (Array.isArray(node)) {
        return node.map(n => transform(n, tagName))
      }
      
      const result: any = {
        tag: tagName || 'unknown',
        attributes: node.$ || {},
        text: null,
        children: []
      }
      
      // 텍스트 노드 처리
      if (node._) {
        result.text = node._
      }
      
      // 자식 노드 처리
      for (const [key, value] of Object.entries(node)) {
        if (key !== '$' && key !== '_') {
          const children = transform(value, key)
          if (Array.isArray(children)) {
            result.children.push(...children)
          } else {
            result.children.push(children)
          }
        }
      }
      
      return result
    }
    
    // 루트 노드 찾기
    const rootKey = Object.keys(parsed).find(k => k !== '$')
    if (rootKey) {
      return transform(parsed[rootKey], rootKey)
    }
    
    return transform(parsed)
  }
  
  /**
   * 섹션 번호 추출
   */
  private extractSectionNumber(path: string): number {
    const match = path.match(/section(\d+)/)
    return match ? parseInt(match[1]) : 0
  }
  
  /**
   * 이미지 추출
   */
  private async extractImages(contents: JSZip): Promise<Record<string, string>> {
    const images: Record<string, string> = {}
    
    for (const [path, file] of Object.entries(contents.files)) {
      if (path.match(/\.(png|jpg|jpeg|gif|bmp)$/i)) {
        const imageData = await file.async('base64')
        const extension = path.split('.').pop()?.toLowerCase()
        images[path] = `data:image/${extension};base64,${imageData}`
      }
    }
    
    return images
  }
}