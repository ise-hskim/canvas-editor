import { NAME_PLACEHOLDER } from '../../dataset/constant/ContextMenu'
import { EDITOR_COMPONENT, EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { EditorComponent } from '../../dataset/enum/Editor'
import { DeepRequired } from '../../interface/Common'
import { IEditorOption } from '../../interface/Editor'
import { IElement } from '../../interface/Element'
import {
  IContextMenuContext,
  IRegisterContextMenu
} from '../../interface/contextmenu/ContextMenu'
import { findParent } from '../../utils'
import { zipElementList } from '../../utils/element'
import { Command } from '../command/Command'
import { Draw } from '../draw/Draw'
import { I18n } from '../i18n/I18n'
import { Position } from '../position/Position'
import { RangeManager } from '../range/RangeManager'
import { controlMenus } from './menus/controlMenus'
import { globalMenus } from './menus/globalMenus'
import { hyperlinkMenus } from './menus/hyperlinkMenus'
import { imageMenus } from './menus/imageMenus'
import { tableMenus } from './menus/tableMenus'

interface IRenderPayload {
  contextMenuList: IRegisterContextMenu[]
  left: number
  top: number
  parentMenuContainer?: HTMLDivElement
}

export class ContextMenu {
  private options: DeepRequired<IEditorOption>
  private draw: Draw
  private command: Command
  private range: RangeManager
  private position: Position
  private i18n: I18n
  private container: HTMLDivElement
  private contextMenuList: IRegisterContextMenu[]
  private contextMenuContainerList: HTMLDivElement[]
  private contextMenuRelationShip: Map<HTMLDivElement, HTMLDivElement>
  private context: IContextMenuContext | null

  constructor(draw: Draw, command: Command) {
    this.options = draw.getOptions()
    this.draw = draw
    this.command = command
    this.range = draw.getRange()
    this.position = draw.getPosition()
    this.i18n = draw.getI18n()
    this.container = draw.getContainer()
    this.context = null
    // 내부 메뉴
    this.contextMenuList = [
      ...globalMenus,
      ...tableMenus,
      ...imageMenus,
      ...controlMenus,
      ...hyperlinkMenus
    ]
    this.contextMenuContainerList = []
    this.contextMenuRelationShip = new Map()
    this._addEvent()
  }

  public getContextMenuList(): IRegisterContextMenu[] {
    return this.contextMenuList
  }

  private _addEvent() {
    // 메뉴 권한
    this.container.addEventListener('contextmenu', this._proxyContextMenuEvent)
    // 부작용 처리
    document.addEventListener('mousedown', this._handleSideEffect)
  }

  public removeEvent() {
    this.container.removeEventListener(
      'contextmenu',
      this._proxyContextMenuEvent
    )
    document.removeEventListener('mousedown', this._handleSideEffect)
  }

  private _filterMenuList(
    menuList: IRegisterContextMenu[]
  ): IRegisterContextMenu[] {
    const { contextMenuDisableKeys } = this.options
    const renderList: IRegisterContextMenu[] = []
    for (let m = 0; m < menuList.length; m++) {
      const menu = menuList[m]
      if (
        menu.disable ||
        (menu.key && contextMenuDisableKeys.includes(menu.key))
      ) {
        continue
      }
      if (menu.isDivider) {
        renderList.push(menu)
      } else {
        if (menu.when?.(this.context!)) {
          renderList.push(menu)
        }
      }
    }
    return renderList
  }

  private _proxyContextMenuEvent = (evt: MouseEvent) => {
    this.context = this._getContext()
    const renderList = this._filterMenuList(this.contextMenuList)
    const isRegisterContextMenu = renderList.some(menu => !menu.isDivider)
    if (isRegisterContextMenu) {
      this.dispose()
      this._render({
        contextMenuList: renderList,
        left: evt.x,
        top: evt.y
      })
    }
    evt.preventDefault()
  }

  private _handleSideEffect = (evt: MouseEvent) => {
    if (this.contextMenuContainerList.length) {
      // 오른쪽 마우스 메뉴 외부 클릭
      const target = <Element>(evt?.composedPath()[0] || evt.target)
      const contextMenuDom = findParent(
        target,
        (node: Node & Element) =>
          !!node &&
          node.nodeType === 1 &&
          node.getAttribute(EDITOR_COMPONENT) === EditorComponent.CONTEXTMENU,
        true
      )
      if (!contextMenuDom) {
        this.dispose()
      }
    }
  }

  private _getContext(): IContextMenuContext {
    // 읽기 전용 모드인지 확인
    const isReadonly = this.draw.isReadonly()
    const {
      isCrossRowCol: crossRowCol,
      startIndex,
      endIndex
    } = this.range.getRange()
    // 포커스가 있는지 확인
    const editorTextFocus = !!(~startIndex || ~endIndex)
    // 선택 영역이 있는지 확인
    const editorHasSelection = editorTextFocus && startIndex !== endIndex
    // 테이블 내부에 있는지 확인
    const { isTable, trIndex, tdIndex, index } =
      this.position.getPositionContext()
    let tableElement: IElement | null = null
    if (isTable) {
      const originalElementList = this.draw.getOriginalElementList()
      const originTableElement = originalElementList[index!] || null
      if (originTableElement) {
        tableElement = zipElementList([originTableElement], {
          extraPickAttrs: ['id']
        })[0]
      }
    }
    // 행/열 간 범위가 있는지 확인
    const isCrossRowCol = isTable && !!crossRowCol
    // 현재 요소
    const elementList = this.draw.getElementList()
    const startElement = elementList[startIndex] || null
    const endElement = elementList[endIndex] || null
    // 현재 영역
    const zone = this.draw.getZone().getZone()
    return {
      startElement,
      endElement,
      isReadonly,
      editorHasSelection,
      editorTextFocus,
      isCrossRowCol,
      zone,
      isInTable: isTable,
      trIndex: trIndex ?? null,
      tdIndex: tdIndex ?? null,
      tableElement,
      options: this.options
    }
  }

  private _createContextMenuContainer(): HTMLDivElement {
    const contextMenuContainer = document.createElement('div')
    contextMenuContainer.classList.add(`${EDITOR_PREFIX}-contextmenu-container`)
    contextMenuContainer.setAttribute(
      EDITOR_COMPONENT,
      EditorComponent.CONTEXTMENU
    )
    this.container.append(contextMenuContainer)
    return contextMenuContainer
  }

  private _render(payload: IRenderPayload): HTMLDivElement {
    const { contextMenuList, left, top, parentMenuContainer } = payload
    const contextMenuContainer = this._createContextMenuContainer()
    const contextMenuContent = document.createElement('div')
    contextMenuContent.classList.add(`${EDITOR_PREFIX}-contextmenu-content`)
    // 직접 하위 메뉴
    let childMenuContainer: HTMLDivElement | null = null
    // 부모 메뉴에 하위 메뉴 매핑 관계 추가
    if (parentMenuContainer) {
      this.contextMenuRelationShip.set(
        parentMenuContainer,
        contextMenuContainer
      )
    }
    for (let c = 0; c < contextMenuList.length; c++) {
      const menu = contextMenuList[c]
      if (menu.isDivider) {
        // 분할선이 인접하거나 || 첫번째/마지막 구분기호일 때 렌더링하지 않음
        if (
          c !== 0 &&
          c !== contextMenuList.length - 1 &&
          !contextMenuList[c - 1]?.isDivider
        ) {
          const divider = document.createElement('div')
          divider.classList.add(`${EDITOR_PREFIX}-contextmenu-divider`)
          contextMenuContent.append(divider)
        }
      } else {
        const menuItem = document.createElement('div')
        menuItem.classList.add(`${EDITOR_PREFIX}-contextmenu-item`)
        // 메뉴 이벤트
        if (menu.childMenus) {
          const childMenus = this._filterMenuList(menu.childMenus)
          const isRegisterContextMenu = childMenus.some(menu => !menu.isDivider)
          if (isRegisterContextMenu) {
            menuItem.classList.add(`${EDITOR_PREFIX}-contextmenu-sub-item`)
            menuItem.onmouseenter = () => {
              this._setHoverStatus(menuItem, true)
              this._removeSubMenu(contextMenuContainer)
              // 하위 메뉴
              const subMenuRect = menuItem.getBoundingClientRect()
              const left = subMenuRect.left + subMenuRect.width
              const top = subMenuRect.top
              childMenuContainer = this._render({
                contextMenuList: childMenus,
                left,
                top,
                parentMenuContainer: contextMenuContainer
              })
            }
            menuItem.onmouseleave = evt => {
              // 하위 메뉴 옵션으로 이동할 때 선택 상태 변경 없음
              if (
                !childMenuContainer ||
                !childMenuContainer.contains(evt.relatedTarget as Node)
              ) {
                this._setHoverStatus(menuItem, false)
              }
            }
          }
        } else {
          menuItem.onmouseenter = () => {
            this._setHoverStatus(menuItem, true)
            this._removeSubMenu(contextMenuContainer)
          }
          menuItem.onmouseleave = () => {
            this._setHoverStatus(menuItem, false)
          }
          menuItem.onclick = () => {
            if (menu.callback && this.context) {
              menu.callback(this.command, this.context)
            }
            this.dispose()
          }
        }
        // 아이콘
        const icon = document.createElement('i')
        menuItem.append(icon)
        if (menu.icon) {
          icon.classList.add(`${EDITOR_PREFIX}-contextmenu-${menu.icon}`)
        }
        // 텍스트
        const span = document.createElement('span')
        const name = menu.i18nPath
          ? this._formatName(this.i18n.t(menu.i18nPath))
          : this._formatName(menu.name || '')
        span.append(document.createTextNode(name))
        menuItem.append(span)
        // 단축키 힘트
        if (menu.shortCut) {
          const span = document.createElement('span')
          span.classList.add(`${EDITOR_PREFIX}-shortcut`)
          span.append(document.createTextNode(menu.shortCut))
          menuItem.append(span)
        }
        contextMenuContent.append(menuItem)
      }
    }
    contextMenuContainer.append(contextMenuContent)
    contextMenuContainer.style.display = 'block'
    // 오른쪽 공간이 부족할 때 메뉴 오른쪽 상단을 시작점으로 사용
    const innerWidth = window.innerWidth
    const contextmenuRect = contextMenuContainer.getBoundingClientRect()
    const contextMenuWidth = contextmenuRect.width
    const adjustLeft =
      left + contextMenuWidth > innerWidth ? left - contextMenuWidth : left
    contextMenuContainer.style.left = `${adjustLeft}px`
    // 아래쪽 공간이 부족할 때 메뉴 하단을 시작점으로 사용
    const innerHeight = window.innerHeight
    const contextMenuHeight = contextmenuRect.height
    const adjustTop =
      top + contextMenuHeight > innerHeight ? top - contextMenuHeight : top
    contextMenuContainer.style.top = `${adjustTop}px`
    this.contextMenuContainerList.push(contextMenuContainer)
    return contextMenuContainer
  }

  private _removeSubMenu(payload: HTMLDivElement) {
    const childMenu = this.contextMenuRelationShip.get(payload)
    if (childMenu) {
      this._removeSubMenu(childMenu)
      childMenu.remove()
      this.contextMenuRelationShip.delete(payload)
    }
  }

  private _setHoverStatus(payload: HTMLDivElement, status: boolean) {
    if (status) {
      payload.parentNode
        ?.querySelectorAll(`${EDITOR_PREFIX}-contextmenu-item`)
        .forEach(child => child.classList.remove('hover'))
      payload.classList.add('hover')
    } else {
      payload.classList.remove('hover')
    }
  }

  private _formatName(name: string): string {
    const placeholderValues = Object.values(NAME_PLACEHOLDER)
    const placeholderReg = new RegExp(`${placeholderValues.join('|')}`)
    let formatName = name
    if (placeholderReg.test(formatName)) {
      // 선택 영역 이름
      const selectedReg = new RegExp(NAME_PLACEHOLDER.SELECTED_TEXT, 'g')
      if (selectedReg.test(formatName)) {
        const selectedText = this.range.toString()
        formatName = formatName.replace(selectedReg, selectedText)
      }
    }
    return formatName
  }

  public registerContextMenuList(payload: IRegisterContextMenu[]) {
    this.contextMenuList.push(...payload)
  }

  public dispose() {
    this.contextMenuContainerList.forEach(child => child.remove())
    this.contextMenuContainerList = []
    this.contextMenuRelationShip.clear()
  }
}
