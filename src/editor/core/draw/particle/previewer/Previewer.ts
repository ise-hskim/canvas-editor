import { EDITOR_PREFIX } from '../../../../dataset/constant/Editor'
import { EditorMode } from '../../../../dataset/enum/Editor'
import { IEditorOption } from '../../../../interface/Editor'
import { IElement, IElementPosition } from '../../../../interface/Element'
import { EventBusMap } from '../../../../interface/EventBus'
import {
  IPreviewerCreateResult,
  IPreviewerDrawOption
} from '../../../../interface/Previewer'
import { downloadFile } from '../../../../utils'
import { EventBus } from '../../../event/eventbus/EventBus'
import { Draw } from '../../Draw'

export class Previewer {
  private container: HTMLDivElement
  private canvas: HTMLCanvasElement
  private draw: Draw
  private options: Required<IEditorOption>
  private curElement: IElement | null
  private curElementSrc: string
  private previewerDrawOption: IPreviewerDrawOption
  private curPosition: IElementPosition | null
  private eventBus: EventBus<EventBusMap>
  // 이미지 목록
  private imageList: IElement[]
  private curShowElement: IElement | null
  private imageCount: HTMLSpanElement | null
  private imagePre: HTMLElement | null
  private imageNext: HTMLElement | null
  // 드래그로 크기 변경
  private resizerSelection: HTMLDivElement
  private resizerHandleList: HTMLDivElement[]
  private resizerImageContainer: HTMLDivElement
  private resizerImage: HTMLImageElement
  private resizerSize: HTMLSpanElement
  private width: number
  private height: number
  private mousedownX: number
  private mousedownY: number
  private curHandleIndex: number
  // 미리보기 선택 영역
  private previewerContainer: HTMLDivElement | null
  private previewerImage: HTMLImageElement | null

  constructor(draw: Draw) {
    this.container = draw.getContainer()
    this.canvas = draw.getPage()
    this.draw = draw
    this.options = draw.getOptions()
    this.curElement = null
    this.curElementSrc = ''
    this.previewerDrawOption = {}
    this.curPosition = null
    this.eventBus = draw.getEventBus()
    this.imageList = []
    this.curShowElement = null
    this.imageCount = null
    this.imagePre = null
    this.imageNext = null
    // 이미지 크기 확대/축소
    const {
      resizerSelection,
      resizerHandleList,
      resizerImageContainer,
      resizerImage,
      resizerSize
    } = this._createResizerDom()
    this.resizerSelection = resizerSelection
    this.resizerHandleList = resizerHandleList
    this.resizerImageContainer = resizerImageContainer
    this.resizerImage = resizerImage
    this.resizerSize = resizerSize
    this.width = 0
    this.height = 0
    this.mousedownX = 0
    this.mousedownY = 0
    this.curHandleIndex = 0 // 기본 오른쪽 하단
    this.previewerContainer = null
    this.previewerImage = null
  }

  private _getElementPosition(
    element: IElement,
    position: IElementPosition | null = null
  ): { x: number; y: number } {
    const { scale } = this.options
    let x = 0
    let y = 0
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const pageNo = position?.pageNo ?? this.draw.getPageNo()
    const preY = pageNo * (height + pageGap)
    // 플로팅 위치 우선 사용
    if (element.imgFloatPosition) {
      x = element.imgFloatPosition.x! * scale
      y = element.imgFloatPosition.y * scale + preY
    } else if (position) {
      const {
        coordinate: {
          leftTop: [left, top]
        },
        ascent
      } = position
      x = left
      y = top + preY + ascent
    }
    return { x, y }
  }

  private _createResizerDom(): IPreviewerCreateResult {
    const { scale } = this.options
    // 드래그 테두리
    const resizerSelection = document.createElement('div')
    resizerSelection.classList.add(`${EDITOR_PREFIX}-resizer-selection`)
    resizerSelection.style.display = 'none'
    resizerSelection.style.borderColor = this.options.resizerColor
    resizerSelection.style.borderWidth = `${scale}px`
    // 드래그 포인트
    const resizerHandleList: HTMLDivElement[] = []
    for (let i = 0; i < 8; i++) {
      const handleDom = document.createElement('div')
      handleDom.style.background = this.options.resizerColor
      handleDom.classList.add(`resizer-handle`)
      handleDom.classList.add(`handle-${i}`)
      handleDom.setAttribute('data-index', String(i))
      handleDom.onmousedown = this._mousedown.bind(this)
      resizerSelection.append(handleDom)
      resizerHandleList.push(handleDom)
    }
    this.container.append(resizerSelection)
    // 크기 보기
    const resizerSizeView = document.createElement('div')
    resizerSizeView.classList.add(`${EDITOR_PREFIX}-resizer-size-view`)
    const resizerSize = document.createElement('span')
    resizerSizeView.append(resizerSize)
    resizerSelection.append(resizerSizeView)
    // 드래그 미러링
    const resizerImageContainer = document.createElement('div')
    resizerImageContainer.classList.add(`${EDITOR_PREFIX}-resizer-image`)
    resizerImageContainer.style.display = 'none'
    const resizerImage = document.createElement('img')
    resizerImageContainer.append(resizerImage)
    this.container.append(resizerImageContainer)
    return {
      resizerSelection,
      resizerHandleList,
      resizerImageContainer,
      resizerImage,
      resizerSize
    }
  }

  private _keydown = () => {
    // 키보드 이벤트 발생 시 드래그 선택 영역 능동 제거
    if (this.resizerSelection.style.display === 'block') {
      this.clearResizer()
      document.removeEventListener('keydown', this._keydown)
    }
  }

  private _mousedown(evt: MouseEvent) {
    this.canvas = this.draw.getPage()
    if (!this.curElement) return
    const { scale } = this.options
    this.mousedownX = evt.x
    this.mousedownY = evt.y
    const target = evt.target as HTMLDivElement
    this.curHandleIndex = Number(target.dataset.index)
    // 커서 변경
    const cursor = window.getComputedStyle(target).cursor
    document.body.style.cursor = cursor
    this.canvas.style.cursor = cursor
    // 드래그 이미지 미러링
    this.resizerImage.src = this.curElementSrc
    this.resizerImageContainer.style.display = 'block'
    // 플로팅 위치 정보 우선 사용
    const { x: resizerLeft, y: resizerTop } = this._getElementPosition(
      this.curElement,
      this.curPosition
    )
    this.resizerImageContainer.style.left = `${resizerLeft}px`
    this.resizerImageContainer.style.top = `${resizerTop}px`
    this.resizerImage.style.width = `${this.curElement.width! * scale}px`
    this.resizerImage.style.height = `${this.curElement.height! * scale}px`
    // 전역 이벤트 추가
    const mousemoveFn = this._mousemove.bind(this)
    document.addEventListener('mousemove', mousemoveFn)
    document.addEventListener(
      'mouseup',
      () => {
        // 크기 변경
        if (this.curElement && !this.previewerDrawOption.dragDisable) {
          this.curElement.width = this.width
          this.curElement.height = this.height
          this.draw.render({
            isSetCursor: true,
            curIndex: this.curPosition?.index
          })
        }
        // 부작용 복원
        this.resizerImageContainer.style.display = 'none'
        document.removeEventListener('mousemove', mousemoveFn)
        document.body.style.cursor = ''
        this.canvas.style.cursor = 'text'
      },
      {
        once: true
      }
    )
    evt.preventDefault()
  }

  private _mousemove(evt: MouseEvent) {
    if (!this.curElement || this.previewerDrawOption.dragDisable) return
    const { scale } = this.options
    let dx = 0
    let dy = 0
    switch (this.curHandleIndex) {
      case 0:
        {
          const offsetX = this.mousedownX - evt.x
          const offsetY = this.mousedownY - evt.y
          dx = Math.cbrt(offsetX ** 3 + offsetY ** 3)
          dy = (this.curElement.height! * dx) / this.curElement.width!
        }
        break
      case 1:
        dy = this.mousedownY - evt.y
        break
      case 2:
        {
          const offsetX = evt.x - this.mousedownX
          const offsetY = this.mousedownY - evt.y
          dx = Math.cbrt(offsetX ** 3 + offsetY ** 3)
          dy = (this.curElement.height! * dx) / this.curElement.width!
        }
        break
      case 4:
        {
          const offsetX = evt.x - this.mousedownX
          const offsetY = evt.y - this.mousedownY
          dx = Math.cbrt(offsetX ** 3 + offsetY ** 3)
          dy = (this.curElement.height! * dx) / this.curElement.width!
        }
        break
      case 3:
        dx = evt.x - this.mousedownX
        break
      case 5:
        dy = evt.y - this.mousedownY
        break
      case 6:
        {
          const offsetX = this.mousedownX - evt.x
          const offsetY = evt.y - this.mousedownY
          dx = Math.cbrt(offsetX ** 3 + offsetY ** 3)
          dy = (this.curElement.height! * dx) / this.curElement.width!
        }
        break
      case 7:
        dx = this.mousedownX - evt.x
        break
    }
    // 이미지 실제 넓이와 높이 (크기 변경 시 확대/축소 비율 제외)
    const dw = this.curElement.width! + dx / scale
    const dh = this.curElement.height! + dy / scale
    if (dw <= 0 || dh <= 0) return
    this.width = dw
    this.height = dh
    // 이미지 표시 넓이와 높이
    const elementWidth = dw * scale
    const elementHeight = dh * scale
    // 그림자 이미지 크기 업데이트
    this.resizerImage.style.width = `${elementWidth}px`
    this.resizerImage.style.height = `${elementHeight}px`
    // 미리보기 테두리 크기 업데이트
    this._updateResizerRect(elementWidth, elementHeight)
    // 크기 미리보기
    this._updateResizerSizeView(elementWidth, elementHeight)
    evt.preventDefault()
    // 이미지 크기 변경 이벤트
    if (this.eventBus.isSubscribe('imageSizeChange')) {
      this.eventBus.emit('imageSizeChange', {
        element: this.curElement
      })
    }
  }

  private _drawPreviewer() {
    const previewerContainer = document.createElement('div')
    previewerContainer.classList.add(`${EDITOR_PREFIX}-image-previewer`)
    // 닫기 버튼
    const closeBtn = document.createElement('i')
    closeBtn.classList.add('image-close')
    closeBtn.onclick = () => {
      this._clearPreviewer()
    }
    previewerContainer.append(closeBtn)
    // 이미지
    const imgContainer = document.createElement('div')
    imgContainer.classList.add(`${EDITOR_PREFIX}-image-container`)
    const img = document.createElement('img')
    img.src = this.curElementSrc
    img.draggable = false
    imgContainer.append(img)
    this.previewerImage = img
    previewerContainer.append(imgContainer)
    // 조작 메뉴바
    let x = 0
    let y = 0
    let scaleSize = 1
    let rotateSize = 0
    const menuContainer = document.createElement('div')
    menuContainer.classList.add(`${EDITOR_PREFIX}-image-menu`)
    // 이전/다음 이미지 전환
    const navigateContainer = document.createElement('div')
    navigateContainer.classList.add('image-navigate')
    const imagePre = document.createElement('i')
    imagePre.classList.add('image-pre')
    imagePre.onclick = () => {
      const curIndex = this.imageList.findIndex(
        el => el.id === this.curShowElement?.id
      )
      if (curIndex <= 0) return
      this.curShowElement = this.imageList[curIndex - 1]
      img.src = this.curShowElement.value
      this._updateImageNavigate()
    }
    navigateContainer.append(imagePre)
    this.imagePre = imagePre
    const imageCount = document.createElement('span')
    imageCount.classList.add('image-count')
    this.imageCount = imageCount
    navigateContainer.append(imageCount)
    const imageNext = document.createElement('i')
    imageNext.classList.add('image-next')
    imageNext.onclick = () => {
      const curIndex = this.imageList.findIndex(
        el => el.id === this.curShowElement?.id
      )
      if (curIndex >= this.imageList.length - 1) return
      this.curShowElement = this.imageList[curIndex + 1]
      img.src = this.curShowElement.value
      this._updateImageNavigate()
    }
    this.imageNext = imageNext
    navigateContainer.append(imageNext)
    menuContainer.append(navigateContainer)
    // 확대/축소
    const zoomIn = document.createElement('i')
    zoomIn.classList.add('zoom-in')
    zoomIn.onclick = () => {
      scaleSize += 0.1
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    menuContainer.append(zoomIn)
    const zoomOut = document.createElement('i')
    zoomOut.onclick = () => {
      if (scaleSize - 0.1 <= 0.1) return
      scaleSize -= 0.1
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    zoomOut.classList.add('zoom-out')
    menuContainer.append(zoomOut)
    // 회전
    const rotate = document.createElement('i')
    rotate.classList.add('rotate')
    rotate.onclick = () => {
      rotateSize += 1
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    menuContainer.append(rotate)
    // 원래 크기로 복원
    const originalSize = document.createElement('i')
    originalSize.classList.add('original-size')
    originalSize.onclick = () => {
      x = 0
      y = 0
      scaleSize = 1
      rotateSize = 0
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    menuContainer.append(originalSize)
    // 이미지 다운로드
    const imageDownload = document.createElement('i')
    imageDownload.classList.add('image-download')
    imageDownload.onclick = () => {
      const { mime } = this.previewerDrawOption
      downloadFile(img.src, `${this.curElement?.id}.${mime || 'png'}`)
    }
    menuContainer.append(imageDownload)
    previewerContainer.append(menuContainer)
    this.previewerContainer = previewerContainer
    document.body.append(previewerContainer)
    // 드래그로 위치 조정
    let startX = 0
    let startY = 0
    let isAllowDrag = false
    img.onmousedown = evt => {
      isAllowDrag = true
      startX = evt.x
      startY = evt.y
      previewerContainer.style.cursor = 'move'
    }
    previewerContainer.onmousemove = (evt: MouseEvent) => {
      if (!isAllowDrag) return
      x += evt.x - startX
      y += evt.y - startY
      startX = evt.x
      startY = evt.y
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    previewerContainer.onmouseup = () => {
      isAllowDrag = false
      previewerContainer.style.cursor = 'auto'
    }
    previewerContainer.onwheel = evt => {
      evt.preventDefault()
      evt.stopPropagation()
      if (evt.deltaY < 0) {
        // 확대
        scaleSize += 0.1
      } else {
        // 축소
        if (scaleSize - 0.1 <= 0.1) return
        scaleSize -= 0.1
      }
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    // 이미지 인덱스 정보 업데이트
    this._updateImageNavigate()
  }

  private _updateImageNavigate() {
    // 현재 이미지 위치 인덱스 업데이트
    const currentIndex = this.imageList.findIndex(
      el => el.id === this.curShowElement?.id
    )
    this.imageCount!.innerText = `${currentIndex + 1} / ${
      this.imageList.length
    }`
    // 버튼 권한 업데이트
    if (currentIndex <= 0) {
      this.imagePre!.classList.add('disabled')
    } else {
      this.imagePre!.classList.remove('disabled')
    }
    if (currentIndex >= this.imageList.length - 1) {
      this.imageNext!.classList.add('disabled')
    } else {
      this.imageNext!.classList.remove('disabled')
    }
  }

  public _setPreviewerTransform(
    scale: number,
    rotate: number,
    x: number,
    y: number
  ) {
    if (!this.previewerImage) return
    this.previewerImage.style.left = `${x}px`
    this.previewerImage.style.top = `${y}px`
    this.previewerImage.style.transform = `scale(${scale}) rotate(${
      rotate * 90
    }deg)`
  }

  private _clearPreviewer() {
    this.previewerContainer?.remove()
    this.previewerContainer = null
    document.body.style.overflow = 'auto'
  }

  public _updateResizerRect(width: number, height: number) {
    const { resizerSize: handleSize, scale } = this.options
    const isReadonly = this.draw.isReadonly()
    this.resizerSelection.style.width = `${width}px`
    this.resizerSelection.style.height = `${height}px`
    // handle
    for (let i = 0; i < 8; i++) {
      const left =
        i === 0 || i === 6 || i === 7
          ? -handleSize
          : i === 1 || i === 5
          ? width / 2
          : width - handleSize
      const top =
        i === 0 || i === 1 || i === 2
          ? -handleSize
          : i === 3 || i === 7
          ? height / 2 - handleSize
          : height - handleSize
      this.resizerHandleList[i].style.transform = `scale(${scale})`
      this.resizerHandleList[i].style.left = `${left}px`
      this.resizerHandleList[i].style.top = `${top}px`
      this.resizerHandleList[i].style.display = isReadonly ? 'none' : 'block'
    }
  }

  public _updateResizerSizeView(width: number, height: number) {
    this.resizerSize.innerText = `${Math.round(width)} × ${Math.round(height)}`
  }

  public render() {
    // 이미지 도구 설정이 비활성화되고 디자인 모드가 아닐 때 렌더링하지 않음
    const mode = this.draw.getMode()
    if (
      !this.curElement ||
      (this.curElement.imgToolDisabled && !this.draw.isDesignMode()) ||
      (mode === EditorMode.PRINT &&
        this.options.modeRule[EditorMode.PRINT]?.imagePreviewerDisabled) ||
      (mode === EditorMode.READONLY &&
        this.options.modeRule[EditorMode.READONLY]?.imagePreviewerDisabled)
    ) {
      return
    }
    // 모든 이미지 가져오기
    this.imageList = this.draw.getImageParticle().getOriginalMainImageList()
    this.curShowElement = this.curElement
    // 미리보기 프레임 렌더링
    this._drawPreviewer()
    document.body.style.overflow = 'hidden'
  }

  public drawResizer(
    element: IElement,
    position: IElementPosition | null = null,
    options: IPreviewerDrawOption = {}
  ) {
    // 이미지 도구 설정이 비활성화되고 디자인 모드가 아닐 때 렌더링하지 않음
    const mode = this.draw.getMode()
    if (
      (element.imgToolDisabled && !this.draw.isDesignMode()) ||
      (mode === EditorMode.PRINT &&
        this.options.modeRule[EditorMode.PRINT]?.imagePreviewerDisabled) ||
      (mode === EditorMode.READONLY &&
        this.options.modeRule[EditorMode.READONLY]?.imagePreviewerDisabled)
    ) {
      return
    }
    // 설정 캐시
    this.previewerDrawOption = options
    this.curElementSrc = element[options.srcKey || 'value'] || ''
    // 렌더링 크기 및 위치 업데이트
    this.updateResizer(element, position)
    // 이벤트 리스너 등록
    document.addEventListener('keydown', this._keydown)
  }

  public updateResizer(
    element: IElement,
    position: IElementPosition | null = null
  ) {
    const { scale } = this.options
    const elementWidth = element.width! * scale
    const elementHeight = element.height! * scale
    // 크기 미리보기
    this._updateResizerSizeView(elementWidth, elementHeight)
    // 플로팅 위치 정보 우선 사용
    const { x: resizerLeft, y: resizerTop } = this._getElementPosition(
      element,
      position
    )
    this.resizerSelection.style.left = `${resizerLeft}px`
    this.resizerSelection.style.top = `${resizerTop}px`
    this.resizerSelection.style.borderWidth = `${scale}px`
    // 미리보기 테두리 크기 업데이트
    this._updateResizerRect(elementWidth, elementHeight)
    this.resizerSelection.style.display = 'block'
    // 기본 정보 캐시
    this.curElement = element
    this.curPosition = position
    this.width = elementWidth
    this.height = elementHeight
  }

  public clearResizer() {
    this.resizerSelection.style.display = 'none'
    document.removeEventListener('keydown', this._keydown)
  }
}
