import { IRowElement } from '../../../../../interface/Row'

export class IFrameBlock {
  public static readonly sandbox = ['allow-scripts', 'allow-same-origin']
  private element: IRowElement

  constructor(element: IRowElement) {
    this.element = element
  }

  private _defineIframeProperties(iframeWindow: Window) {
    Object.defineProperties(iframeWindow, {
      // parent 접근 금지로 보안 취약점 방지
      parent: {
        get: () => null
      },
      // 컨텍스트 구분용
      __POWERED_BY_CANVAS_EDITOR__: {
        get: () => true
      }
    })
  }

  public render(blockItemContainer: HTMLDivElement) {
    const block = this.element.block!
    const iframe = document.createElement('iframe')
    iframe.setAttribute('data-id', this.element.id!)
    iframe.sandbox.add(...IFrameBlock.sandbox)
    iframe.style.border = 'none'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    if (block.iframeBlock?.src) {
      iframe.src = block.iframeBlock.src
    } else if (block.iframeBlock?.srcdoc) {
      iframe.srcdoc = block.iframeBlock.srcdoc
    }
    blockItemContainer.append(iframe)
    // iframe 속성 재정의
    this._defineIframeProperties(iframe.contentWindow!)
  }
}
