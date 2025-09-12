/**
 * HWPX 스타일 로더
 * HWPX JSON의 header에서 스타일 정의를 로드하고 관리
 */

import { IHWPXNode } from '../types'

/**
 * 문자 스타일 정의 (charPr)
 */
export interface ICharPropertyDef {
  id: string
  height?: number // 폰트 크기 (100 = 1pt)
  textColor?: string
  shadeColor?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean | string
  strikeout?: boolean | string
  fontRef?: {
    hangul?: string
    latin?: string
    hanja?: string
    japanese?: string
    other?: string
    symbol?: string
    user?: string
  }
  shadow?: {
    type?: string
    color?: string
    offsetX?: string
    offsetY?: string
  }
}

/**
 * 문단 스타일 정의 (paraPr)
 */
export interface IParaPropertyDef {
  id: string
  align?: {
    horizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFY'
    vertical?: string
  }
  margin?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  indent?: {
    firstLine?: number
    left?: number
    right?: number
  }
  lineSpacing?: {
    type?: string
    value?: string
    unit?: string
  }
}

/**
 * 폰트 정의
 */
export interface IFontDef {
  id: number
  name?: string
  altNames?: string[]
}

/**
 * 스타일 로더 클래스
 */
export class StyleLoader {
  private charProperties: Map<string, ICharPropertyDef> = new Map()
  private paraProperties: Map<string, IParaPropertyDef> = new Map()
  private fonts: Map<string, IFontDef> = new Map()
  
  /**
   * HWPX JSON header에서 스타일 정의 로드
   */
  loadFromHeader(header: IHWPXNode): void {
    // refList 찾기
    const refList = this.findNode(header, 'refList')
    if (!refList) {
      console.warn('StyleLoader: refList not found in header')
      return
    }
    
    // charProperties 로드
    const charPropertiesNode = this.findNode(refList, 'charProperties')
    if (charPropertiesNode) {
      this.loadCharProperties(charPropertiesNode)
    }
    
    // paraProperties 로드
    const paraPropertiesNode = this.findNode(refList, 'paraProperties')
    if (paraPropertiesNode) {
      this.loadParaProperties(paraPropertiesNode)
    }
    
    // fontfaces 로드
    const fontfacesNode = this.findNode(refList, 'fontfaces')
    if (fontfacesNode) {
      this.loadFonts(fontfacesNode)
    }
    
    console.log(`StyleLoader: Loaded ${this.charProperties.size} char styles, ${this.paraProperties.size} para styles, ${this.fonts.size} fonts`)
  }
  
  /**
   * 문자 스타일 정의 로드
   */
  private loadCharProperties(node: IHWPXNode): void {
    if (!node.children) return
    
    node.children.forEach(charPr => {
      if (charPr.tag === 'charPr' && charPr.attributes?.id) {
        const def: ICharPropertyDef = {
          id: charPr.attributes.id
        }
        
        // attributes에서 직접 추출
        if (charPr.attributes.height) {
          def.height = parseInt(charPr.attributes.height)
        }
        if (charPr.attributes.textColor) {
          def.textColor = charPr.attributes.textColor
        }
        if (charPr.attributes.shadeColor && charPr.attributes.shadeColor !== 'none') {
          def.shadeColor = charPr.attributes.shadeColor
        }
        
        // children에서 추출
        if (charPr.children) {
          charPr.children.forEach(child => {
            if (child.tag === 'bold') {
              def.bold = true
            } else if (child.tag === 'italic') {
              def.italic = true
            } else if (child.tag === 'underline') {
              def.underline = child.attributes?.type || true
            } else if (child.tag === 'strikeout') {
              def.strikeout = child.attributes?.type || true
            } else if (child.tag === 'fontRef' && child.attributes) {
              def.fontRef = { ...child.attributes }
            } else if (child.tag === 'shadow' && child.attributes) {
              def.shadow = { ...child.attributes }
            }
          })
        }
        
        this.charProperties.set(def.id, def)
      }
    })
  }
  
  /**
   * 문단 스타일 정의 로드
   */
  private loadParaProperties(node: IHWPXNode): void {
    if (!node.children) return
    
    node.children.forEach(paraPr => {
      if (paraPr.tag === 'paraPr' && paraPr.attributes?.id) {
        const def: IParaPropertyDef = {
          id: paraPr.attributes.id
        }
        
        // children에서 추출
        if (paraPr.children) {
          paraPr.children.forEach(child => {
            if (child.tag === 'align' && child.attributes) {
              def.align = {
                horizontal: child.attributes.horizontal as any,
                vertical: child.attributes.vertical
              }
            } else if (child.tag === 'margin' && child.attributes) {
              def.margin = {
                left: child.attributes.left ? parseInt(child.attributes.left) : undefined,
                right: child.attributes.right ? parseInt(child.attributes.right) : undefined,
                top: child.attributes.top ? parseInt(child.attributes.top) : undefined,
                bottom: child.attributes.bottom ? parseInt(child.attributes.bottom) : undefined
              }
            } else if (child.tag === 'indent' && child.attributes) {
              def.indent = {
                firstLine: child.attributes.firstLine ? parseInt(child.attributes.firstLine) : undefined,
                left: child.attributes.left ? parseInt(child.attributes.left) : undefined,
                right: child.attributes.right ? parseInt(child.attributes.right) : undefined
              }
            } else if (child.tag === 'lineSpacing' && child.attributes) {
              def.lineSpacing = { ...child.attributes }
            }
          })
        }
        
        this.paraProperties.set(def.id, def)
      }
    })
  }
  
  /**
   * 폰트 정의 로드
   */
  private loadFonts(node: IHWPXNode): void {
    if (!node.children) return
    
    node.children.forEach((font, idx) => {
      if (font.tag === 'font' || font.tag === 'fontface') {
        const def: IFontDef = {
          id: idx,
          name: font.attributes?.name
        }
        
        // 대체 이름 추출
        if (font.children) {
          const altNames = font.children.find(c => c.tag === 'altNames')
          if (altNames?.children) {
            def.altNames = altNames.children
              .filter(alt => alt.attributes?.name)
              .map(alt => alt.attributes!.name!)
          }
        }
        
        this.fonts.set(idx.toString(), def)
      }
    })
  }
  
  /**
   * 노드 찾기 헬퍼
   */
  private findNode(node: IHWPXNode, tag: string): IHWPXNode | null {
    if (node.tag === tag) return node
    
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNode(child, tag)
        if (found) return found
      }
    }
    
    return null
  }
  
  /**
   * 문자 스타일 가져오기
   */
  getCharProperty(id: string): ICharPropertyDef | undefined {
    return this.charProperties.get(id)
  }
  
  /**
   * 문단 스타일 가져오기
   */
  getParaProperty(id: string): IParaPropertyDef | undefined {
    return this.paraProperties.get(id)
  }
  
  /**
   * 폰트 정의 가져오기
   */
  getFont(id: string): IFontDef | undefined {
    return this.fonts.get(id)
  }
  
  /**
   * 기본 폰트 크기 가져오기 (height가 없을 때 사용)
   */
  getDefaultFontSize(): number {
    // 대부분의 본문은 1100 (11pt) 사용
    return 1100
  }
}