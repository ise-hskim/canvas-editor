import { CURSOR_AGENT_OFFSET_HEIGHT } from '../../dataset/constant/Cursor'
import { EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { MoveDirection } from '../../dataset/enum/Observer'
import { DeepRequired } from '../../interface/Common'
import { ICursorOption } from '../../interface/Cursor'
import { IEditorOption } from '../../interface/Editor'
import { IElementPosition } from '../../interface/Element'
import { findScrollContainer } from '../../utils'
import { isMobile } from '../../utils/ua'
import { Draw } from '../draw/Draw'
import { CanvasEvent } from '../event/CanvasEvent'
import { Position } from '../position/Position'
import { CursorAgent } from './CursorAgent'

export type IDrawCursorOption = ICursorOption & {
  isShow?: boolean
  isBlink?: boolean
  isFocus?: boolean
  hitLineStartIndex?: number
}

export interface IMoveCursorToVisibleOption {
  direction: MoveDirection
  cursorPosition: IElementPosition
}

export class Cursor {
  private readonly ANIMATION_CLASS = `${EDITOR_PREFIX}-cursor--animation`

  private draw: Draw
  private container: HTMLDivElement
  private options: DeepRequired<IEditorOption>
  private position: Position
  private cursorDom: HTMLDivElement
  private cursorAgent: CursorAgent
  private blinkTimeout: number | null
  private hitLineStartIndex: number | undefined

  constructor(draw: Draw, canvasEvent: CanvasEvent) {
    this.draw = draw
    this.container = draw.getContainer()
    this.position = draw.getPosition()
    this.options = draw.getOptions()

    this.cursorDom = document.createElement('div')
    this.cursorDom.classList.add(`${EDITOR_PREFIX}-cursor`)
    this.container.append(this.cursorDom)
    this.cursorAgent = new CursorAgent(draw, canvasEvent)
    this.blinkTimeout = null
  }

  public getCursorDom(): HTMLDivElement {
    return this.cursorDom
  }

  public getAgentDom(): HTMLTextAreaElement {
    return this.cursorAgent.getAgentCursorDom()
  }

  public getAgentIsActive(): boolean {
    return this.getAgentDom() === document.activeElement
  }

  public getAgentDomValue(): string {
    return this.getAgentDom().value
  }

  public clearAgentDomValue() {
    this.getAgentDom().value = ''
  }

  public getHitLineStartIndex() {
    return this.hitLineStartIndex
  }

  private _blinkStart() {
    this.cursorDom.classList.add(this.ANIMATION_CLASS)
  }

  private _blinkStop() {
    this.cursorDom.classList.remove(this.ANIMATION_CLASS)
  }

  private _setBlinkTimeout() {
    this._clearBlinkTimeout()
    this.blinkTimeout = window.setTimeout(() => {
      this._blinkStart()
    }, 500)
  }

  private _clearBlinkTimeout() {
    if (this.blinkTimeout) {
      this._blinkStop()
      window.clearTimeout(this.blinkTimeout)
      this.blinkTimeout = null
    }
  }

  public focus() {
    // 모바일 읽기 전용 모드에서는 입력기 호출을 방지하기 위해 포커스 비활성화, 웹에서는 이벤트 캡처를 위해 포커스 허용
    if (isMobile && this.draw.isReadonly()) return
    const agentCursorDom = this.cursorAgent.getAgentCursorDom()
    // 커서가 포커스되지 않을 때 재배치
    if (document.activeElement !== agentCursorDom) {
      agentCursorDom.focus()
      agentCursorDom.setSelectionRange(0, 0)
    }
  }

  public drawCursor(payload?: IDrawCursorOption) {
    let cursorPosition = this.position.getCursorPosition()
    if (!cursorPosition) return
    const { scale, cursor } = this.options
    const {
      color,
      width,
      isShow = true,
      isBlink = true,
      isFocus = true,
      hitLineStartIndex
    } = { ...cursor, ...payload }
    // 커서 에이전트 설정
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    // 커서 위치
    this.hitLineStartIndex = hitLineStartIndex
    if (hitLineStartIndex) {
      const positionList = this.position.getPositionList()
      cursorPosition = positionList[hitLineStartIndex]
    }
    const {
      metrics,
      coordinate: { leftTop, rightTop },
      ascent,
      pageNo
    } = cursorPosition
    const zoneManager = this.draw.getZone()
    const curPageNo = zoneManager.isMainActive()
      ? pageNo
      : this.draw.getPageNo()
    const preY = curPageNo * (height + pageGap)
    // 기본 오프셋 높이
    const defaultOffsetHeight = CURSOR_AGENT_OFFSET_HEIGHT * scale
    // 글꼴 크기의 1/4 증가 (최솟값은 defaultOffsetHeight 즉 기본 오프셋 높이)
    const increaseHeight = Math.min(metrics.height / 4, defaultOffsetHeight)
    const cursorHeight = metrics.height + increaseHeight * 2
    const agentCursorDom = this.cursorAgent.getAgentCursorDom()
    if (isFocus) {
      setTimeout(() => {
        this.focus()
      })
    }
    // fillText 위치 + 텍스트 베이스라인에서 하단까지의 거리 - 시뮬레이션 커서 오프셋
    const descent =
      metrics.boundingBoxDescent < 0 ? 0 : metrics.boundingBoxDescent
    const cursorTop =
      leftTop[1] + ascent + descent - (cursorHeight - increaseHeight) + preY
    const cursorLeft = hitLineStartIndex ? leftTop[0] : rightTop[0]
    agentCursorDom.style.left = `${cursorLeft}px`
    agentCursorDom.style.top = `${
      cursorTop + cursorHeight - defaultOffsetHeight
    }px`
    // 시뮬레이션 커서 표시
    if (!isShow) {
      this.recoveryCursor()
      return
    }
    const isReadonly = this.draw.isReadonly()
    this.cursorDom.style.width = `${width * scale}px`
    this.cursorDom.style.backgroundColor = color
    this.cursorDom.style.left = `${cursorLeft}px`
    this.cursorDom.style.top = `${cursorTop}px`
    this.cursorDom.style.display = isReadonly ? 'none' : 'block'
    this.cursorDom.style.height = `${cursorHeight}px`
    if (isBlink) {
      this._setBlinkTimeout()
    } else {
      this._clearBlinkTimeout()
    }
  }

  public recoveryCursor() {
    this.cursorDom.style.display = 'none'
    this._clearBlinkTimeout()
  }

  public moveCursorToVisible(payload: IMoveCursorToVisibleOption) {
    const { cursorPosition, direction } = payload
    if (!cursorPosition || !direction) return
    const {
      pageNo,
      coordinate: { leftTop, leftBottom }
    } = cursorPosition
    // 현재 페이지에서 스크롤 컨테이너 상단까지의 거리
    const prePageY =
      pageNo * (this.draw.getHeight() + this.draw.getPageGap()) +
      this.container.getBoundingClientRect().top
    // 위로 이동할 때: 상단 거리 기준, 아래로 이동할 때: 하단 위치 기준
    const isUp = direction === MoveDirection.UP
    const x = leftBottom[0]
    const y = isUp ? leftTop[1] + prePageY : leftBottom[1] + prePageY
    // 스크롤 컨테이너 찾기, 스크롤 컨테이너가 document인 경우 현재 창으로 범위 제한
    const scrollContainer = findScrollContainer(this.container)
    const rect = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    }
    if (scrollContainer === document.documentElement) {
      rect.right = window.innerWidth
      rect.bottom = window.innerHeight
    } else {
      const { left, right, top, bottom } =
        scrollContainer.getBoundingClientRect()
      rect.left = left
      rect.right = right
      rect.top = top
      rect.bottom = bottom
    }
    // 매개변수에 따라 가시 범위 조정
    const { maskMargin } = this.options
    rect.top += maskMargin[0]
    rect.bottom -= maskMargin[2]
    // 가시 범위에 없을 때 스크롤바를 적절한 위치로 이동
    if (
      !(x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
    ) {
      const { scrollLeft, scrollTop } = scrollContainer
      isUp
        ? scrollContainer.scroll(scrollLeft, scrollTop - (rect.top - y))
        : scrollContainer.scroll(scrollLeft, scrollTop + y - rect.bottom)
    }
  }
}
