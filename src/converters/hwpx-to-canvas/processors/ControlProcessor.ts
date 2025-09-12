import { ElementType } from '../../../editor/dataset/enum/Element'
import { ControlType } from '../../../editor/dataset/enum/Control'
import { IElement } from '../../../editor/interface/Element'
import { IControl } from '../../../editor/interface/Control'
import { ICheckbox } from '../../../editor/interface/Checkbox'
import { IRadio } from '../../../editor/interface/Radio'
import { IHWPXNode as HWPXNode } from '../types'
import { BaseProcessor, ProcessorContext } from './BaseProcessor'

/**
 * 컨트롤 요소 처리 Processor
 * HWPX의 폼 컨트롤 관련 노드를 Canvas Editor의 CONTROL 요소로 변환
 */
export class ControlProcessor extends BaseProcessor {
  supportedTags = [
    'ctrl', 'control', 'field', 'form',
    'hp:ctrl', 'hp:control', 'hp:field', 'hp:form',
    'input', 'select', 'textarea', 'checkbox', 'radio', 'date'
  ]

  process(node: HWPXNode, context?: ProcessorContext): IElement[] {
    const elements: IElement[] = []

    // 컨트롤 타입 결정
    const controlType = this.getControlType(node)
    
    switch (controlType) {
      case 'checkbox':
        elements.push(this.createCheckbox(node, context))
        break
      case 'radio':
        elements.push(this.createRadio(node, context))
        break
      case 'date':
        elements.push(this.createDateControl(node, context))
        break
      case 'text':
      case 'select':
      default:
        elements.push(this.createTextControl(node, context, controlType))
        break
    }

    return elements
  }

  /**
   * 컨트롤 타입 결정
   */
  private getControlType(node: HWPXNode): string {
    // 태그로 판단
    if (node.tag.includes('checkbox')) return 'checkbox'
    if (node.tag.includes('radio')) return 'radio'
    if (node.tag.includes('date')) return 'date'
    if (node.tag.includes('select')) return 'select'
    
    // 속성으로 판단
    const type = this.getAttribute(node, 'type') || this.getAttribute(node, 'controlType')
    if (type) {
      return type.toLowerCase()
    }

    // 필드 타입으로 판단
    const fieldType = this.getAttribute(node, 'fieldType')
    if (fieldType) {
      switch (fieldType.toLowerCase()) {
        case 'checkbox': return 'checkbox'
        case 'radio': return 'radio'
        case 'date': return 'date'
        case 'dropdown': return 'select'
        default: return 'text'
      }
    }

    return 'text' // 기본값
  }

  /**
   * 체크박스 생성
   */
  private createCheckbox(node: HWPXNode, context?: ProcessorContext): IElement {
    // 체크 상태 확인
    const checked = this.getAttribute(node, 'checked') || this.getAttribute(node, 'value')
    let checkValue: boolean | null = null
    if (checked === '1' || checked === 'true') {
      checkValue = true
    } else if (checked === '0' || checked === 'false') {
      checkValue = false
    }

    const checkbox: ICheckbox = {
      value: checkValue,
      code: this.getAttribute(node, 'code') || undefined,
      disabled: this.getAttribute(node, 'disabled') === '1'
    }

    const element: IElement = {
      type: ElementType.CHECKBOX,
      value: '',
      checkbox
    }

    // ID 생성
    if (context?.generateId) {
      element.id = context.generateId()
    }

    return element
  }

  /**
   * 라디오 버튼 생성
   */
  private createRadio(node: HWPXNode, context?: ProcessorContext): IElement {
    // 선택 상태 확인
    const selected = this.getAttribute(node, 'selected') || this.getAttribute(node, 'checked')
    let radioValue: boolean | null = null
    if (selected === '1' || selected === 'true') {
      radioValue = true
    } else if (selected === '0' || selected === 'false') {
      radioValue = false
    }

    const radio: IRadio = {
      value: radioValue,
      code: this.getAttribute(node, 'code') || undefined,
      disabled: this.getAttribute(node, 'disabled') === '1'
    }

    const element: IElement = {
      type: ElementType.RADIO,
      value: '',
      radio
    }

    // ID 생성
    if (context?.generateId) {
      element.id = context.generateId()
    }

    return element
  }

  /**
   * 날짜 컨트롤 생성
   */
  private createDateControl(node: HWPXNode, context?: ProcessorContext): IElement {
    const element: IElement = {
      type: ElementType.DATE,
      value: ''
    }

    // 날짜 값
    const dateValue = this.getAttribute(node, 'value') || this.getAttribute(node, 'date')
    if (dateValue) {
      element.value = this.formatDate(dateValue)
    }

    // 날짜 형식
    const dateFormat = this.getAttribute(node, 'format') || this.getAttribute(node, 'dateFormat')
    if (dateFormat) {
      // TODO: 날짜 형식 저장
      element.extension = { format: dateFormat }
    }

    // ID 생성
    if (context?.generateId) {
      element.id = context.generateId()
    }

    return element
  }

  /**
   * 텍스트 컨트롤 생성
   */
  private createTextControl(
    node: HWPXNode,
    context: ProcessorContext | undefined,
    controlType: string
  ): IElement {
    const control: IControl = {
      type: ControlType.TEXT,
      value: null,
      placeholder: this.getAttribute(node, 'placeholder') || '',
      conceptId: this.getAttribute(node, 'conceptId') || undefined
    }

    // 컨트롤 타입별 설정
    if (controlType === 'select') {
      control.type = ControlType.SELECT
      
      // 옵션 추출
      const options = this.extractSelectOptions(node)
      if (options) {
        control.extension = { options }
      }
    }

    const element: IElement = {
      type: ElementType.CONTROL,
      value: '',
      control
    }

    // 값 설정
    const value = this.getAttribute(node, 'value') || this.extractText(node)
    if (value) {
      control.value = [{ value }]
      element.value = value
    }

    // 읽기 전용
    const readonly = this.getAttribute(node, 'readonly') || this.getAttribute(node, 'editable')
    if (readonly === '1' || readonly === 'false') {
      control.disabled = true // 읽기 전용 표시
    }

    // ID 생성
    if (context?.generateId) {
      element.id = context.generateId()
    }

    return element
  }

  /**
   * 선택 옵션 추출
   */
  private extractSelectOptions(node: HWPXNode): string[] | null {
    const options: string[] = []

    // option 자식 노드들 찾기
    if (node.children) {
      for (const child of node.children) {
        if (child.tag === 'option' || child.tag === 'item') {
          const optionText = this.extractText(child) || 
                           this.getAttribute(child, 'value') ||
                           this.getAttribute(child, 'text')
          if (optionText) {
            options.push(optionText)
          }
        }
      }
    }

    // 속성에서 옵션 추출
    const optionsAttr = this.getAttribute(node, 'options') || this.getAttribute(node, 'items')
    if (optionsAttr) {
      // 콤마로 구분된 옵션들
      const optionList = optionsAttr.split(',').map(opt => opt.trim())
      options.push(...optionList)
    }

    return options.length > 0 ? options : null
  }

  /**
   * 날짜 형식 변환
   */
  private formatDate(dateStr: string): string {
    // YYYYMMDD -> YYYY-MM-DD
    if (/^\d{8}$/.test(dateStr)) {
      return `${dateStr.substr(0, 4)}-${dateStr.substr(4, 2)}-${dateStr.substr(6, 2)}`
    }

    // 이미 형식화된 날짜
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }

    // 타임스탬프
    const timestamp = parseInt(dateStr)
    if (!isNaN(timestamp)) {
      const date = new Date(timestamp)
      return date.toISOString().split('T')[0]
    }

    return dateStr
  }
}