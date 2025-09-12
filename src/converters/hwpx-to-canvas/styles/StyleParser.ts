/**
 * HWPX 스타일 파서
 * StyleLoader를 사용하여 HWPX 스타일을 Canvas Editor 스타일로 변환
 */

import { IElement } from '../../../editor/interface/Element'
import { RowFlex } from '../../../editor/dataset/enum/Row'
import { IHWPXNode } from '../types'
import { StyleLoader } from './StyleLoader'

/**
 * 문자 스타일 정의
 */
export interface ICharStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikeout?: boolean
  fontSize?: number
  fontFamily?: string
  color?: string
  backgroundColor?: string
  superscript?: boolean
  subscript?: boolean
}

/**
 * 문단 스타일 정의
 */
export interface IParaStyle {
  align?: 'left' | 'center' | 'right' | 'justify'
  indent?: number
  lineHeight?: number
  spacing?: number
  beforeSpacing?: number
  afterSpacing?: number
}

/**
 * 스타일 파서 클래스
 */
export class StyleParser {
  private static styleLoader: StyleLoader | null = null
  
  /**
   * StyleLoader 설정
   */
  public static setStyleLoader(loader: StyleLoader): void {
    this.styleLoader = loader
  }
  
  /**
   * 문자 스타일 ID로부터 스타일 가져오기
   */
  public static getCharStyle(charPrIDRef: string | undefined): Partial<ICharStyle> {
    if (!charPrIDRef || !this.styleLoader) return {}
    
    const charProp = this.styleLoader.getCharProperty(charPrIDRef)
    if (!charProp) return {}
    
    const style: Partial<ICharStyle> = {}
    
    // 폰트 크기 변환 (100단위 = 1pt)
    if (charProp.height) {
      style.fontSize = Math.round(charProp.height / 100)
    } else {
      // height가 없으면 기본값 11pt
      style.fontSize = 11
    }
    
    // 텍스트 장식
    if (charProp.bold) style.bold = true
    if (charProp.italic) style.italic = true
    if (charProp.underline) style.underline = true
    if (charProp.strikeout) style.strikeout = true
    
    // 색상
    if (charProp.textColor) {
      style.color = this.convertColor(charProp.textColor)
    }
    if (charProp.shadeColor) {
      style.backgroundColor = this.convertColor(charProp.shadeColor)
    }
    
    // 폰트 (fontRef를 실제 폰트명으로 변환)
    if (charProp.fontRef?.hangul) {
      const fontId = charProp.fontRef.hangul
      const font = this.styleLoader.getFont(fontId)
      if (font?.name) {
        style.fontFamily = this.mapFontName(font.name)
      }
    }
    
    return style
  }
  
  /**
   * 문단 스타일 ID로부터 스타일 가져오기
   */
  public static getParaStyle(paraPrIDRef: string | undefined): Partial<IParaStyle> {
    if (!paraPrIDRef || !this.styleLoader) return {}
    
    const paraProp = this.styleLoader.getParaProperty(paraPrIDRef)
    if (!paraProp) return {}
    
    const style: Partial<IParaStyle> = {}
    
    // 정렬
    if (paraProp.align?.horizontal) {
      switch (paraProp.align.horizontal) {
        case 'LEFT':
          style.align = 'left'
          break
        case 'CENTER':
          style.align = 'center'
          break
        case 'RIGHT':
          style.align = 'right'
          break
        case 'JUSTIFY':
          style.align = 'justify'
          break
      }
    }
    
    // 들여쓰기
    if (paraProp.indent) {
      if (paraProp.indent.left) {
        style.indent = Math.round(paraProp.indent.left / 100)
      } else if (paraProp.indent.firstLine) {
        style.indent = Math.round(paraProp.indent.firstLine / 100)
      }
    }
    
    // 줄 간격
    if (paraProp.lineSpacing) {
      if (paraProp.lineSpacing.type === 'PERCENT' && paraProp.lineSpacing.value) {
        // 160% -> 1.6
        style.lineHeight = parseInt(paraProp.lineSpacing.value) / 100
      }
    }
    
    // 문단 간격
    if (paraProp.margin) {
      if (paraProp.margin.top) {
        style.beforeSpacing = Math.round(paraProp.margin.top / 100)
      }
      if (paraProp.margin.bottom) {
        style.afterSpacing = Math.round(paraProp.margin.bottom / 100)
      }
    }
    
    return style
  }
  
  /**
   * run 노드에서 스타일 추출
   */
  public static extractRunStyle(node: IHWPXNode): Partial<ICharStyle> {
    const charPrIDRef = node.attributes?.charPrIDRef
    const baseStyle = this.getCharStyle(charPrIDRef)
    
    // 인라인 스타일 확인
    const inlineStyle: Partial<ICharStyle> = {}
    
    // charPr 자식 노드 확인
    const charPr = node.children?.find(child => child.tag === 'charPr')
    if (charPr) {
      // 폰트 크기
      const sz = charPr.children?.find(child => child.tag === 'sz')
      if (sz?.attributes?.value) {
        inlineStyle.fontSize = parseInt(sz.attributes.value) / 100
      }
      
      // 폰트 패밀리
      const fontRef = charPr.children?.find(child => child.tag === 'fontRef')
      if (fontRef?.attributes?.fontface) {
        inlineStyle.fontFamily = this.mapFontName(fontRef.attributes.fontface)
      }
      
      // 색상
      const color = charPr.children?.find(child => child.tag === 'color')
      if (color?.attributes?.value) {
        inlineStyle.color = this.convertColor(color.attributes.value)
      }
      
      // 굵기
      const bold = charPr.children?.find(child => child.tag === 'bold')
      if (bold) {
        inlineStyle.bold = bold.attributes?.value !== 'false'
      }
      
      // 기울임
      const italic = charPr.children?.find(child => child.tag === 'italic')
      if (italic) {
        inlineStyle.italic = italic.attributes?.value !== 'false'
      }
      
      // 밑줄
      const underline = charPr.children?.find(child => child.tag === 'underline')
      if (underline) {
        inlineStyle.underline = underline.attributes?.type !== 'none'
      }
      
      // 취소선
      const strikeout = charPr.children?.find(child => child.tag === 'strikeout')
      if (strikeout) {
        inlineStyle.strikeout = strikeout.attributes?.type !== 'none'
      }
    }
    
    // 기본 스타일과 인라인 스타일 병합
    return { ...baseStyle, ...inlineStyle }
  }
  
  /**
   * 문단 노드에서 스타일 추출
   */
  public static extractParaStyle(node: IHWPXNode): Partial<IParaStyle> {
    const paraPrIDRef = node.attributes?.paraPrIDRef
    const baseStyle = this.getParaStyle(paraPrIDRef)
    
    // 인라인 스타일 확인
    const inlineStyle: Partial<IParaStyle> = {}
    
    // paraPr 자식 노드 확인
    const paraPr = node.children?.find(child => child.tag === 'paraPr')
    if (paraPr) {
      // 정렬
      const align = paraPr.children?.find(child => child.tag === 'align')
      if (align?.attributes?.horizontal) {
        const alignMap: Record<string, 'left' | 'center' | 'right' | 'justify'> = {
          'LEFT': 'left',
          'CENTER': 'center',
          'RIGHT': 'right',
          'JUSTIFY': 'justify',
          'BOTH': 'justify'
        }
        inlineStyle.align = alignMap[align.attributes.horizontal] || 'left'
      }
      
      // 들여쓰기
      const indent = paraPr.children?.find(child => child.tag === 'indent')
      if (indent?.attributes?.value) {
        inlineStyle.indent = parseInt(indent.attributes.value) / 100
      }
      
      // 줄 간격
      const lineSpacing = paraPr.children?.find(child => child.tag === 'lineSpacing')
      if (lineSpacing?.attributes?.value) {
        inlineStyle.lineHeight = parseInt(lineSpacing.attributes.value) / 100
      }
    }
    
    return { ...baseStyle, ...inlineStyle }
  }
  
  /**
   * 스타일을 IElement에 적용
   */
  public static applyCharStyle(element: IElement, style: Partial<ICharStyle>): void {
    if (style.bold) element.bold = true
    if (style.italic) element.italic = true
    if (style.underline) element.underline = true
    if (style.strikeout) element.strikeout = true
    if (style.fontSize) element.size = style.fontSize
    if (style.fontFamily) element.font = style.fontFamily
    if (style.color) element.color = style.color
    if (style.backgroundColor) element.highlight = style.backgroundColor
    if (style.superscript) element.type = 'superscript' as any
    if (style.subscript) element.type = 'subscript' as any
  }
  
  /**
   * 문단 스타일을 RowFlex로 변환
   */
  public static convertAlignToRowFlex(align: string | undefined): RowFlex | undefined {
    if (!align) return undefined
    
    switch (align) {
      case 'left':
        return RowFlex.LEFT
      case 'center':
        return RowFlex.CENTER
      case 'right':
        return RowFlex.RIGHT
      case 'justify':
        return RowFlex.ALIGNMENT
      default:
        return undefined
    }
  }
  
  /**
   * HWPX 색상값을 CSS 색상으로 변환
   */
  private static convertColor(hwpxColor: string): string {
    if (hwpxColor.startsWith('#')) {
      return hwpxColor
    }
    
    const colorNum = parseInt(hwpxColor)
    if (!isNaN(colorNum)) {
      // HWPX는 BGR 순서
      const b = (colorNum >> 16) & 0xFF
      const g = (colorNum >> 8) & 0xFF
      const r = colorNum & 0xFF
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }
    
    return '#000000'
  }
  
  /**
   * HWPX 폰트명을 웹 폰트로 매핑
   */
  private static mapFontName(hwpxFont: string): string {
    // 한글 폰트 매핑
    const fontMap: Record<string, string> = {
      '함초롬바탕': 'HCR Batang, 함초롬바탕, Batang, serif',
      '함초롬돋움': 'HCR Dotum, 함초롬돋움, Dotum, sans-serif',
      '한컴바탕': 'HCR Batang, Batang, serif',
      '한컴돋움': 'HCR Dotum, Dotum, sans-serif',
      '바탕': 'Batang, serif',
      '돋움': 'Dotum, sans-serif',
      '굴림': 'Gulim, sans-serif',
      '궁서': 'Gungsuh, serif',
      '맑은 고딕': 'Malgun Gothic, sans-serif',
      '나눔고딕': 'Nanum Gothic, sans-serif',
      '나눔명조': 'Nanum Myeongjo, serif'
    }
    
    return fontMap[hwpxFont] || hwpxFont
  }
}