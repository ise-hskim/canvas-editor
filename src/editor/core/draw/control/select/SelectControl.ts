import {
  EDITOR_COMPONENT,
  EDITOR_PREFIX
} from '../../../../dataset/constant/Editor'
import {
  CONTROL_STYLE_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR,
  TEXTLIKE_ELEMENT_TYPE
} from '../../../../dataset/constant/Element'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { EditorComponent } from '../../../../dataset/enum/Editor'
import { ElementType } from '../../../../dataset/enum/Element'
import { KeyMap } from '../../../../dataset/enum/KeyMap'
import { DeepRequired } from '../../../../interface/Common'
import {
  IControlContext,
  IControlInstance,
  IControlRuleOption
} from '../../../../interface/Control'
import { IEditorOption } from '../../../../interface/Editor'
import { IElement } from '../../../../interface/Element'
import {
  isArrayEqual,
  isNonValue,
  omitObject,
  pickObject,
  splitText
} from '../../../../utils'
import { formatElementContext } from '../../../../utils/element'
import { Control } from '../Control'

export class SelectControl implements IControlInstance {
  private element: IElement
  private control: Control
  private isPopup: boolean
  private selectDom: HTMLDivElement | null
  private options: DeepRequired<IEditorOption>
  private VALUE_DELIMITER = ','
  private DEFAULT_MULTI_SELECT_DELIMITER = ','

  constructor(element: IElement, control: Control) {
    const draw = control.getDraw()
    this.options = draw.getOptions()
    this.element = element
    this.control = control
    this.isPopup = false
    this.selectDom = null
  }

  public setElement(element: IElement) {
    this.element = element
  }

  public getElement(): IElement {
    return this.element
  }

  public getIsPopup(): boolean {
    return this.isPopup
  }

  public getCodes(): string[] {
    return this.element?.control?.code
      ? this.element.control.code.split(',')
      : []
  }

  public getText(codes: string[]): string | null {
    if (!this.element?.control) return null
    const control = this.element.control
    if (!control.valueSets?.length) return null
    const multiSelectDelimiter =
      control?.multiSelectDelimiter || this.DEFAULT_MULTI_SELECT_DELIMITER
    const valueSets = control.valueSets
    const valueList: string[] = []
    codes.forEach(code => {
      const valueSet = valueSets.find(v => v.code === code)
      if (valueSet && !isNonValue(valueSet.value)) {
        valueList.push(valueSet.value)
      }
    })
    return valueList.join(multiSelectDelimiter) || null
  }

  public getValue(context: IControlContext = {}): IElement[] {
    const elementList = context.elementList || this.control.getElementList()
    const { startIndex } = context.range || this.control.getRange()
    const startElement = elementList[startIndex]
    const data: IElement[] = []
    // 왼쪽으로 찾기
    let preIndex = startIndex
    while (preIndex > 0) {
      const preElement = elementList[preIndex]
      if (
        preElement.controlId !== startElement.controlId ||
        preElement.controlComponent === ControlComponent.PREFIX ||
        preElement.controlComponent === ControlComponent.PRE_TEXT
      ) {
        break
      }
      if (preElement.controlComponent === ControlComponent.VALUE) {
        data.unshift(preElement)
      }
      preIndex--
    }
    // 오른쪽으로 찾기
    let nextIndex = startIndex + 1
    while (nextIndex < elementList.length) {
      const nextElement = elementList[nextIndex]
      if (
        nextElement.controlId !== startElement.controlId ||
        nextElement.controlComponent === ControlComponent.POSTFIX ||
        nextElement.controlComponent === ControlComponent.POST_TEXT
      ) {
        break
      }
      if (nextElement.controlComponent === ControlComponent.VALUE) {
        data.push(nextElement)
      }
      nextIndex++
    }
    return data
  }

  public setValue(
    data: IElement[],
    context: IControlContext = {},
    options: IControlRuleOption = {}
  ): number {
    // 설정 가능 여부 검증
    if (
      !this.element.control?.selectExclusiveOptions?.inputAble ||
      (!options.isIgnoreDisabledRule &&
        this.control.getIsDisabledControl(context))
    ) {
      return -1
    }
    const elementList = context.elementList || this.control.getElementList()
    const range = context.range || this.control.getRange()
    // 범위를 Value 내로 축소
    this.control.shrinkBoundary(context)
    const { startIndex, endIndex } = range
    const draw = this.control.getDraw()
    // 선택 영역 요소 제거
    if (startIndex !== endIndex) {
      draw.spliceElementList(elementList, startIndex + 1, endIndex - startIndex)
    } else {
      // 빈 자리표시자 제거
      this.control.removePlaceholder(startIndex, context)
    }
    // 비텍스트 요소 또는 접두사 스타일 속성 전환
    const startElement = elementList[startIndex]
    const anchorElement =
      (startElement.type &&
        !TEXTLIKE_ELEMENT_TYPE.includes(startElement.type)) ||
      startElement.controlComponent === ControlComponent.PREFIX ||
      startElement.controlComponent === ControlComponent.PRE_TEXT
        ? pickObject(startElement, [
            'control',
            'controlId',
            ...CONTROL_STYLE_ATTR
          ])
        : omitObject(startElement, ['type'])
    // 삽입 시작 위치
    const start = range.startIndex + 1
    for (let i = 0; i < data.length; i++) {
      const newElement: IElement = {
        ...anchorElement,
        ...data[i],
        controlComponent: ControlComponent.VALUE
      }
      formatElementContext(elementList, [newElement], startIndex, {
        editorOptions: this.options
      })
      draw.spliceElementList(elementList, start + i, 0, [newElement])
    }
    return start + data.length - 1
  }

  public keydown(evt: KeyboardEvent): number | null {
    if (this.control.getIsDisabledControl()) {
      return null
    }
    const elementList = this.control.getElementList()
    const range = this.control.getRange()
    // 범위를 Value 내로 축소
    this.control.shrinkBoundary()
    const { startIndex, endIndex } = range
    const startElement = elementList[startIndex]
    const endElement = elementList[endIndex]
    // backspace
    if (evt.key === KeyMap.Backspace) {
      // 옵션 지우기
      if (startIndex !== endIndex) {
        return this.clearSelect()
      } else {
        if (
          startElement.controlComponent === ControlComponent.PREFIX ||
          startElement.controlComponent === ControlComponent.PRE_TEXT ||
          endElement.controlComponent === ControlComponent.POSTFIX ||
          endElement.controlComponent === ControlComponent.POST_TEXT ||
          startElement.controlComponent === ControlComponent.PLACEHOLDER
        ) {
          // 접두사, 접미사, 자리표시자
          return this.control.removeControl(startIndex)
        } else {
          // 옵션 지우기
          return this.clearSelect()
        }
      }
    } else if (evt.key === KeyMap.Delete) {
      // 선택 영역 요소 제거
      if (startIndex !== endIndex) {
        // 옵션 지우기
        return this.clearSelect()
      } else {
        const endNextElement = elementList[endIndex + 1]
        if (
          ((startElement.controlComponent === ControlComponent.PREFIX ||
            startElement.controlComponent === ControlComponent.PRE_TEXT) &&
            endNextElement.controlComponent === ControlComponent.PLACEHOLDER) ||
          endNextElement.controlComponent === ControlComponent.POSTFIX ||
          endNextElement.controlComponent === ControlComponent.POST_TEXT ||
          startElement.controlComponent === ControlComponent.PLACEHOLDER
        ) {
          // 접두사, 접미사, 자리표시자
          return this.control.removeControl(startIndex)
        } else {
          // 옵션 지우기
          return this.clearSelect()
        }
      }
    }
    return endIndex
  }

  public cut(): number {
    if (this.control.getIsDisabledControl()) {
      return -1
    }
    this.control.shrinkBoundary()
    const { startIndex, endIndex } = this.control.getRange()
    if (startIndex === endIndex) {
      return startIndex
    }
    // 옵션 지우기
    return this.clearSelect()
  }

  public clearSelect(
    context: IControlContext = {},
    options: IControlRuleOption = {}
  ): number {
    const { isIgnoreDisabledRule = false, isAddPlaceholder = true } = options
    // 설정 가능 여부 검증
    if (!isIgnoreDisabledRule && this.control.getIsDisabledControl(context)) {
      return -1
    }
    const elementList = context.elementList || this.control.getElementList()
    const { startIndex } = context.range || this.control.getRange()
    const startElement = elementList[startIndex]
    let leftIndex = -1
    let rightIndex = -1
    // 왼쪽으로 찾기
    let preIndex = startIndex
    while (preIndex > 0) {
      const preElement = elementList[preIndex]
      if (
        preElement.controlId !== startElement.controlId ||
        preElement.controlComponent === ControlComponent.PREFIX ||
        preElement.controlComponent === ControlComponent.PRE_TEXT
      ) {
        leftIndex = preIndex
        break
      }
      preIndex--
    }
    // 오른쪽으로 찾기
    let nextIndex = startIndex + 1
    while (nextIndex < elementList.length) {
      const nextElement = elementList[nextIndex]
      if (
        nextElement.controlId !== startElement.controlId ||
        nextElement.controlComponent === ControlComponent.POSTFIX ||
        nextElement.controlComponent === ControlComponent.POST_TEXT
      ) {
        rightIndex = nextIndex - 1
        break
      }
      nextIndex++
    }
    if (!~leftIndex || !~rightIndex) return -1
    // 요소 삭제
    const draw = this.control.getDraw()
    draw.spliceElementList(
      elementList,
      leftIndex + 1,
      rightIndex - leftIndex,
      [],
      {
        isIgnoreDeletedRule: options.isIgnoreDeletedRule
      }
    )
    // 자리표시자 추가
    if (isAddPlaceholder) {
      this.control.addPlaceholder(preIndex, context)
    }
    this.control.setControlProperties(
      {
        code: null
      },
      {
        elementList,
        range: { startIndex: preIndex, endIndex: preIndex }
      }
    )
    return preIndex
  }

  public setSelect(
    code: string,
    context: IControlContext = {},
    options: IControlRuleOption = {}
  ) {
    // 설정 가능 여부 검증
    if (
      !options.isIgnoreDisabledRule &&
      this.control.getIsDisabledControl(context)
    ) {
      return
    }
    const elementList = context.elementList || this.control.getElementList()
    const range = context.range || this.control.getRange()
    const control = this.element.control!
    const newCodes = code?.split(this.VALUE_DELIMITER) || []
    // 이전 값 캐시
    const oldCode = control.code
    const oldCodes = control.code?.split(this.VALUE_DELIMITER) || []
    // 옵션이 동일할 때 중복 렌더링 불필요
    const isMultiSelect = control.isMultiSelect
    if (
      (!isMultiSelect && code === oldCode) ||
      (isMultiSelect && isArrayEqual(oldCodes, newCodes))
    ) {
      this.control.repaintControl({
        curIndex: range.startIndex,
        isCompute: false,
        isSubmitHistory: false
      })
      this.destroy()
      return
    }
    const valueSets = control.valueSets
    if (!Array.isArray(valueSets) || !valueSets.length) return
    // 텍스트 변환
    const text = this.getText(newCodes)
    if (!text) {
      // 이전에 내용이 있을 때 텍스트 지우기
      if (oldCode) {
        const prefixIndex = this.clearSelect(context, {
          isIgnoreDeletedRule: options.isIgnoreDeletedRule
        })
        if (~prefixIndex) {
          this.control.repaintControl({
            curIndex: prefixIndex
          })
          this.control.emitControlContentChange({
            controlValue: []
          })
        }
      }
      return
    }
    // 스타일 할당 요소 - 기본값의 첫 번째 문자 스타일, 그렇지 않으면 기본 스타일
    const valueElement = this.getValue(context)[0]
    const styleElement = valueElement
      ? pickObject(valueElement, EDITOR_ELEMENT_STYLE_ATTR)
      : pickObject(elementList[range.startIndex], CONTROL_STYLE_ATTR)
    // 옵션 지우기
    const prefixIndex = this.clearSelect(context, {
      isAddPlaceholder: false,
      isIgnoreDeletedRule: options.isIgnoreDeletedRule
    })
    if (!~prefixIndex) return
    // 현재 값이 없을 때 자리표시자 지우기
    if (!oldCode) {
      this.control.removePlaceholder(prefixIndex, context)
    }
    // 속성 할당 요소 - 기본적으로 접두사 속성
    const propertyElement = omitObject(
      elementList[prefixIndex],
      EDITOR_ELEMENT_STYLE_ATTR
    )
    const start = prefixIndex + 1
    const data = splitText(text)
    const draw = this.control.getDraw()
    for (let i = 0; i < data.length; i++) {
      const newElement: IElement = {
        ...styleElement,
        ...propertyElement,
        type: ElementType.TEXT,
        value: data[i],
        controlComponent: ControlComponent.VALUE
      }
      formatElementContext(elementList, [newElement], prefixIndex, {
        editorOptions: this.options
      })
      draw.spliceElementList(elementList, start + i, 0, [newElement])
    }
    // 상태 설정
    this.control.setControlProperties(
      {
        code
      },
      {
        elementList,
        range: { startIndex: prefixIndex, endIndex: prefixIndex }
      }
    )
    // 컨트롯 다시 렌더링
    if (!context.range) {
      const newIndex = start + data.length - 1
      this.control.repaintControl({
        curIndex: newIndex
      })
      this.control.emitControlContentChange({
        context
      })
      if (!isMultiSelect) {
        this.destroy()
      }
    }
  }

  private _createSelectPopupDom() {
    const control = this.element.control!
    const valueSets = control.valueSets
    if (!Array.isArray(valueSets) || !valueSets.length) return
    const position = this.control.getPosition()
    if (!position) return
    // DOM 트리: <div><ul><li>item</li></ul></div>
    const selectPopupContainer = document.createElement('div')
    selectPopupContainer.classList.add(`${EDITOR_PREFIX}-select-control-popup`)
    selectPopupContainer.setAttribute(EDITOR_COMPONENT, EditorComponent.POPUP)
    const ul = document.createElement('ul')
    for (let v = 0; v < valueSets.length; v++) {
      const valueSet = valueSets[v]
      const li = document.createElement('li')
      let codes = this.getCodes()
      if (codes.includes(valueSet.code)) {
        li.classList.add('active')
      }
      li.onclick = () => {
        const codeIndex = codes.findIndex(code => code === valueSet.code)
        if (control.isMultiSelect) {
          if (~codeIndex) {
            codes.splice(codeIndex, 1)
          } else {
            codes.push(valueSet.code)
          }
        } else {
          if (~codeIndex) {
            codes = []
          } else {
            codes = [valueSet.code]
          }
        }
        this.setSelect(codes.join(this.VALUE_DELIMITER))
      }
      li.append(document.createTextNode(valueSet.value))
      ul.append(li)
    }
    selectPopupContainer.append(ul)
    // 위치 지정
    const {
      coordinate: {
        leftTop: [left, top]
      },
      lineHeight
    } = position
    const preY = this.control.getPreY()
    selectPopupContainer.style.left = `${left}px`
    selectPopupContainer.style.top = `${top + preY + lineHeight}px`
    // 컨테이너에 추가
    const container = this.control.getContainer()
    container.append(selectPopupContainer)
    this.selectDom = selectPopupContainer
  }

  public awake() {
    if (
      this.isPopup ||
      this.control.getIsDisabledControl() ||
      !this.control.getIsRangeWithinControl()
    ) {
      return
    }
    const { startIndex } = this.control.getRange()
    const elementList = this.control.getElementList()
    if (elementList[startIndex + 1]?.controlId !== this.element.controlId) {
      return
    }
    this._createSelectPopupDom()
    this.isPopup = true
  }

  public destroy() {
    if (!this.isPopup) return
    this.selectDom?.remove()
    this.isPopup = false
  }
}
