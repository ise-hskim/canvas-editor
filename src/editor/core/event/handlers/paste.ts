import { ZERO } from '../../../dataset/constant/Common'
import { VIRTUAL_ELEMENT_TYPE } from '../../../dataset/constant/Element'
import { ElementType } from '../../../dataset/enum/Element'
import { IElement } from '../../../interface/Element'
import { IPasteOption } from '../../../interface/Event'
import {
  getClipboardData,
  getIsClipboardContainFile,
  removeClipboardData
} from '../../../utils/clipboard'
import {
  formatElementContext,
  getElementListByHTML
} from '../../../utils/element'
import { CanvasEvent } from '../CanvasEvent'
import { IOverrideResult } from '../../override/Override'
import { normalizeLineBreak } from '../../../utils'

export function pasteElement(host: CanvasEvent, elementList: IElement[]) {
  const draw = host.getDraw()
  if (
    draw.isReadonly() ||
    draw.isDisabled() ||
    draw.getControl().getIsDisabledPasteControl()
  ) {
    return
  }
  const rangeManager = draw.getRange()
  const { startIndex } = rangeManager.getRange()
  const originalElementList = draw.getElementList()
  // 전체 선택 붙여넣기는 컨텍스트 포맷팅 불필요
  if (~startIndex && !rangeManager.getIsSelectAll()) {
    // 가상 요소로 복사하는 경우, 붙여넣기 목록의 가상 요소는 평면화 처리하여 새로운 가상 요소 생성 방지
    const anchorElement = originalElementList[startIndex]
    if (anchorElement?.titleId || anchorElement?.listId) {
      let start = 0
      while (start < elementList.length) {
        const pasteElement = elementList[start]
        if (anchorElement.titleId && /^\n/.test(pasteElement.value)) {
          break
        }
        if (VIRTUAL_ELEMENT_TYPE.includes(pasteElement.type!)) {
          elementList.splice(start, 1)
          if (pasteElement.valueList) {
            for (let v = 0; v < pasteElement.valueList.length; v++) {
              const element = pasteElement.valueList[v]
              if (element.value === ZERO || element.value === '\n') {
                continue
              }
              elementList.splice(start, 0, element)
              start++
            }
          }
          start--
        }
        start++
      }
    }
    formatElementContext(originalElementList, elementList, startIndex, {
      isBreakWhenWrap: true,
      editorOptions: draw.getOptions()
    })
  }
  draw.insertElementList(elementList)
}

export function pasteHTML(host: CanvasEvent, htmlText: string) {
  const draw = host.getDraw()
  if (draw.isReadonly() || draw.isDisabled()) return
  const elementList = getElementListByHTML(htmlText, {
    innerWidth: draw.getOriginalInnerWidth()
  })
  pasteElement(host, elementList)
}

export function pasteImage(host: CanvasEvent, file: File | Blob) {
  const draw = host.getDraw()
  if (draw.isReadonly() || draw.isDisabled()) return
  const rangeManager = draw.getRange()
  const { startIndex } = rangeManager.getRange()
  const elementList = draw.getElementList()
  // 파일 리더 생성
  const fileReader = new FileReader()
  fileReader.readAsDataURL(file)
  fileReader.onload = () => {
    // 너비와 높이 계산
    const image = new Image()
    const value = fileReader.result as string
    image.src = value
    image.onload = () => {
      const imageElement: IElement = {
        value,
        type: ElementType.IMAGE,
        width: image.width,
        height: image.height
      }
      if (~startIndex) {
        formatElementContext(elementList, [imageElement], startIndex, {
          editorOptions: draw.getOptions()
        })
      }
      draw.insertElementList([imageElement])
    }
  }
}

export function pasteByEvent(host: CanvasEvent, evt: ClipboardEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly() || draw.isDisabled()) return
  const clipboardData = evt.clipboardData
  if (!clipboardData) return
  // 사용자 정의 붙여넣기 이벤트
  const { paste } = draw.getOverride()
  if (paste) {
    const overrideResult = paste(evt)
    // 기본 이벤트 차단
    if ((<IOverrideResult>overrideResult)?.preventDefault !== false) return
  }
  // 에디터 내부 클립보드 데이터 우선 읽기(클립보드에 파일이 없을 때)
  if (!getIsClipboardContainFile(clipboardData)) {
    const clipboardText = clipboardData.getData('text')
    const editorClipboardData = getClipboardData()
    // 다른 시스템 간 기본 줄바꿈 문자가 다름 windows:\r\n mac:\n
    if (
      editorClipboardData &&
      normalizeLineBreak(clipboardText) ===
        normalizeLineBreak(editorClipboardData.text)
    ) {
      pasteElement(host, editorClipboardData.elementList)
      return
    }
  }
  removeClipboardData()
  // 클립보드에서 데이터 추출
  let isHTML = false
  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i]
    if (item.type === 'text/html') {
      isHTML = true
      break
    }
  }
  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i]
    if (item.kind === 'string') {
      if (item.type === 'text/plain' && !isHTML) {
        item.getAsString(plainText => {
          host.input(plainText)
        })
        break
      }
      if (item.type === 'text/html' && isHTML) {
        item.getAsString(htmlText => {
          pasteHTML(host, htmlText)
        })
        break
      }
    } else if (item.kind === 'file') {
      if (item.type.includes('image')) {
        const file = item.getAsFile()
        if (file) {
          pasteImage(host, file)
        }
      }
    }
  }
}

export async function pasteByApi(host: CanvasEvent, options?: IPasteOption) {
  const draw = host.getDraw()
  if (draw.isReadonly() || draw.isDisabled()) return
  // 사용자 정의 붙여넣기 이벤트
  const { paste } = draw.getOverride()
  if (paste) {
    const overrideResult = paste()
    // 기본 이벤트 차단
    if ((<IOverrideResult>overrideResult)?.preventDefault !== false) return
  }
  // 에디터 내부 클립보드 데이터 우선 읽기
  const clipboardText = await navigator.clipboard.readText()
  const editorClipboardData = getClipboardData()
  if (clipboardText === editorClipboardData?.text) {
    pasteElement(host, editorClipboardData.elementList)
    return
  }
  removeClipboardData()
  // 메모리 클립보드에서 데이터 가져오기
  if (options?.isPlainText) {
    if (clipboardText) {
      host.input(clipboardText)
    }
  } else {
    const clipboardData = await navigator.clipboard.read()
    let isHTML = false
    for (const item of clipboardData) {
      if (item.types.includes('text/html')) {
        isHTML = true
        break
      }
    }
    for (const item of clipboardData) {
      if (item.types.includes('text/plain') && !isHTML) {
        const textBlob = await item.getType('text/plain')
        const text = await textBlob.text()
        if (text) {
          host.input(text)
        }
      } else if (item.types.includes('text/html') && isHTML) {
        const htmlTextBlob = await item.getType('text/html')
        const htmlText = await htmlTextBlob.text()
        if (htmlText) {
          pasteHTML(host, htmlText)
        }
      } else if (item.types.some(type => type.startsWith('image/'))) {
        const type = item.types.find(type => type.startsWith('image/'))!
        const imageBlob = await item.getType(type)
        pasteImage(host, imageBlob)
      }
    }
  }
}
