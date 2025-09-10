import {
  CONTROL_STYLE_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR,
  TEXTLIKE_ELEMENT_TYPE
} from '../../../../dataset/constant/Element'
import { ControlComponent } from '../../../../dataset/enum/Control'
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
import { omitObject, pickObject } from '../../../../utils'
import { formatElementContext } from '../../../../utils/element'
import { Draw } from '../../Draw'
import { DatePicker } from '../../particle/date/DatePicker'
import { Control } from '../Control'

export class DateControl implements IControlInstance {
  private draw: Draw
  private element: IElement
  private control: Control
  private isPopup: boolean
  private datePicker: DatePicker | null
  private options: DeepRequired<IEditorOption>

  constructor(element: IElement, control: Control) {
    const draw = control.getDraw()
    this.draw = draw
    this.options = draw.getOptions()
    this.element = element
    this.control = control
    this.isPopup = false
    this.datePicker = null
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

  public getValueRange(context: IControlContext = {}): [number, number] | null {
    const elementList = context.elementList || this.control.getElementList()
    const { startIndex } = context.range || this.control.getRange()
    const startElement = elementList[startIndex]
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
      nextIndex++
    }
    if (preIndex === nextIndex) return null
    return [preIndex, nextIndex - 1]
  }

  public getValue(context: IControlContext = {}): IElement[] {
    const elementList = context.elementList || this.control.getElementList()
    const range = this.getValueRange(context)
    if (!range) return []
    const data: IElement[] = []
    const [startIndex, endIndex] = range
    for (let i = startIndex; i <= endIndex; i++) {
      const element = elementList[i]
      if (element.controlComponent === ControlComponent.VALUE) {
        data.push(element)
      }
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
      !options.isIgnoreDisabledRule &&
      this.control.getIsDisabledControl(context)
    ) {
      return -1
    }
    const elementList = context.elementList || this.control.getElementList()
    const range = context.range || this.control.getRange()
    // 범위를 Value 내부로 축소
    this.control.shrinkBoundary(context)
    const { startIndex, endIndex } = range
    const draw = this.control.getDraw()
    // 선택된 요소 제거
    if (startIndex !== endIndex) {
      draw.spliceElementList(elementList, startIndex + 1, endIndex - startIndex)
    } else {
      // 빈 플레이스홀더 제거
      this.control.removePlaceholder(startIndex, context)
    }
    // 비텍스트 유형 요소 또는 접두사는 스타일 속성 전환
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

  public clearSelect(
    context: IControlContext = {},
    options: IControlRuleOption = {}
  ): number {
    const { isIgnoreDisabledRule = false, isAddPlaceholder = true } = options
    // 설정 가능 여부 검증
    if (!isIgnoreDisabledRule && this.control.getIsDisabledControl(context)) {
      return -1
    }
    const range = this.getValueRange(context)
    if (!range) return -1
    const [leftIndex, rightIndex] = range
    if (!~leftIndex || !~rightIndex) return -1
    const elementList = context.elementList || this.control.getElementList()
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
    // 플레이스홀더 추가
    if (isAddPlaceholder) {
      this.control.addPlaceholder(leftIndex, context)
    }
    return leftIndex
  }

  public setSelect(
    date: string,
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
    // 스타일 할당 요소 - 기본값의 첫 번째 문자 스타일, 그렇지 않으면 기본 스타일 사용
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
    // 속성 할당 요소 - 기본적으로 접두사 속성
    const propertyElement = omitObject(
      elementList[prefixIndex],
      EDITOR_ELEMENT_STYLE_ATTR
    )
    const start = prefixIndex + 1
    const draw = this.control.getDraw()
    for (let i = 0; i < date.length; i++) {
      const newElement: IElement = {
        ...styleElement,
        ...propertyElement,
        type: ElementType.TEXT,
        value: date[i],
        controlComponent: ControlComponent.VALUE
      }
      formatElementContext(elementList, [newElement], prefixIndex, {
        editorOptions: this.options
      })
      draw.spliceElementList(elementList, start + i, 0, [newElement])
    }
    // 컨트롤 다시 렌더링
    if (!context.range) {
      const newIndex = start + date.length - 1
      this.control.repaintControl({
        curIndex: newIndex
      })
      this.control.emitControlContentChange({
        context
      })
      this.destroy()
    }
  }

  public keydown(evt: KeyboardEvent): number | null {
    if (this.control.getIsDisabledControl()) {
      return null
    }
    const elementList = this.control.getElementList()
    const range = this.control.getRange()
    // 범위를 Value 내부로 축소
    this.control.shrinkBoundary()
    const { startIndex, endIndex } = range
    const startElement = elementList[startIndex]
    const endElement = elementList[endIndex]
    const draw = this.control.getDraw()
    // backspace
    if (evt.key === KeyMap.Backspace) {
      // 선택된 요소 제거
      if (startIndex !== endIndex) {
        draw.spliceElementList(
          elementList,
          startIndex + 1,
          endIndex - startIndex
        )
        const value = this.getValue()
        if (!value.length) {
          this.control.addPlaceholder(startIndex)
        }
        return startIndex
      } else {
        if (
          startElement.controlComponent === ControlComponent.PREFIX ||
          startElement.controlComponent === ControlComponent.PRE_TEXT ||
          endElement.controlComponent === ControlComponent.POSTFIX ||
          endElement.controlComponent === ControlComponent.POST_TEXT ||
          startElement.controlComponent === ControlComponent.PLACEHOLDER
        ) {
          // 접두사, 접미사, 플레이스홀더
          return this.control.removeControl(startIndex)
        } else {
          // 텍스트
          draw.spliceElementList(elementList, startIndex, 1)
          const value = this.getValue()
          if (!value.length) {
            this.control.addPlaceholder(startIndex - 1)
          }
          return startIndex - 1
        }
      }
    } else if (evt.key === KeyMap.Delete) {
      // 선택된 요소 제거
      if (startIndex !== endIndex) {
        draw.spliceElementList(
          elementList,
          startIndex + 1,
          endIndex - startIndex
        )
        const value = this.getValue()
        if (!value.length) {
          this.control.addPlaceholder(startIndex)
        }
        return startIndex
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
          // 접두사, 접미사, 플레이스홀더
          return this.control.removeControl(startIndex)
        } else {
          // 텍스트
          draw.spliceElementList(elementList, startIndex + 1, 1)
          const value = this.getValue()
          if (!value.length) {
            this.control.addPlaceholder(startIndex)
          }
          return startIndex
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
    const draw = this.control.getDraw()
    const elementList = this.control.getElementList()
    draw.spliceElementList(elementList, startIndex + 1, endIndex - startIndex)
    const value = this.getValue()
    if (!value.length) {
      this.control.addPlaceholder(startIndex)
    }
    return startIndex
  }

  public awake() {
    if (
      this.isPopup ||
      this.control.getIsDisabledControl() ||
      !this.control.getIsRangeWithinControl()
    ) {
      return
    }
    const position = this.control.getPosition()
    if (!position) return
    const elementList = this.draw.getElementList()
    const { startIndex } = this.control.getRange()
    if (elementList[startIndex + 1]?.controlId !== this.element.controlId) {
      return
    }
    // 날짜 컨트롤 렌더링
    this.datePicker = new DatePicker(this.draw, {
      onSubmit: this._setDate.bind(this)
    })
    const value =
      this.getValue()
        .map(el => el.value)
        .join('') || ''
    const dateFormat = this.element.control?.dateFormat
    this.datePicker.render({
      value,
      position,
      dateFormat
    })
    // 팝업 상태
    this.isPopup = true
  }

  public destroy() {
    if (!this.isPopup) return
    this.datePicker?.destroy()
    this.isPopup = false
  }

  private _setDate(date: string) {
    if (!date) {
      this.clearSelect()
    } else {
      this.setSelect(date)
    }
    this.destroy()
  }
}
