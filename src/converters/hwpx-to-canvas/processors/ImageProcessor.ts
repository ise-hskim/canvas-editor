import { ElementType } from '../../../editor/dataset/enum/Element'
import { ImageDisplay } from '../../../editor/dataset/enum/Common'
import { IElement } from '../../../editor/interface/Element'
import { IHWPXNode as HWPXNode } from '../types'
import { BaseProcessor, ProcessorContext } from './BaseProcessor'

/**
 * 이미지 요소 처리 Processor
 * HWPX의 이미지 관련 노드를 Canvas Editor의 IMAGE 요소로 변환
 */
export class ImageProcessor extends BaseProcessor {
  supportedTags = ['hp:pic', 'hp:image', 'hp:img']

  process(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []

    const imageElement = this.processImage(node, context)
    if (imageElement) {
      elements.push(imageElement)
    }

    return elements
  }

  /**
   * 이미지 요소 처리
   */
  private processImage(node: HWPXNode, context?: ProcessorContext): IElement | null {
    // 이미지 속성 추출
    const imageProps = this.extractImageProperties(node)
    
    // 이미지 데이터 추출
    const imageData = this.extractImageData(node)
    
    if (!imageData) {
      console.warn('ImageProcessor: No image data found')
      return null
    }

    // 이미지 요소 생성
    const imageElement: IElement = {
      type: ElementType.IMAGE,
      value: imageData,
      ...imageProps
    }

    // 이미지 ID 생성
    if (context?.generateId) {
      imageElement.id = context.generateId()
    }

    return imageElement
  }

  /**
   * 이미지 속성 추출
   */
  private extractImageProperties(node: HWPXNode): Partial<IElement> {
    const props: Partial<IElement> = {}

    // 이미지 크기
    const width = this.getAttribute(node, 'width')
    const height = this.getAttribute(node, 'height')
    
    if (width) {
      props.width = this.convertSize(width)
    }
    
    if (height) {
      props.height = this.convertSize(height)
    }

    // 이미지 표시 방식
    const display = this.getAttribute(node, 'display')
    if (display) {
      props.imgDisplay = this.convertImageDisplay(display)
    } else {
      props.imgDisplay = ImageDisplay.INLINE // 기본값
    }

    // 이미지 정렬
    const align = this.getAttribute(node, 'align')
    if (align) {
      // TODO: 이미지 정렬 처리
    }

    // 이미지 회전
    const rotation = this.getAttribute(node, 'rotation')
    if (rotation) {
      // TODO: 이미지 회전 처리
    }

    // 이미지 투명도
    const opacity = this.getAttribute(node, 'opacity')
    if (opacity) {
      // TODO: 이미지 투명도 처리
    }

    return props
  }

  /**
   * 이미지 데이터 추출
   */
  private extractImageData(node: HWPXNode): string | null {
    // 이미지 바이너리 데이터 노드 찾기
    const imageData = node.children?.find(child => 
      child.tag === 'hp:imageData' || 
      child.tag === 'hp:binData'
    )
    
    if (imageData) {
      // Base64 인코딩된 데이터
      const base64Data = imageData.text || this.extractText(imageData)
      if (base64Data) {
        // MIME 타입 결정
        const mimeType = this.getMimeType(node)
        return `data:${mimeType};base64,${base64Data.trim()}`
      }
    }

    // 외부 이미지 참조
    const imageRef = this.getAttribute(node, 'href') || this.getAttribute(node, 'src')
    if (imageRef) {
      // TODO: HWPX 파일 내부의 이미지 파일 경로 처리
      // 예: BinData/image1.png -> 실제 이미지 데이터로 변환
      return imageRef
    }

    return null
  }

  /**
   * MIME 타입 결정
   */
  private getMimeType(node: HWPXNode): string {
    const format = this.getAttribute(node, 'format') || 
                  this.getAttribute(node, 'imageType')
    
    switch (format?.toLowerCase()) {
      case 'png':
        return 'image/png'
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'gif':
        return 'image/gif'
      case 'bmp':
        return 'image/bmp'
      case 'svg':
        return 'image/svg+xml'
      default:
        return 'image/png' // 기본값
    }
  }

  /**
   * 크기 변환 (HWPX 단위 -> 픽셀)
   */
  private convertSize(size: string): number {
    const value = parseFloat(size)
    if (isNaN(value)) return 100 // 기본값

    // HWPX는 보통 HWPUNIT 사용 (1/7200 인치)
    // 또는 mm, pt 등 다양한 단위 사용 가능
    if (size.includes('mm')) {
      // mm to pixels (96 DPI 기준)
      return Math.round(value * 96 / 25.4)
    } else if (size.includes('pt')) {
      // pt to pixels
      return Math.round(value * 96 / 72)
    } else {
      // HWPUNIT to pixels (7200 unit = 1 inch = 96 pixels)
      return Math.round(value * 96 / 7200)
    }
  }

  /**
   * 이미지 표시 방식 변환
   */
  private convertImageDisplay(display: string): ImageDisplay {
    switch (display) {
      case 'inline':
        return ImageDisplay.INLINE
      case 'block':
        return ImageDisplay.BLOCK
      default:
        return ImageDisplay.INLINE
    }
  }
}