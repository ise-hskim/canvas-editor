import { EditorComponent, EDITOR_COMPONENT } from '../../editor'
import './dialog.css'

export interface IDialogData {
  type: string
  label?: string
  name: string
  value?: string
  options?: { label: string; value: string }[]
  placeholder?: string
  width?: number
  height?: number
  required?: boolean
}

export interface IDialogConfirm {
  name: string
  value: string
}

export interface IDialogOptions {
  onClose?: () => void
  onCancel?: () => void
  onConfirm?: (payload: IDialogConfirm[]) => void
  title: string
  data: IDialogData[]
}

export class Dialog {
  private options: IDialogOptions
  private mask: HTMLDivElement | null
  private container: HTMLDivElement | null
  private inputList: (
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
  )[]

  constructor(options: IDialogOptions) {
    this.options = options
    this.mask = null
    this.container = null
    this.inputList = []
    this._render()
  }

  private _render() {
    const { title, data, onClose, onCancel, onConfirm } = this.options
    // 마스크 레이어 렌더링
    const mask = document.createElement('div')
    mask.classList.add('dialog-mask')
    mask.setAttribute(EDITOR_COMPONENT, EditorComponent.COMPONENT)
    document.body.append(mask)
    // 컨테이너 렌더링
    const container = document.createElement('div')
    container.classList.add('dialog-container')
    container.setAttribute(EDITOR_COMPONENT, EditorComponent.COMPONENT)
    // 팝업
    const dialogContainer = document.createElement('div')
    dialogContainer.classList.add('dialog')
    container.append(dialogContainer)
    // 제목 컨테이너
    const titleContainer = document.createElement('div')
    titleContainer.classList.add('dialog-title')
    // 제목 & 닫기 버튼
    const titleSpan = document.createElement('span')
    titleSpan.append(document.createTextNode(title))
    const titleClose = document.createElement('i')
    titleClose.onclick = () => {
      if (onClose) {
        onClose()
      }
      this._dispose()
    }
    titleContainer.append(titleSpan)
    titleContainer.append(titleClose)
    dialogContainer.append(titleContainer)
    // 옵션 컨테이너
    const optionContainer = document.createElement('div')
    optionContainer.classList.add('dialog-option')
    // 옵션
    for (let i = 0; i < data.length; i++) {
      const option = data[i]
      const optionItemContainer = document.createElement('div')
      optionItemContainer.classList.add('dialog-option__item')
      // 옵션 이름
      if (option.label) {
        const optionName = document.createElement('span')
        optionName.append(document.createTextNode(option.label))
        optionItemContainer.append(optionName)
        if (option.required) {
          optionName.classList.add('dialog-option__item--require')
        }
      }
      // 옵션 입력창
      let optionInput:
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
      if (option.type === 'select') {
        optionInput = document.createElement('select')
        option.options?.forEach(item => {
          const optionItem = document.createElement('option')
          optionItem.value = item.value
          optionItem.label = item.label
          optionInput.append(optionItem)
        })
      } else if (option.type === 'textarea') {
        optionInput = document.createElement('textarea')
      } else {
        optionInput = document.createElement('input')
        optionInput.type = option.type
      }
      if (option.width) {
        optionInput.style.width = `${option.width}px`
      }
      if (option.height) {
        optionInput.style.height = `${option.height}px`
      }
      optionInput.name = option.name
      optionInput.value = option.value || ''
      if (!(optionInput instanceof HTMLSelectElement)) {
        optionInput.placeholder = option.placeholder || ''
      }
      optionItemContainer.append(optionInput)
      optionContainer.append(optionItemContainer)
      this.inputList.push(optionInput)
    }
    dialogContainer.append(optionContainer)
    // 버튼 컨테이너
    const menuContainer = document.createElement('div')
    menuContainer.classList.add('dialog-menu')
    // 취소 버튼
    const cancelBtn = document.createElement('button')
    cancelBtn.classList.add('dialog-menu__cancel')
    cancelBtn.append(document.createTextNode('취소'))
    cancelBtn.type = 'button'
    cancelBtn.onclick = () => {
      if (onCancel) {
        onCancel()
      }
      this._dispose()
    }
    menuContainer.append(cancelBtn)
    // 확인 버튼
    const confirmBtn = document.createElement('button')
    confirmBtn.append(document.createTextNode('확인'))
    confirmBtn.type = 'submit'
    confirmBtn.onclick = () => {
      if (onConfirm) {
        const payload = this.inputList.map<IDialogConfirm>(input => ({
          name: input.name,
          value: input.value
        }))
        onConfirm(payload)
      }
      this._dispose()
    }
    menuContainer.append(confirmBtn)
    dialogContainer.append(menuContainer)
    // 렌더링
    document.body.append(container)
    this.container = container
    this.mask = mask
  }

  private _dispose() {
    this.mask?.remove()
    this.container?.remove()
  }
}
