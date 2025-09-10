import { EDITOR_CLIPBOARD } from '../dataset/constant/Editor'
import { DeepRequired } from '../interface/Common'
import { IEditorOption } from '../interface/Editor'
import { IElement } from '../interface/Element'
import { createDomFromElementList, zipElementList } from './element'

export interface IClipboardData {
  text: string
  elementList: IElement[]
}

export function setClipboardData(data: IClipboardData) {
  localStorage.setItem(
    EDITOR_CLIPBOARD,
    JSON.stringify({
      text: data.text,
      elementList: data.elementList
    })
  )
}

export function getClipboardData(): IClipboardData | null {
  const clipboardText = localStorage.getItem(EDITOR_CLIPBOARD)
  return clipboardText ? JSON.parse(clipboardText) : null
}

export function removeClipboardData() {
  localStorage.removeItem(EDITOR_CLIPBOARD)
}

export function writeClipboardItem(
  text: string,
  html: string,
  elementList: IElement[]
) {
  if (!text && !html && !elementList.length) return
  const plainText = new Blob([text], { type: 'text/plain' })
  const htmlText = new Blob([html], { type: 'text/html' })
  if (window.ClipboardItem) {
    // @ts-ignore
    const item = new ClipboardItem({
      [plainText.type]: plainText,
      [htmlText.type]: htmlText
    })
    window.navigator.clipboard.write([item])
  } else {
    const fakeElement = document.createElement('div')
    fakeElement.setAttribute('contenteditable', 'true')
    fakeElement.innerHTML = html
    document.body.append(fakeElement)
    // add new range
    const selection = window.getSelection()
    const range = document.createRange()
    // DOM 복사 손실 방지를 위해 끝 줄 개행 문자 추가
    const br = document.createElement('span')
    br.innerText = '\n'
    fakeElement.append(br)
    // 선택 영역 확장 후 복사 실행
    range.selectNodeContents(fakeElement)
    selection?.removeAllRanges()
    selection?.addRange(range)
    document.execCommand('copy')
    fakeElement.remove()
  }
  // 에디터 구조화 데이터
  setClipboardData({ text, elementList })
}

export function writeElementList(
  elementList: IElement[],
  options: DeepRequired<IEditorOption>
) {
  const clipboardDom = createDomFromElementList(elementList, options)
  // 클립보드에 쓰기
  document.body.append(clipboardDom)
  const text = clipboardDom.innerText
  // 먼저 추가 후 제거, 그렇지 않으면 innerText가 개행 문자를 파싱할 수 없음
  clipboardDom.remove()
  const html = clipboardDom.innerHTML
  if (!text && !html && !elementList.length) return
  writeClipboardItem(text, html, zipElementList(elementList))
}

export function getIsClipboardContainFile(clipboardData: DataTransfer) {
  let isFile = false
  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i]
    if (item.kind === 'file') {
      isFile = true
      break
    }
  }
  return isFile
}
