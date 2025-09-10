import { version } from '../../../../package.json'
import { ZERO } from '../../dataset/constant/Common'
import { RowFlex } from '../../dataset/enum/Row'
import {
  IAppendElementListOption,
  IComputeRowListPayload,
  IDrawFloatPayload,
  IDrawOption,
  IDrawPagePayload,
  IDrawRowPayload,
  IGetImageOption,
  IGetOriginValueOption,
  IGetValueOption,
  IPainterOption
} from '../../interface/Draw'
import {
  IEditorData,
  IEditorOption,
  IEditorResult,
  ISetValueOption
} from '../../interface/Editor'
import {
  IElement,
  IElementMetrics,
  IElementFillRect,
  IElementStyle,
  ISpliceElementListOption,
  IInsertElementListOption
} from '../../interface/Element'
import { IRow, IRowElement } from '../../interface/Row'
import { deepClone, getUUID, nextTick } from '../../utils'
import { Cursor } from '../cursor/Cursor'
import { CanvasEvent } from '../event/CanvasEvent'
import { GlobalEvent } from '../event/GlobalEvent'
import { HistoryManager } from '../history/HistoryManager'
import { Listener } from '../listener/Listener'
import { Position } from '../position/Position'
import { RangeManager } from '../range/RangeManager'
import { Background } from './frame/Background'
import { Highlight } from './richtext/Highlight'
import { Margin } from './frame/Margin'
import { Search } from './interactive/Search'
import { Strikeout } from './richtext/Strikeout'
import { Underline } from './richtext/Underline'
import { ElementType } from '../../dataset/enum/Element'
import { ImageParticle } from './particle/ImageParticle'
import { LaTexParticle } from './particle/latex/LaTexParticle'
import { TextParticle } from './particle/TextParticle'
import { PageNumber } from './frame/PageNumber'
import { ScrollObserver } from '../observer/ScrollObserver'
import { SelectionObserver } from '../observer/SelectionObserver'
import { TableParticle } from './particle/table/TableParticle'
import { TableTool } from './particle/table/TableTool'
import { HyperlinkParticle } from './particle/HyperlinkParticle'
import { Header } from './frame/Header'
import { SuperscriptParticle } from './particle/SuperscriptParticle'
import { SubscriptParticle } from './particle/SubscriptParticle'
import { SeparatorParticle } from './particle/SeparatorParticle'
import { PageBreakParticle } from './particle/PageBreakParticle'
import { Watermark } from './frame/Watermark'
import {
  EditorComponent,
  EditorMode,
  EditorZone,
  PageMode,
  PaperDirection,
  WordBreak
} from '../../dataset/enum/Editor'
import { Control } from './control/Control'
import {
  deleteSurroundElementList,
  getIsBlockElement,
  getSlimCloneElementList,
  pickSurroundElementList,
  zipElementList
} from '../../utils/element'
import { CheckboxParticle } from './particle/CheckboxParticle'
import { RadioParticle } from './particle/RadioParticle'
import { DeepRequired, IPadding } from '../../interface/Common'
import {
  ControlComponent,
  ControlIndentation
} from '../../dataset/enum/Control'
import { formatElementList } from '../../utils/element'
import { WorkerManager } from '../worker/WorkerManager'
import { Previewer } from './particle/previewer/Previewer'
import { DateParticle } from './particle/date/DateParticle'
import { IMargin } from '../../interface/Margin'
import { BlockParticle } from './particle/block/BlockParticle'
import { EDITOR_COMPONENT, EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { I18n } from '../i18n/I18n'
import { ImageObserver } from '../observer/ImageObserver'
import { Zone } from '../zone/Zone'
import { Footer } from './frame/Footer'
import {
  IMAGE_ELEMENT_TYPE,
  TEXTLIKE_ELEMENT_TYPE
} from '../../dataset/constant/Element'
import { ListParticle } from './particle/ListParticle'
import { Placeholder } from './frame/Placeholder'
import { EventBus } from '../event/eventbus/EventBus'
import { EventBusMap } from '../../interface/EventBus'
import { Group } from './interactive/Group'
import { Override } from '../override/Override'
import { FlexDirection, ImageDisplay } from '../../dataset/enum/Common'
import { PUNCTUATION_REG } from '../../dataset/constant/Regular'
import { LineBreakParticle } from './particle/LineBreakParticle'
import { MouseObserver } from '../observer/MouseObserver'
import { LineNumber } from './frame/LineNumber'
import { PageBorder } from './frame/PageBorder'
import { ITd } from '../../interface/table/Td'
import { Actuator } from '../actuator/Actuator'
import { TableOperate } from './particle/table/TableOperate'
import { Area } from './interactive/Area'
import { Badge } from './frame/Badge'

export class Draw {
  private container: HTMLDivElement
  private pageContainer: HTMLDivElement
  private pageList: HTMLCanvasElement[]
  private ctxList: CanvasRenderingContext2D[]
  private pageNo: number
  private renderCount: number
  private pagePixelRatio: number | null
  private mode: EditorMode
  private options: DeepRequired<IEditorOption>
  private position: Position
  private zone: Zone
  private elementList: IElement[]
  private listener: Listener
  private eventBus: EventBus<EventBusMap>
  private override: Override

  private i18n: I18n
  private canvasEvent: CanvasEvent
  private globalEvent: GlobalEvent
  private cursor: Cursor
  private range: RangeManager
  private margin: Margin
  private background: Background
  private badge: Badge
  private search: Search
  private group: Group
  private area: Area
  private underline: Underline
  private strikeout: Strikeout
  private highlight: Highlight
  private historyManager: HistoryManager
  private previewer: Previewer
  private imageParticle: ImageParticle
  private laTexParticle: LaTexParticle
  private textParticle: TextParticle
  private tableParticle: TableParticle
  private tableTool: TableTool
  private tableOperate: TableOperate
  private pageNumber: PageNumber
  private lineNumber: LineNumber
  private waterMark: Watermark
  private placeholder: Placeholder
  private header: Header
  private footer: Footer
  private hyperlinkParticle: HyperlinkParticle
  private dateParticle: DateParticle
  private separatorParticle: SeparatorParticle
  private pageBreakParticle: PageBreakParticle
  private superscriptParticle: SuperscriptParticle
  private subscriptParticle: SubscriptParticle
  private checkboxParticle: CheckboxParticle
  private radioParticle: RadioParticle
  private blockParticle: BlockParticle
  private listParticle: ListParticle
  private lineBreakParticle: LineBreakParticle
  private control: Control
  private pageBorder: PageBorder
  private workerManager: WorkerManager
  private scrollObserver: ScrollObserver
  private selectionObserver: SelectionObserver
  private imageObserver: ImageObserver

  private LETTER_REG: RegExp
  private WORD_LIKE_REG: RegExp
  private rowList: IRow[]
  private pageRowList: IRow[][]
  private painterStyle: IElementStyle | null
  private painterOptions: IPainterOption | null
  private visiblePageNoList: number[]
  private intersectionPageNo: number
  private lazyRenderIntersectionObserver: IntersectionObserver | null
  private printModeData: Required<IEditorData> | null

  constructor(
    rootContainer: HTMLElement,
    options: DeepRequired<IEditorOption>,
    data: IEditorData,
    listener: Listener,
    eventBus: EventBus<EventBusMap>,
    override: Override
  ) {
    this.container = this._wrapContainer(rootContainer)
    this.pageList = []
    this.ctxList = []
    this.pageNo = 0
    this.renderCount = 0
    this.pagePixelRatio = null
    this.mode = options.mode
    this.options = options
    this.elementList = data.main
    this.listener = listener
    this.eventBus = eventBus
    this.override = override

    this._formatContainer()
    this.pageContainer = this._createPageContainer()
    this._createPage(0)

    this.i18n = new I18n(options.locale)
    this.historyManager = new HistoryManager(this)
    this.position = new Position(this)
    this.zone = new Zone(this)
    this.range = new RangeManager(this)
    this.margin = new Margin(this)
    this.background = new Background(this)
    this.badge = new Badge(this)
    this.search = new Search(this)
    this.group = new Group(this)
    this.area = new Area(this)
    this.underline = new Underline(this)
    this.strikeout = new Strikeout(this)
    this.highlight = new Highlight(this)
    this.previewer = new Previewer(this)
    this.imageParticle = new ImageParticle(this)
    this.laTexParticle = new LaTexParticle(this)
    this.textParticle = new TextParticle(this)
    this.tableParticle = new TableParticle(this)
    this.tableTool = new TableTool(this)
    this.tableOperate = new TableOperate(this)
    this.pageNumber = new PageNumber(this)
    this.lineNumber = new LineNumber(this)
    this.waterMark = new Watermark(this)
    this.placeholder = new Placeholder(this)
    this.header = new Header(this, data.header)
    this.footer = new Footer(this, data.footer)
    this.hyperlinkParticle = new HyperlinkParticle(this)
    this.dateParticle = new DateParticle(this)
    this.separatorParticle = new SeparatorParticle(this)
    this.pageBreakParticle = new PageBreakParticle(this)
    this.superscriptParticle = new SuperscriptParticle()
    this.subscriptParticle = new SubscriptParticle()
    this.checkboxParticle = new CheckboxParticle(this)
    this.radioParticle = new RadioParticle(this)
    this.blockParticle = new BlockParticle(this)
    this.listParticle = new ListParticle(this)
    this.lineBreakParticle = new LineBreakParticle(this)
    this.control = new Control(this)
    this.pageBorder = new PageBorder(this)

    this.scrollObserver = new ScrollObserver(this)
    this.selectionObserver = new SelectionObserver(this)
    this.imageObserver = new ImageObserver()
    new MouseObserver(this)

    this.canvasEvent = new CanvasEvent(this)
    this.cursor = new Cursor(this, this.canvasEvent)
    this.canvasEvent.register()
    this.globalEvent = new GlobalEvent(this, this.canvasEvent)
    this.globalEvent.register()

    this.workerManager = new WorkerManager(this)
    new Actuator(this)

    const { letterClass } = options
    this.LETTER_REG = new RegExp(`[${letterClass.join('')}]`)
    this.WORD_LIKE_REG = new RegExp(
      `${letterClass.map(letter => `[^${letter}][${letter}]`).join('|')}`
    )
    this.rowList = []
    this.pageRowList = []
    this.painterStyle = null
    this.painterOptions = null
    this.visiblePageNoList = []
    this.intersectionPageNo = 0
    this.lazyRenderIntersectionObserver = null
    this.printModeData = null

    // 인쇄 모드에서 우선적으로 인쇄 데이터 설정
    if (this.mode === EditorMode.PRINT) {
      this.setPrintData()
    }
    this.render({
      isInit: true,
      isSetCursor: false,
      isFirstRender: true
    })
  }

  // 인쇄 데이터 설정
  public setPrintData() {
    this.printModeData = {
      header: this.header.getElementList(),
      main: this.elementList,
      footer: this.footer.getElementList()
    }
    // 컨트롤 보조 요소 필터링
    const clonePrintModeData = deepClone(this.printModeData)
    const editorDataKeys: (keyof IEditorData)[] = ['header', 'main', 'footer']
    editorDataKeys.forEach(key => {
      clonePrintModeData[key] = this.control.filterAssistElement(
        clonePrintModeData[key]
      )
    })
    this.setEditorData(clonePrintModeData)
  }

  // 인쇄 데이터 복원
  public clearPrintData() {
    if (this.printModeData) {
      this.setEditorData(this.printModeData)
      this.printModeData = null
    }
  }

  public getLetterReg(): RegExp {
    return this.LETTER_REG
  }

  public getMode(): EditorMode {
    return this.mode
  }

  public setMode(payload: EditorMode) {
    if (this.mode === payload) return
    // 인쇄 모드 설정
    if (payload === EditorMode.PRINT) {
      this.setPrintData()
    }
    // 인쇄 모드 취소
    if (this.mode === EditorMode.PRINT) {
      this.clearPrintData()
    }
    this.clearSideEffect()
    this.range.clearRange()
    this.mode = payload
    this.options.mode = payload
    this.render({
      isSetCursor: false,
      isSubmitHistory: false
    })
  }

  public isReadonly() {
    if (this.area.getActiveAreaInfo()?.area?.mode) {
      return this.area.isReadonly()
    }
    switch (this.mode) {
      case EditorMode.DESIGN:
        return false
      case EditorMode.READONLY:
      case EditorMode.PRINT:
        return true
      case EditorMode.FORM:
        return !this.control.getIsRangeWithinControl()
      default:
        return false
    }
  }

  public isDisabled() {
    if (this.mode === EditorMode.DESIGN) return false
    const { startIndex, endIndex } = this.range.getRange()
    const elementList = this.getElementList()
    // 테이블 셀 우선 판단
    if (this.getTd()?.disabled) return true
    if (startIndex === endIndex) {
      const startElement = elementList[startIndex]
      const nextElement = elementList[startIndex + 1]
      return !!(
        (startElement?.title?.disabled &&
          nextElement?.title?.disabled &&
          startElement.titleId === nextElement.titleId) ||
        (startElement?.control?.disabled &&
          nextElement?.control?.disabled &&
          startElement.controlId === nextElement.controlId)
      )
    }
    const selectionElementList = elementList.slice(startIndex + 1, endIndex + 1)
    return selectionElementList.some(
      element => element.title?.disabled || element.control?.disabled
    )
  }

  public isDesignMode() {
    return this.mode === EditorMode.DESIGN
  }

  public isPrintMode() {
    return this.mode === EditorMode.PRINT
  }

  public getOriginalWidth(): number {
    const { paperDirection, width, height } = this.options
    return paperDirection === PaperDirection.VERTICAL ? width : height
  }

  public getOriginalHeight(): number {
    const { paperDirection, width, height } = this.options
    return paperDirection === PaperDirection.VERTICAL ? height : width
  }

  public getWidth(): number {
    return Math.floor(this.getOriginalWidth() * this.options.scale)
  }

  public getHeight(): number {
    return Math.floor(this.getOriginalHeight() * this.options.scale)
  }

  public getMainHeight(): number {
    const pageHeight = this.getHeight()
    return pageHeight - this.getMainOuterHeight()
  }

  public getMainOuterHeight(): number {
    const margins = this.getMargins()
    const headerExtraHeight = this.header.getExtraHeight()
    const footerExtraHeight = this.footer.getExtraHeight()
    return margins[0] + margins[2] + headerExtraHeight + footerExtraHeight
  }

  public getCanvasWidth(pageNo = -1): number {
    const page = this.getPage(pageNo)
    return page.width
  }

  public getCanvasHeight(pageNo = -1): number {
    const page = this.getPage(pageNo)
    return page.height
  }

  public getInnerWidth(): number {
    const width = this.getWidth()
    const margins = this.getMargins()
    return width - margins[1] - margins[3]
  }

  public getOriginalInnerWidth(): number {
    const width = this.getOriginalWidth()
    const margins = this.getOriginalMargins()
    return width - margins[1] - margins[3]
  }

  public getContextInnerWidth(): number {
    const positionContext = this.position.getPositionContext()
    if (positionContext.isTable) {
      const { index, trIndex, tdIndex } = positionContext
      const elementList = this.getOriginalElementList()
      const td = elementList[index!].trList![trIndex!].tdList[tdIndex!]
      const tdPadding = this.getTdPadding()
      return td!.width! - tdPadding[1] - tdPadding[3]
    }
    return this.getOriginalInnerWidth()
  }

  public getMargins(): IMargin {
    return <IMargin>this.getOriginalMargins().map(m => m * this.options.scale)
  }

  public getOriginalMargins(): number[] {
    const { margins, paperDirection } = this.options
    return paperDirection === PaperDirection.VERTICAL
      ? margins
      : [margins[1], margins[2], margins[3], margins[0]]
  }

  public getPageGap(): number {
    return this.options.pageGap * this.options.scale
  }

  public getOriginalPageGap(): number {
    return this.options.pageGap
  }

  public getPageNumberBottom(): number {
    const {
      pageNumber: { bottom },
      scale
    } = this.options
    return bottom * scale
  }

  public getMarginIndicatorSize(): number {
    return this.options.marginIndicatorSize * this.options.scale
  }

  public getDefaultBasicRowMarginHeight(): number {
    return this.options.defaultBasicRowMarginHeight * this.options.scale
  }

  public getHighlightMarginHeight(): number {
    return this.options.highlightMarginHeight * this.options.scale
  }

  public getTdPadding(): IPadding {
    const {
      table: { tdPadding },
      scale
    } = this.options
    return <IPadding>tdPadding.map(m => m * scale)
  }

  public getContainer(): HTMLDivElement {
    return this.container
  }

  public getPageContainer(): HTMLDivElement {
    return this.pageContainer
  }

  public getVisiblePageNoList(): number[] {
    return this.visiblePageNoList
  }

  public setVisiblePageNoList(payload: number[]) {
    this.visiblePageNoList = payload
    if (this.listener.visiblePageNoListChange) {
      this.listener.visiblePageNoListChange(this.visiblePageNoList)
    }
    if (this.eventBus.isSubscribe('visiblePageNoListChange')) {
      this.eventBus.emit('visiblePageNoListChange', this.visiblePageNoList)
    }
  }

  public getIntersectionPageNo(): number {
    return this.intersectionPageNo
  }

  public setIntersectionPageNo(payload: number) {
    this.intersectionPageNo = payload
    if (this.listener.intersectionPageNoChange) {
      this.listener.intersectionPageNoChange(this.intersectionPageNo)
    }
    if (this.eventBus.isSubscribe('intersectionPageNoChange')) {
      this.eventBus.emit('intersectionPageNoChange', this.intersectionPageNo)
    }
  }

  public getPageNo(): number {
    return this.pageNo
  }

  public setPageNo(payload: number) {
    this.pageNo = payload
  }

  public getRenderCount(): number {
    return this.renderCount
  }

  public getPage(pageNo = -1): HTMLCanvasElement {
    return this.pageList[~pageNo ? pageNo : this.pageNo]
  }

  public getPageList(): HTMLCanvasElement[] {
    return this.pageList
  }

  public getPageCount(): number {
    return this.pageList.length
  }

  public getTableRowList(sourceElementList: IElement[]): IRow[] {
    const positionContext = this.position.getPositionContext()
    const { index, trIndex, tdIndex } = positionContext
    return sourceElementList[index!].trList![trIndex!].tdList[tdIndex!].rowList!
  }

  public getOriginalRowList() {
    const zoneManager = this.getZone()
    if (zoneManager.isHeaderActive()) {
      return this.header.getRowList()
    }
    if (zoneManager.isFooterActive()) {
      return this.footer.getRowList()
    }
    return this.rowList
  }

  public getRowList(): IRow[] {
    const positionContext = this.position.getPositionContext()
    return positionContext.isTable
      ? this.getTableRowList(this.getOriginalElementList())
      : this.getOriginalRowList()
  }

  public getPageRowList(): IRow[][] {
    return this.pageRowList
  }

  public getCtx(): CanvasRenderingContext2D {
    return this.ctxList[this.pageNo]
  }

  public getOptions(): DeepRequired<IEditorOption> {
    return this.options
  }

  public getSearch(): Search {
    return this.search
  }

  public getGroup(): Group {
    return this.group
  }

  public getArea(): Area {
    return this.area
  }

  public getBadge(): Badge {
    return this.badge
  }

  public getHistoryManager(): HistoryManager {
    return this.historyManager
  }

  public getPosition(): Position {
    return this.position
  }

  public getZone(): Zone {
    return this.zone
  }

  public getRange(): RangeManager {
    return this.range
  }

  public getLineBreakParticle(): LineBreakParticle {
    return this.lineBreakParticle
  }

  public getTextParticle(): TextParticle {
    return this.textParticle
  }

  public getHeaderElementList(): IElement[] {
    return this.header.getElementList()
  }

  public getTableElementList(sourceElementList: IElement[]): IElement[] {
    const positionContext = this.position.getPositionContext()
    const { index, trIndex, tdIndex } = positionContext
    return (
      sourceElementList[index!].trList?.[trIndex!].tdList[tdIndex!].value || []
    )
  }

  public getElementList(): IElement[] {
    const positionContext = this.position.getPositionContext()
    const elementList = this.getOriginalElementList()
    return positionContext.isTable
      ? this.getTableElementList(elementList)
      : elementList
  }

  public getMainElementList(): IElement[] {
    const positionContext = this.position.getPositionContext()
    return positionContext.isTable
      ? this.getTableElementList(this.elementList)
      : this.elementList
  }

  public getOriginalElementList() {
    const zoneManager = this.getZone()
    if (zoneManager.isHeaderActive()) {
      return this.getHeaderElementList()
    }
    if (zoneManager.isFooterActive()) {
      return this.getFooterElementList()
    }
    return this.elementList
  }

  public getOriginalMainElementList(): IElement[] {
    return this.elementList
  }

  public getFooterElementList(): IElement[] {
    return this.footer.getElementList()
  }

  public getTd(): ITd | null {
    const positionContext = this.position.getPositionContext()
    const { index, trIndex, tdIndex, isTable } = positionContext
    if (isTable) {
      const elementList = this.getOriginalElementList()
      return elementList[index!].trList![trIndex!].tdList[tdIndex!]
    }
    return null
  }

  public insertElementList(
    payload: IElement[],
    options: IInsertElementListOption = {}
  ) {
    if (!payload.length || !this.range.getIsCanInput()) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const { isSubmitHistory = true } = options
    formatElementList(payload, {
      isHandleFirstElement: false,
      editorOptions: this.options
    })
    let curIndex = -1
    // 컨트롤 내부에 있는지 판단
    let activeControl = this.control.getActiveControl()
    // 커서가 컨트롤 내부에 있으나 현재 활성화되지 않았다면 수동으로 활성화 필요
    if (!activeControl && this.control.getIsRangeWithinControl()) {
      this.control.initControl()
      activeControl = this.control.getActiveControl()
    }
    if (activeControl && this.control.getIsRangeWithinControl()) {
      curIndex = activeControl.setValue(payload, undefined, {
        isIgnoreDisabledRule: true
      })
      this.control.emitControlContentChange()
    } else {
      const elementList = this.getElementList()
      const isCollapsed = startIndex === endIndex
      const start = startIndex + 1
      if (!isCollapsed) {
        this.spliceElementList(elementList, start, endIndex - startIndex)
      }
      this.spliceElementList(elementList, start, 0, payload)
      curIndex = startIndex + payload.length
      // 목록 앞에 줄바꿈이 있으면 삭제 - 목록 내부에 이미 존재하기 때문
      const preElement = elementList[start - 1]
      if (
        payload[0].listId &&
        preElement &&
        !preElement.listId &&
        preElement?.value === ZERO &&
        (!preElement.type || preElement.type === ElementType.TEXT)
      ) {
        elementList.splice(startIndex, 1)
        curIndex -= 1
      }
    }
    if (~curIndex) {
      this.range.setRange(curIndex, curIndex)
      this.render({
        curIndex,
        isSubmitHistory
      })
    }
  }

  public appendElementList(
    elementList: IElement[],
    options: IAppendElementListOption = {}
  ) {
    if (!elementList.length) return
    formatElementList(elementList, {
      isHandleFirstElement: false,
      editorOptions: this.options
    })
    let curIndex: number
    const { isPrepend, isSubmitHistory = true } = options
    if (isPrepend) {
      this.elementList.splice(1, 0, ...elementList)
      curIndex = elementList.length
    } else {
      this.elementList.push(...elementList)
      curIndex = this.elementList.length - 1
    }
    this.range.setRange(curIndex, curIndex)
    this.render({
      curIndex,
      isSubmitHistory
    })
  }

  public spliceElementList(
    elementList: IElement[],
    start: number,
    deleteCount: number,
    items?: IElement[],
    options?: ISpliceElementListOption
  ) {
    const { isIgnoreDeletedRule = false } = options || {}
    const { group, modeRule } = this.options
    if (deleteCount > 0) {
      // 마지막 요소와 시작 요소의 목록 정보가 일치하지 않을 때: 현재 목록 정보 제거
      const endIndex = start + deleteCount
      const endElement = elementList[endIndex]
      const endElementListId = endElement?.listId
      if (
        endElementListId &&
        elementList[start - 1]?.listId !== endElementListId
      ) {
        let startIndex = endIndex
        while (startIndex < elementList.length) {
          const curElement = elementList[startIndex]
          if (
            curElement.listId !== endElementListId ||
            curElement.value === ZERO
          ) {
            break
          }
          delete curElement.listId
          delete curElement.listType
          delete curElement.listStyle
          startIndex++
        }
      }
      // 명시적 삭제 규칙 무시 아님 && 디자인 모드 아님 && 커서가 컨트롤 내부에 있지 않음(컨트롤 내부 제어) => 삭제 규칙 검증
      if (
        !isIgnoreDeletedRule &&
        !this.isDesignMode() &&
        !this.control.getIsRangeWithinControl()
      ) {
        const tdDeletable = this.getTd()?.deletable
        let deleteIndex = endIndex - 1
        while (deleteIndex >= start) {
          const deleteElement = elementList[deleteIndex]
          if (
            deleteElement?.hide ||
            deleteElement?.control?.hide ||
            deleteElement?.area?.hide ||
            (tdDeletable !== false &&
              deleteElement?.control?.deletable !== false &&
              (!deleteElement.controlId ||
                this.mode !== EditorMode.FORM ||
                !modeRule[this.mode].controlDeletableDisabled) &&
              deleteElement?.title?.deletable !== false &&
              (group.deletable !== false || !deleteElement.groupIds?.length) &&
              (deleteElement?.area?.deletable !== false ||
                deleteElement?.areaIndex !== 0))
          ) {
            elementList.splice(deleteIndex, 1)
          }
          deleteIndex--
        }
      } else {
        elementList.splice(start, deleteCount)
      }
    }
    // 루프로 추가, 구조 분해 사용으로 성능 영향 방지
    if (items?.length) {
      for (let i = 0; i < items.length; i++) {
        elementList.splice(start + i, 0, items[i])
      }
    }
  }

  public getCanvasEvent(): CanvasEvent {
    return this.canvasEvent
  }

  public getGlobalEvent(): GlobalEvent {
    return this.globalEvent
  }

  public getListener(): Listener {
    return this.listener
  }

  public getEventBus(): EventBus<EventBusMap> {
    return this.eventBus
  }

  public getOverride(): Override {
    return this.override
  }

  public getCursor(): Cursor {
    return this.cursor
  }

  public getPreviewer(): Previewer {
    return this.previewer
  }

  public getImageParticle(): ImageParticle {
    return this.imageParticle
  }

  public getTableTool(): TableTool {
    return this.tableTool
  }

  public getTableOperate(): TableOperate {
    return this.tableOperate
  }

  public getTableParticle(): TableParticle {
    return this.tableParticle
  }

  public getHeader(): Header {
    return this.header
  }

  public getFooter(): Footer {
    return this.footer
  }

  public getHyperlinkParticle(): HyperlinkParticle {
    return this.hyperlinkParticle
  }

  public getDateParticle(): DateParticle {
    return this.dateParticle
  }

  public getListParticle(): ListParticle {
    return this.listParticle
  }

  public getCheckboxParticle(): CheckboxParticle {
    return this.checkboxParticle
  }

  public getRadioParticle(): RadioParticle {
    return this.radioParticle
  }

  public getControl(): Control {
    return this.control
  }

  public getWorkerManager(): WorkerManager {
    return this.workerManager
  }

  public getImageObserver(): ImageObserver {
    return this.imageObserver
  }

  public getI18n(): I18n {
    return this.i18n
  }

  public getRowCount(): number {
    return this.getRowList().length
  }

  public async getDataURL(payload: IGetImageOption = {}): Promise<string[]> {
    const { pixelRatio, mode } = payload
    // 픽셀 비율 확대
    if (pixelRatio) {
      this.setPagePixelRatio(pixelRatio)
    }
    // 다른 모드
    const currentMode = this.mode
    const isSwitchMode = !!mode && currentMode !== mode
    if (isSwitchMode) {
      this.setMode(mode)
    }
    this.render({
      isLazy: false,
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    await this.imageObserver.allSettled()
    const dataUrlList = this.pageList.map(c => c.toDataURL())
    // 복원
    if (pixelRatio) {
      this.setPagePixelRatio(null)
    }
    if (isSwitchMode) {
      this.setMode(currentMode)
    }
    return dataUrlList
  }

  public getPainterStyle(): IElementStyle | null {
    return this.painterStyle && Object.keys(this.painterStyle).length
      ? this.painterStyle
      : null
  }

  public getPainterOptions(): IPainterOption | null {
    return this.painterOptions
  }

  public setPainterStyle(
    payload: IElementStyle | null,
    options?: IPainterOption
  ) {
    this.painterStyle = payload
    this.painterOptions = options || null
    if (this.getPainterStyle()) {
      this.pageList.forEach(c => (c.style.cursor = 'copy'))
    }
  }

  public setDefaultRange() {
    if (!this.elementList.length) return
    setTimeout(() => {
      const curIndex = this.elementList.length - 1
      this.range.setRange(curIndex, curIndex)
      this.range.setRangeStyle()
    })
  }

  public getIsPagingMode(): boolean {
    return this.options.pageMode === PageMode.PAGING
  }

  public setPageMode(payload: PageMode) {
    if (!payload || this.options.pageMode === payload) return
    this.options.pageMode = payload
    // 용지 크기 재설정
    if (payload === PageMode.PAGING) {
      const { height } = this.options
      const dpr = this.getPagePixelRatio()
      const canvas = this.pageList[0]
      canvas.style.height = `${height}px`
      canvas.height = height * dpr
      // 캔버스 크기 변화로 컨텍스트 재설정
      this._initPageContext(this.ctxList[0])
    } else {
      // 연속 페이지 모드: 지연 로딩 모니터링 제거 & 헤더/푸터 계산 데이터 지우기
      this._disconnectLazyRender()
      this.header.recovery()
      this.footer.recovery()
      this.zone.setZone(EditorZone.MAIN)
    }
    const { startIndex } = this.range.getRange()
    const isCollapsed = this.range.getIsCollapsed()
    this.render({
      isSetCursor: true,
      curIndex: startIndex,
      isSubmitHistory: false
    })
    // 이벤트 리스너 손실 방지를 위한 재위치
    if (!isCollapsed) {
      this.cursor.drawCursor({
        isShow: false
      })
    }
    // 콜백
    setTimeout(() => {
      if (this.listener.pageModeChange) {
        this.listener.pageModeChange(payload)
      }
      if (this.eventBus.isSubscribe('pageModeChange')) {
        this.eventBus.emit('pageModeChange', payload)
      }
    })
  }

  public setPageScale(payload: number) {
    const dpr = this.getPagePixelRatio()
    this.options.scale = payload
    const width = this.getWidth()
    const height = this.getHeight()
    this.container.style.width = `${width}px`
    this.pageList.forEach((p, i) => {
      p.width = width * dpr
      p.height = height * dpr
      p.style.width = `${width}px`
      p.style.height = `${height}px`
      p.style.marginBottom = `${this.getPageGap()}px`
      this._initPageContext(this.ctxList[i])
    })
    const cursorPosition = this.position.getCursorPosition()
    this.render({
      isSubmitHistory: false,
      isSetCursor: !!cursorPosition,
      curIndex: cursorPosition?.index
    })
    if (this.listener.pageScaleChange) {
      this.listener.pageScaleChange(payload)
    }
    if (this.eventBus.isSubscribe('pageScaleChange')) {
      this.eventBus.emit('pageScaleChange', payload)
    }
  }

  public getPagePixelRatio(): number {
    return this.pagePixelRatio || window.devicePixelRatio
  }

  public setPagePixelRatio(payload: number | null) {
    if (
      (!this.pagePixelRatio && payload === window.devicePixelRatio) ||
      payload === this.pagePixelRatio
    ) {
      return
    }
    this.pagePixelRatio = payload
    this.setPageDevicePixel()
  }

  public setPageDevicePixel() {
    const dpr = this.getPagePixelRatio()
    const width = this.getWidth()
    const height = this.getHeight()
    this.pageList.forEach((p, i) => {
      p.width = width * dpr
      p.height = height * dpr
      this._initPageContext(this.ctxList[i])
    })
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public setPaperSize(width: number, height: number) {
    this.options.width = width
    this.options.height = height
    const dpr = this.getPagePixelRatio()
    const realWidth = this.getWidth()
    const realHeight = this.getHeight()
    this.container.style.width = `${realWidth}px`
    this.pageList.forEach((p, i) => {
      p.width = realWidth * dpr
      p.height = realHeight * dpr
      p.style.width = `${realWidth}px`
      p.style.height = `${realHeight}px`
      this._initPageContext(this.ctxList[i])
    })
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public setPaperDirection(payload: PaperDirection) {
    const dpr = this.getPagePixelRatio()
    this.options.paperDirection = payload
    const width = this.getWidth()
    const height = this.getHeight()
    this.container.style.width = `${width}px`
    this.pageList.forEach((p, i) => {
      p.width = width * dpr
      p.height = height * dpr
      p.style.width = `${width}px`
      p.style.height = `${height}px`
      this._initPageContext(this.ctxList[i])
    })
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public setPaperMargin(payload: IMargin) {
    this.options.margins = payload
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public getOriginValue(
    options: IGetOriginValueOption = {}
  ): Required<IEditorData> {
    const { pageNo } = options
    let mainElementList = this.elementList
    if (
      Number.isInteger(pageNo) &&
      pageNo! >= 0 &&
      pageNo! < this.pageRowList.length
    ) {
      mainElementList = this.pageRowList[pageNo!].flatMap(
        row => row.elementList
      )
    }
    const data: Required<IEditorData> = {
      header: this.getHeaderElementList(),
      main: mainElementList,
      footer: this.getFooterElementList()
    }
    return data
  }

  public getValue(options: IGetValueOption = {}): IEditorResult {
    const originData = this.getOriginValue(options)
    const { extraPickAttrs } = options
    const data: IEditorData = {
      header: zipElementList(originData.header, {
        extraPickAttrs
      }),
      main: zipElementList(originData.main, {
        extraPickAttrs,
        isClassifyArea: true
      }),
      footer: zipElementList(originData.footer, {
        extraPickAttrs
      })
    }
    return {
      version,
      data,
      options: deepClone(this.options)
    }
  }

  public setValue(payload: Partial<IEditorData>, options?: ISetValueOption) {
    const { header, main, footer } = deepClone(payload)
    if (!header && !main && !footer) return
    const { isSetCursor = false } = options || {}
    const pageComponentData = [header, main, footer]
    pageComponentData.forEach(data => {
      if (!data) return
      formatElementList(data, {
        editorOptions: this.options,
        isForceCompensation: true
      })
    })
    this.setEditorData({
      header,
      main,
      footer
    })
    // 렌더링 & 계산 & 히스토리 기록 지우기
    this.historyManager.recovery()
    const curIndex = isSetCursor
      ? main?.length
        ? main.length - 1
        : 0
      : undefined
    if (curIndex !== undefined) {
      this.range.setRange(curIndex, curIndex)
    }
    this.render({
      curIndex,
      isSetCursor,
      isFirstRender: true
    })
  }

  public setEditorData(payload: Partial<IEditorData>) {
    const { header, main, footer } = payload
    if (header) {
      this.header.setElementList(header)
    }
    if (main) {
      this.elementList = main
    }
    if (footer) {
      this.footer.setElementList(footer)
    }
  }

  private _wrapContainer(rootContainer: HTMLElement): HTMLDivElement {
    const container = document.createElement('div')
    rootContainer.append(container)
    return container
  }

  private _formatContainer() {
    // 컴테이너 너비는 용지 너비를 따라야 함
    this.container.style.position = 'relative'
    this.container.style.width = `${this.getWidth()}px`
    this.container.setAttribute(EDITOR_COMPONENT, EditorComponent.MAIN)
  }

  private _createPageContainer(): HTMLDivElement {
    const pageContainer = document.createElement('div')
    pageContainer.classList.add(`${EDITOR_PREFIX}-page-container`)
    this.container.append(pageContainer)
    return pageContainer
  }

  private _createPage(pageNo: number) {
    const width = this.getWidth()
    const height = this.getHeight()
    const canvas = document.createElement('canvas')
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.style.display = 'block'
    canvas.style.backgroundColor = '#ffffff'
    canvas.style.marginBottom = `${this.getPageGap()}px`
    canvas.setAttribute('data-index', String(pageNo))
    this.pageContainer.append(canvas)
    // 해상도 조정
    const dpr = this.getPagePixelRatio()
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.cursor = 'text'
    const ctx = canvas.getContext('2d')!
    // 컨텍스트 초기 설정
    this._initPageContext(ctx)
    // 컨텍스트 캐시
    this.pageList.push(canvas)
    this.ctxList.push(ctx)
  }

  private _initPageContext(ctx: CanvasRenderingContext2D) {
    const dpr = this.getPagePixelRatio()
    ctx.scale(dpr, dpr)
    // 일부 브라우저(chrome)가 CSS 스타일을 적용하기 때문에 다음 속성들을 재설정
    ctx.letterSpacing = '0px'
    ctx.wordSpacing = '0px'
    ctx.direction = 'ltr'
  }

  public getElementFont(el: IElement, scale = 1): string {
    const { defaultSize, defaultFont } = this.options
    const font = el.font || defaultFont
    const size = el.actualSize || el.size || defaultSize
    return `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${
      size * scale
    }px ${font}`
  }

  public getElementSize(el: IElement) {
    return el.actualSize || el.size || this.options.defaultSize
  }

  public getElementRowMargin(el: IElement) {
    const { defaultBasicRowMarginHeight, defaultRowMargin, scale } =
      this.options
    return (
      defaultBasicRowMarginHeight * (el.rowMargin ?? defaultRowMargin) * scale
    )
  }

  public computeRowList(payload: IComputeRowListPayload) {
    const {
      innerWidth,
      elementList,
      isPagingMode = false,
      isFromTable = false,
      startX = 0,
      startY = 0,
      pageHeight = 0,
      mainOuterHeight = 0,
      surroundElementList = []
    } = payload
    const {
      defaultSize,
      defaultRowMargin,
      scale,
      table: { tdPadding, defaultTrMinHeight },
      defaultTabWidth
    } = this.options
    const defaultBasicRowMarginHeight = this.getDefaultBasicRowMarginHeight()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    // 목록 오프셋 너비 계산
    const listStyleMap = this.listParticle.computeListStyle(ctx, elementList)
    const rowList: IRow[] = []
    if (elementList.length) {
      rowList.push({
        width: 0,
        height: 0,
        ascent: 0,
        elementList: [],
        startIndex: 0,
        rowIndex: 0,
        rowFlex: elementList?.[0]?.rowFlex || elementList?.[1]?.rowFlex
      })
    }
    // 시작 위치 및 페이지 번호 계산
    let x = startX
    let y = startY
    let pageNo = 0
    // 목록 위치
    let listId: string | undefined
    let listIndex = 0
    // 컨트롤 최소 너비
    let controlRealWidth = 0
    for (let i = 0; i < elementList.length; i++) {
      const curRow: IRow = rowList[rowList.length - 1]
      const element = elementList[i]
      const rowMargin =
        defaultBasicRowMarginHeight * (element.rowMargin ?? defaultRowMargin)
      const metrics: IElementMetrics = {
        width: 0,
        height: 0,
        boundingBoxAscent: 0,
        boundingBoxDescent: 0
      }
      // 실제 사용 가능한 너비
      const offsetX =
        curRow.offsetX ||
        (element.listId && listStyleMap.get(element.listId)) ||
        0
      const availableWidth = innerWidth - offsetX
      // 시작 위치 좌표 오프셋 추가
      const isStartElement = curRow.elementList.length === 1
      x += isStartElement ? offsetX : 0
      y += isStartElement ? curRow.offsetY || 0 : 0
      if (
        (element.hide || element.control?.hide || element.area?.hide) &&
        !this.isDesignMode()
      ) {
        const preElement = curRow.elementList[curRow.elementList.length - 1]
        metrics.height =
          preElement?.metrics.height || this.options.defaultSize * scale
        metrics.boundingBoxAscent = preElement?.metrics.boundingBoxAscent || 0
        metrics.boundingBoxDescent = preElement?.metrics.boundingBoxDescent || 0
      } else if (
        element.type === ElementType.IMAGE ||
        element.type === ElementType.LATEX
      ) {
        // 떠있는 이미지는 데이터 계산 불필요
        if (
          element.imgDisplay === ImageDisplay.SURROUND ||
          element.imgDisplay === ImageDisplay.FLOAT_TOP ||
          element.imgDisplay === ImageDisplay.FLOAT_BOTTOM
        ) {
          metrics.width = 0
          metrics.height = 0
          metrics.boundingBoxDescent = 0
        } else {
          const elementWidth = element.width! * scale
          const elementHeight = element.height! * scale
          // 이미지가 사이즈를 초과할 때 자동 조정 (이미지 크기가 사용 가능한 너비보다 클 때)
          if (elementWidth > availableWidth) {
            const adaptiveHeight =
              (elementHeight * availableWidth) / elementWidth
            element.width = availableWidth / scale
            element.height = adaptiveHeight / scale
            metrics.width = availableWidth
            metrics.height = adaptiveHeight
            metrics.boundingBoxDescent = adaptiveHeight
          } else {
            metrics.width = elementWidth
            metrics.height = elementHeight
            metrics.boundingBoxDescent = elementHeight
          }
        }
        metrics.boundingBoxAscent = 0
      } else if (element.type === ElementType.TABLE) {
        const tdPaddingWidth = tdPadding[1] + tdPadding[3]
        const tdPaddingHeight = tdPadding[0] + tdPadding[2]
        // 테이블 페이지 분할 처리 진행도: https://github.com/Hufe921/canvas-editor/issues/41
        // 후속 테이블이 동일한 원본 테이블에 속하는지 확인 - 존재하면 병합
        if (element.pagingId) {
          let tableIndex = i + 1
          let combineCount = 0
          while (tableIndex < elementList.length) {
            const nextElement = elementList[tableIndex]
            if (nextElement.pagingId === element.pagingId) {
              const nexTrList = nextElement.trList!.filter(
                tr => !tr.pagingRepeat
              )
              element.trList!.push(...nexTrList)
              element.height! += nextElement.height!
              tableIndex++
              combineCount++
            } else {
              break
            }
          }
          if (combineCount) {
            elementList.splice(i + 1, combineCount)
          }
        }
        element.pagingIndex = element.pagingIndex ?? 0
        const trList = element.trList!
        // 계산 전에 이전 높이 제거
        for (let t = 0; t < trList.length; t++) {
          const tr = trList[t]
          tr.height = tr.minHeight || defaultTrMinHeight
          tr.minHeight = tr.height
        }
        // 테이블 행열 계산
        this.tableParticle.computeRowColInfo(element)
        // 테이블 내 요소 정보 계산
        for (let t = 0; t < trList.length; t++) {
          const tr = trList[t]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const rowList = this.computeRowList({
              innerWidth: (td.width! - tdPaddingWidth) * scale,
              elementList: td.value,
              isFromTable: true,
              isPagingMode
            })
            const rowHeight = rowList.reduce((pre, cur) => pre + cur.height, 0)
            td.rowList = rowList
            // 렌더링 시 다시 스케일 조정되므로 스케일로 인한 행 높이 변화 제거
            const curTdHeight = rowHeight / scale + tdPaddingHeight
            // 콘텐츠 높이가 현재 셀 높이보다 클 때 증가 필요
            if (td.height! < curTdHeight) {
              const extraHeight = curTdHeight - td.height!
              const changeTr = trList[t + td.rowspan - 1]
              changeTr.height += extraHeight
              changeTr.tdList.forEach(changeTd => {
                changeTd.height! += extraHeight
                if (!changeTd.realHeight) {
                  changeTd.realHeight = changeTd.height!
                } else {
                  changeTd.realHeight! += extraHeight
                }
              })
            }
            // 현재 셀의 최소 높이 및 실제 높이 (로우 스팬 포함)
            let curTdMinHeight = 0
            let curTdRealHeight = 0
            let i = 0
            while (i < td.rowspan) {
              const curTr = trList[i + t] || trList[t]
              curTdMinHeight += curTr.minHeight!
              curTdRealHeight += curTr.height!
              i++
            }
            td.realMinHeight = curTdMinHeight
            td.realHeight = curTdRealHeight
            td.mainHeight = curTdHeight
          }
        }
        // 셀 높이가 실제 콘텐츠 높이보다 클 때 감소 필요
        const reduceTrList = this.tableParticle.getTrListGroupByCol(trList)
        for (let t = 0; t < reduceTrList.length; t++) {
          const tr = reduceTrList[t]
          let reduceHeight = -1
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const curTdRealHeight = td.realHeight!
            const curTdHeight = td.mainHeight!
            const curTdMinHeight = td.realMinHeight!
            // 최대 감소 가능한 높이 가져오기
            const curReduceHeight =
              curTdHeight < curTdMinHeight
                ? curTdRealHeight - curTdMinHeight
                : curTdRealHeight - curTdHeight
            if (!~reduceHeight || curReduceHeight < reduceHeight) {
              reduceHeight = curReduceHeight
            }
          }
          if (reduceHeight > 0) {
            const changeTr = trList[t]
            changeTr.height -= reduceHeight
            changeTr.tdList.forEach(changeTd => {
              changeTd.height! -= reduceHeight
              changeTd.realHeight! -= reduceHeight
            })
          }
        }
        // 테이블 내 값을 다시 계산해야 함
        this.tableParticle.computeRowColInfo(element)
        // 테이블 높이 계산
        const tableHeight = this.tableParticle.getTableHeight(element)
        const tableWidth = this.tableParticle.getTableWidth(element)
        element.width = tableWidth
        element.height = tableHeight
        const elementWidth = tableWidth * scale
        const elementHeight = tableHeight * scale
        metrics.width = elementWidth
        metrics.height = elementHeight
        metrics.boundingBoxDescent = elementHeight
        metrics.boundingBoxAscent = -rowMargin
        // 다음 요소도 테이블이면 행 간격 제거
        if (elementList[i + 1]?.type === ElementType.TABLE) {
          metrics.boundingBoxAscent -= rowMargin
        }
        // 테이블 페이지 분할 처리 (테이블 분할)
        if (isPagingMode) {
          const height = this.getHeight()
          const marginHeight = this.getMainOuterHeight()
          let curPagePreHeight = marginHeight
          for (let r = 0; r < rowList.length; r++) {
            const row = rowList[r]
            const rowOffsetY = row.offsetY || 0
            if (
              row.height + curPagePreHeight + rowOffsetY > height ||
              rowList[r - 1]?.isPageBreak
            ) {
              curPagePreHeight = marginHeight + row.height + rowOffsetY
            } else {
              curPagePreHeight += row.height + rowOffsetY
            }
          }
          // 현재 남은 높이가 현재 테이블의 첫 번째 행(분할 가능) 높이를 수용할 수 있는지, 테이블 헤더 유형 제외
          const rowMarginHeight = rowMargin * 2 * scale
          const firstTrHeight = element.trList![0].height! * scale
          if (
            curPagePreHeight + firstTrHeight + rowMarginHeight > height ||
            (element.pagingIndex !== 0 && element.trList![0].pagingRepeat)
          ) {
            // 분할 가능한 행이 없으면 새 페이지로 전환
            curPagePreHeight = marginHeight
          }
          // 테이블 높이가 페이지 높이를 초과하면 행 잘라내기 시작
          if (curPagePreHeight + rowMarginHeight + elementHeight > height) {
            const trList = element.trList!
            // 제거해야 할 행 수 계산
            let deleteStart = 0
            let deleteCount = 0
            let preTrHeight = 0
            // 한 행 이상일 때만 분할하여 루프 방지
            if (trList.length > 1) {
              for (let r = 0; r < trList.length; r++) {
                const tr = trList[r]
                const trHeight = tr.height * scale
                if (
                  curPagePreHeight + rowMarginHeight + preTrHeight + trHeight >
                  height
                ) {
                  // 현재 행에 교차 중단이 있음 - 임시로 페이징 무시
                  const rowColCount = tr.tdList.reduce(
                    (pre, cur) => pre + cur.colspan,
                    0
                  )
                  if (element.colgroup?.length !== rowColCount) {
                    deleteCount = 0
                  }
                  break
                } else {
                  deleteStart = r + 1
                  deleteCount = trList.length - deleteStart
                  preTrHeight += trHeight
                }
              }
            }
            if (deleteCount) {
              const cloneTrList = trList.splice(deleteStart, deleteCount)
              const cloneTrHeight = cloneTrList.reduce(
                (pre, cur) => pre + cur.height,
                0
              )
              const cloneTrRealHeight = cloneTrHeight * scale
              const pagingId = element.pagingId || getUUID()
              element.pagingId = pagingId
              element.height -= cloneTrHeight
              metrics.height -= cloneTrRealHeight
              metrics.boundingBoxDescent -= cloneTrRealHeight
              // 분할된 테이블 추가
              const cloneElement = deepClone(element)
              cloneElement.pagingId = pagingId
              cloneElement.pagingIndex = element.pagingIndex! + 1
              // 페이징 반복 테이블 헤더 처리
              const repeatTrList = trList.filter(tr => tr.pagingRepeat)
              if (repeatTrList.length) {
                const cloneRepeatTrList = deepClone(repeatTrList)
                cloneRepeatTrList.forEach(tr => (tr.id = getUUID()))
                cloneTrList.unshift(...cloneRepeatTrList)
              }
              cloneElement.trList = cloneTrList
              cloneElement.id = getUUID()
              this.spliceElementList(elementList, i + 1, 0, [cloneElement])
            }
          }
          // 테이블이 페이징 처리됨 - 컨텍스트 처리 필요
          if (element.pagingId) {
            const positionContext = this.position.getPositionContext()
            if (positionContext.isTable) {
              // 커서가 위치한 테이블 인덱스 찾기 (trId로 검색)
              let newPositionContextIndex = -1
              let newPositionContextTrIndex = -1
              let tableIndex = i
              while (tableIndex < elementList.length) {
                const curElement = elementList[tableIndex]
                if (curElement.pagingId !== element.pagingId) break
                const trIndex = curElement.trList!.findIndex(
                  r => r.id === positionContext.trId
                )
                if (~trIndex) {
                  newPositionContextIndex = tableIndex
                  newPositionContextTrIndex = trIndex
                  break
                }
                tableIndex++
              }
              if (~newPositionContextIndex) {
                positionContext.index = newPositionContextIndex
                positionContext.trIndex = newPositionContextTrIndex
                this.position.setPositionContext(positionContext)
              }
            }
          }
        }
      } else if (element.type === ElementType.SEPARATOR) {
        const {
          separator: { lineWidth }
        } = this.options
        element.width = availableWidth / scale
        metrics.width = availableWidth
        metrics.height = lineWidth * scale
        metrics.boundingBoxAscent = -rowMargin
        metrics.boundingBoxDescent = -rowMargin + metrics.height
      } else if (element.type === ElementType.PAGE_BREAK) {
        element.width = availableWidth / scale
        metrics.width = availableWidth
        metrics.height = defaultSize
      } else if (
        element.type === ElementType.RADIO ||
        element.controlComponent === ControlComponent.RADIO
      ) {
        const { width, height, gap } = this.options.radio
        const elementWidth = width + gap * 2
        element.width = elementWidth
        metrics.width = elementWidth * scale
        metrics.height = height * scale
      } else if (
        element.type === ElementType.CHECKBOX ||
        element.controlComponent === ControlComponent.CHECKBOX
      ) {
        const { width, height, gap } = this.options.checkbox
        const elementWidth = width + gap * 2
        element.width = elementWidth
        metrics.width = elementWidth * scale
        metrics.height = height * scale
      } else if (element.type === ElementType.TAB) {
        metrics.width = defaultTabWidth * scale
        metrics.height = defaultSize * scale
        metrics.boundingBoxDescent = 0
        metrics.boundingBoxAscent = metrics.height
      } else if (element.type === ElementType.BLOCK) {
        if (!element.width) {
          metrics.width = availableWidth
        } else {
          const elementWidth = element.width * scale
          metrics.width = Math.min(elementWidth, availableWidth)
        }
        metrics.height = element.height! * scale
        metrics.boundingBoxDescent = metrics.height
        metrics.boundingBoxAscent = 0
      } else {
        // 상하첨자 실제 폰트 크기 설정
        const size = element.size || defaultSize
        if (
          element.type === ElementType.SUPERSCRIPT ||
          element.type === ElementType.SUBSCRIPT
        ) {
          element.actualSize = Math.ceil(size * 0.6)
        }
        metrics.height = (element.actualSize || size) * scale
        ctx.font = this.getElementFont(element)
        const fontMetrics = this.textParticle.measureText(ctx, element)
        metrics.width = fontMetrics.width * scale
        if (element.letterSpacing) {
          metrics.width += element.letterSpacing * scale
        }
        metrics.boundingBoxAscent =
          (element.value === ZERO
            ? element.size || defaultSize
            : fontMetrics.actualBoundingBoxAscent) * scale
        metrics.boundingBoxDescent =
          fontMetrics.actualBoundingBoxDescent * scale
        if (element.type === ElementType.SUPERSCRIPT) {
          metrics.boundingBoxAscent += metrics.height / 2
        } else if (element.type === ElementType.SUBSCRIPT) {
          metrics.boundingBoxDescent += metrics.height / 2
        }
      }
      const ascent =
        !element.hide &&
        ((element.imgDisplay !== ImageDisplay.INLINE &&
          element.type === ElementType.IMAGE) ||
          element.type === ElementType.LATEX)
          ? metrics.height + rowMargin
          : metrics.boundingBoxAscent + rowMargin
      const height =
        rowMargin +
        metrics.boundingBoxAscent +
        metrics.boundingBoxDescent +
        rowMargin
      const rowElement: IRowElement = Object.assign(element, {
        metrics,
        left: 0,
        style: this.getElementFont(element, scale)
      })
      // 임시로 비줄바꿈 시나리오만 고려: 컨트롤 시작 시 폭 통계, 종료 시 폭 소비 및 복원
      if (rowElement.control?.minWidth) {
        if (rowElement.controlComponent) {
          controlRealWidth += metrics.width
        }
        if (rowElement.controlComponent === ControlComponent.POSTFIX) {
          // 최소 폭 컨트롤 속성 설정 (문자 오프셋)
          this.control.setMinWidthControlInfo({
            row: curRow,
            rowElement,
            availableWidth,
            controlRealWidth
          })
          controlRealWidth = 0
        }
      }
      // 제한 폭도 초과
      const preElement = elementList[i - 1]
      let nextElement = elementList[i + 1]
      // 누적 행 폭 + 현재 요소 폭 + 레이아웃 폭 (영어 단어 전체 폭 + 뒤에 오는 단여 기호 폭)
      let curRowWidth = curRow.width + metrics.width
      if (this.options.wordBreak === WordBreak.BREAK_WORD) {
        if (
          (!preElement?.type || preElement?.type === ElementType.TEXT) &&
          (!element.type || element.type === ElementType.TEXT)
        ) {
          // 영어 단어
          const word = `${preElement?.value || ''}${element.value}`
          if (this.WORD_LIKE_REG.test(word)) {
            const { width, endElement } = this.textParticle.measureWord(
              ctx,
              elementList,
              i
            )
            // 단어 폭이 행 사용 가능 폭보다 큼, 줄바꿈 불필요
            const wordWidth = width * scale
            if (wordWidth <= availableWidth) {
              curRowWidth += wordWidth
              nextElement = endElement
            }
          }
          // 단여 기호
          const punctuationWidth = this.textParticle.measurePunctuationWidth(
            ctx,
            nextElement
          )
          curRowWidth += punctuationWidth * scale
        }
      }
      // 목록 정보
      if (element.listId) {
        if (element.listId !== listId) {
          listIndex = 0
        } else if (element.value === ZERO && !element.listWrap) {
          listIndex++
        }
      }
      listId = element.listId
      // 사방 둘러싸기로 인한 요소 오프셋 계산
      const surroundPosition = this.position.setSurroundPosition({
        pageNo,
        rowElement,
        row: curRow,
        rowElementRect: {
          x,
          y,
          height,
          width: metrics.width
        },
        availableWidth,
        surroundElementList
      })
      x = surroundPosition.x
      curRowWidth += surroundPosition.rowIncreaseWidth
      x += metrics.width
      // 강제 줄바꿈 여부
      const isForceBreak =
        element.type === ElementType.SEPARATOR ||
        element.type === ElementType.TABLE ||
        preElement?.type === ElementType.TABLE ||
        preElement?.type === ElementType.BLOCK ||
        element.type === ElementType.BLOCK ||
        preElement?.imgDisplay === ImageDisplay.INLINE ||
        element.imgDisplay === ImageDisplay.INLINE ||
        preElement?.listId !== element.listId ||
        (preElement?.areaId !== element.areaId && !element.area?.hide) ||
        (element.control?.flexDirection === FlexDirection.COLUMN &&
          (element.controlComponent === ControlComponent.CHECKBOX ||
            element.controlComponent === ControlComponent.RADIO) &&
          preElement?.controlComponent === ControlComponent.VALUE) ||
        (i !== 0 && element.value === ZERO && !element.area?.hide)
      // 너비 부족으로 인한 줄바꿈 여부
      const isWidthNotEnough = curRowWidth > availableWidth
      const isWrap = isForceBreak || isWidthNotEnough
      // 새 행 데이터 처리
      if (isWrap) {
        const row: IRow = {
          width: metrics.width,
          height,
          startIndex: i,
          elementList: [rowElement],
          ascent,
          rowIndex: curRow.rowIndex + 1,
          rowFlex: elementList[i]?.rowFlex || elementList[i + 1]?.rowFlex,
          isPageBreak: element.type === ElementType.PAGE_BREAK
        }
        // 컨트롤 들여쓰기
        if (
          rowElement.controlComponent !== ControlComponent.PREFIX &&
          rowElement.control?.indentation === ControlIndentation.VALUE_START
        ) {
          // 비접두사의 첫 번째 요소 위치를 찾음
          const preStartIndex = curRow.elementList.findIndex(
            el =>
              el.controlId === rowElement.controlId &&
              el.controlComponent !== ControlComponent.PREFIX
          )
          if (~preStartIndex) {
            const preRowPositionList = this.position.computeRowPosition({
              row: curRow,
              innerWidth: this.getInnerWidth()
            })
            const valueStartPosition = preRowPositionList[preStartIndex]
            if (valueStartPosition) {
              row.offsetX = valueStartPosition.coordinate.leftTop[0]
            }
          }
        }
        // 목록 들여쓰기
        if (element.listId) {
          row.isList = true
          row.offsetX = listStyleMap.get(element.listId!)
          row.listIndex = listIndex
        }
        // Y축 오프셋
        row.offsetY =
          !isFromTable &&
          element.area?.top &&
          element.areaId !== elementList[i - 1]?.areaId
            ? element.area.top * scale
            : 0
        rowList.push(row)
      } else {
        curRow.width += metrics.width
        // 블록 요소 앞 첫 번째 빈 행의 행 높이 감소
        if (
          i === 0 &&
          (getIsBlockElement(elementList[1]) || !!elementList[1]?.areaId)
        ) {
          curRow.height = defaultBasicRowMarginHeight
          curRow.ascent = defaultBasicRowMarginHeight
        } else if (curRow.height < height) {
          curRow.height = height
          curRow.ascent = ascent
        }
        curRow.elementList.push(rowElement)
      }
      // 행 종료 시 로직
      if (isWrap || i === elementList.length - 1) {
        // 줄 바꿈 이유: 너비 부족
        curRow.isWidthNotEnough = isWidthNotEnough && !isForceBreak
        // 양쪽 정렬, 분산 정렬
        if (
          !curRow.isSurround &&
          (preElement?.rowFlex === RowFlex.JUSTIFY ||
            (preElement?.rowFlex === RowFlex.ALIGNMENT &&
              curRow.isWidthNotEnough))
        ) {
          // 줄바꿈 문자 및 끝부 요소 간격 설정 무시
          const rowElementList =
            curRow.elementList[0]?.value === ZERO
              ? curRow.elementList.slice(1)
              : curRow.elementList
          const gap =
            (availableWidth - curRow.width) / (rowElementList.length - 1)
          for (let e = 0; e < rowElementList.length - 1; e++) {
            const el = rowElementList[e]
            el.metrics.width += gap
          }
          curRow.width = availableWidth
        }
      }
      // 좌표, 페이지 번호, 다음 행 첫 번째 요소 환요 교차 재계산
      if (isWrap) {
        x = startX
        y += curRow.height
        if (
          isPagingMode &&
          !isFromTable &&
          pageHeight &&
          (y - startY + mainOuterHeight + height > pageHeight ||
            element.type === ElementType.PAGE_BREAK)
        ) {
          y = startY
          // 여분의 사방 환요 유형 요소 삭제
          deleteSurroundElementList(surroundElementList, pageNo)
          pageNo += 1
        }
        // 다음 행의 첫 번째 요소에 환요 교차가 있는지 계산
        rowElement.left = 0
        const nextRow = rowList[rowList.length - 1]
        const surroundPosition = this.position.setSurroundPosition({
          pageNo,
          rowElement,
          row: nextRow,
          rowElementRect: {
            x,
            y,
            height,
            width: metrics.width
          },
          availableWidth,
          surroundElementList
        })
        x = surroundPosition.x
        x += metrics.width
      }
    }
    return rowList
  }

  private _computePageList(): IRow[][] {
    const pageRowList: IRow[][] = [[]]
    const {
      pageMode,
      pageNumber: { maxPageNo }
    } = this.options
    const height = this.getHeight()
    const marginHeight = this.getMainOuterHeight()
    let pageHeight = marginHeight
    let pageNo = 0
    if (pageMode === PageMode.CONTINUITY) {
      pageRowList[0] = this.rowList
      // 높이 재설정
      pageHeight += this.rowList.reduce(
        (pre, cur) => pre + cur.height + (cur.offsetY || 0),
        0
      )
      const dpr = this.getPagePixelRatio()
      const pageDom = this.pageList[0]
      const pageDomHeight = Number(pageDom.style.height.replace('px', ''))
      if (pageHeight > pageDomHeight) {
        pageDom.style.height = `${pageHeight}px`
        pageDom.height = pageHeight * dpr
      } else {
        const reduceHeight = pageHeight < height ? height : pageHeight
        pageDom.style.height = `${reduceHeight}px`
        pageDom.height = reduceHeight * dpr
      }
      this._initPageContext(this.ctxList[0])
    } else {
      for (let i = 0; i < this.rowList.length; i++) {
        const row = this.rowList[i]
        const rowOffsetY = row.offsetY || 0
        if (
          row.height + rowOffsetY + pageHeight > height ||
          this.rowList[i - 1]?.isPageBreak
        ) {
          if (Number.isInteger(maxPageNo) && pageNo >= maxPageNo!) {
            this.elementList = this.elementList.slice(0, row.startIndex)
            break
          }
          pageHeight = marginHeight + row.height + rowOffsetY
          pageRowList.push([row])
          pageNo++
        } else {
          pageHeight += row.height + rowOffsetY
          pageRowList[pageNo].push(row)
        }
      }
    }
    return pageRowList
  }

  private _drawHighlight(
    ctx: CanvasRenderingContext2D,
    payload: IDrawRowPayload
  ) {
    const { rowList, positionList, elementList } = payload
    const marginHeight = this.getDefaultBasicRowMarginHeight()
    const highlightMarginHeight = this.getHighlightMarginHeight()
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      for (let j = 0; j < curRow.elementList.length; j++) {
        const element = curRow.elementList[j]
        const preElement = curRow.elementList[j - 1]
        // 하이라이트 설정: 요소 > 컨트롤 설정
        const highlight =
          element.highlight ||
          this.control.getControlHighlight(elementList, curRow.startIndex + j)
        if (highlight) {
          // 하이라이트 요소가 연속되면 즉시 그리고 다음 요소 좌표 기록
          if (
            preElement &&
            preElement.highlight &&
            preElement.highlight !== element.highlight
          ) {
            this.highlight.render(ctx)
          }
          // 현재 요소 위치 정보 기록
          const {
            coordinate: {
              leftTop: [x, y]
            }
          } = positionList[curRow.startIndex + j]
          // 요소의 왼쪽 오프셋
          const offsetX = element.left || 0
          this.highlight.recordFillInfo(
            ctx,
            x - offsetX,
            y + marginHeight - highlightMarginHeight, // 먼저 행 마진을 빼고 하이라이트 마진을 더함
            element.metrics.width + offsetX,
            curRow.height - 2 * marginHeight + 2 * highlightMarginHeight,
            highlight
          )
        } else if (preElement?.highlight) {
          // 이전이 하이라이트 요소였지만 현재는 아니므로 즉시 그릴 필요
          this.highlight.render(ctx)
        }
      }
      this.highlight.render(ctx)
    }
  }

  public drawRow(ctx: CanvasRenderingContext2D, payload: IDrawRowPayload) {
    // 하이라이트 요소 우선 그리기
    this._drawHighlight(ctx, payload)
    // 요소, 밑줄, 취소선, 선택 영역 그리기
    const {
      scale,
      table: { tdPadding },
      group,
      lineBreak
    } = this.options
    const {
      rowList,
      pageNo,
      elementList,
      positionList,
      startIndex,
      zone,
      isDrawLineBreak = !lineBreak.disabled
    } = payload
    const isPrintMode = this.mode === EditorMode.PRINT
    const { isCrossRowCol, tableId } = this.range.getRange()
    let index = startIndex
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      // 선택 영역 그리기 기록
      const rangeRecord: IElementFillRect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
      let tableRangeElement: IElement | null = null
      for (let j = 0; j < curRow.elementList.length; j++) {
        const element = curRow.elementList[j]
        const metrics = element.metrics
        // 현재 요소 위치 정보
        const {
          ascent: offsetY,
          coordinate: {
            leftTop: [x, y]
          }
        } = positionList[curRow.startIndex + j]
        const preElement = curRow.elementList[j - 1]
        // 요소 그리기
        if (
          (element.hide || element.control?.hide || element.area?.hide) &&
          !this.isDesignMode()
        ) {
          // 컨트롤이 숨겨져 있으면 그리지 않기
          this.textParticle.complete()
        } else if (element.type === ElementType.IMAGE) {
          this.textParticle.complete()
          // 떠있는 이미지는 따로 그리기
          if (
            element.imgDisplay !== ImageDisplay.SURROUND &&
            element.imgDisplay !== ImageDisplay.FLOAT_TOP &&
            element.imgDisplay !== ImageDisplay.FLOAT_BOTTOM
          ) {
            this.imageParticle.render(ctx, element, x, y + offsetY)
          }
        } else if (element.type === ElementType.LATEX) {
          this.textParticle.complete()
          this.laTexParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.TABLE) {
          if (isCrossRowCol) {
            rangeRecord.x = x
            rangeRecord.y = y
            tableRangeElement = element
          }
          this.tableParticle.render(ctx, element, x, y)
        } else if (element.type === ElementType.HYPERLINK) {
          this.textParticle.complete()
          this.hyperlinkParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.DATE) {
          const nextElement = curRow.elementList[j + 1]
          // 이전 것 해제
          if (!preElement || preElement.dateId !== element.dateId) {
            this.textParticle.complete()
          }
          this.textParticle.record(ctx, element, x, y + offsetY)
          if (!nextElement || nextElement.dateId !== element.dateId) {
            // 수동으로 렌더링 트리거
            this.textParticle.complete()
          }
        } else if (element.type === ElementType.SUPERSCRIPT) {
          this.textParticle.complete()
          this.superscriptParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.SUBSCRIPT) {
          this.underline.render(ctx)
          this.textParticle.complete()
          this.subscriptParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.SEPARATOR) {
          this.separatorParticle.render(ctx, element, x, y)
        } else if (element.type === ElementType.PAGE_BREAK) {
          if (this.mode !== EditorMode.CLEAN && !isPrintMode) {
            this.pageBreakParticle.render(ctx, element, x, y)
          }
        } else if (
          element.type === ElementType.CHECKBOX ||
          element.controlComponent === ControlComponent.CHECKBOX
        ) {
          this.textParticle.complete()
          this.checkboxParticle.render({
            ctx,
            x,
            y: y + offsetY,
            index: j,
            row: curRow
          })
        } else if (
          element.type === ElementType.RADIO ||
          element.controlComponent === ControlComponent.RADIO
        ) {
          this.textParticle.complete()
          this.radioParticle.render({
            ctx,
            x,
            y: y + offsetY,
            index: j,
            row: curRow
          })
        } else if (element.type === ElementType.TAB) {
          this.textParticle.complete()
        } else if (
          element.rowFlex === RowFlex.ALIGNMENT ||
          element.rowFlex === RowFlex.JUSTIFY
        ) {
          // 양쪽 정렬이면, canvas가 현재 letterSpacing을 지원하지 않으므로 텍스트를 따로 그리기
          this.textParticle.record(ctx, element, x, y + offsetY)
          this.textParticle.complete()
        } else if (element.type === ElementType.BLOCK) {
          this.textParticle.complete()
          this.blockParticle.render(pageNo, element, x, y + offsetY)
        } else {
          // 현재 요소가 왼쪽 오프셋이 설정되었다면 이전 요소를 즉시 그리기
          if (element.left) {
            this.textParticle.complete()
          }
          this.textParticle.record(ctx, element, x, y + offsetY)
          // 글자 너비, 자간, 구두점이 설정된 경우 (브라우저 레이아웃이 간격을 줄이는 것을 방지) 따로 그리기
          if (
            element.width ||
            element.letterSpacing ||
            PUNCTUATION_REG.test(element.value)
          ) {
            this.textParticle.complete()
          }
        }
        // 줄바꿈 문자 그리기
        if (
          isDrawLineBreak &&
          !isPrintMode &&
          this.mode !== EditorMode.CLEAN &&
          !curRow.isWidthNotEnough &&
          j === curRow.elementList.length - 1
        ) {
          this.lineBreakParticle.render(ctx, element, x, y + curRow.height / 2)
        }
        // 테두리 그리기 (현재 컨트롤만 지원)
        if (element.control?.border) {
          // 다른 컨트롤 테두리는 즉시 그리기
          if (
            preElement?.control?.border &&
            preElement.controlId !== element.controlId
          ) {
            this.control.drawBorder(ctx)
          }
          // 현재 요소 위치 정보 기록
          const rowMargin = this.getElementRowMargin(element)
          this.control.recordBorderInfo(
            x,
            y + rowMargin,
            element.metrics.width,
            curRow.height - 2 * rowMargin
          )
        } else if (preElement?.control?.border) {
          this.control.drawBorder(ctx)
        }
        // 밑줄 기록
        if (element.underline || element.control?.underline) {
          // 아래 첨자 요소 밑줄은 따로 그리기
          if (
            preElement?.type === ElementType.SUBSCRIPT &&
            element.type !== ElementType.SUBSCRIPT
          ) {
            this.underline.render(ctx)
          }
          // 행 간격
          const rowMargin = this.getElementRowMargin(element)
          // 요소의 왼쪽 오프셋
          const offsetX = element.left || 0
          // 아래 첨자 요소 Y축 오프셋 값
          let offsetY = 0
          if (element.type === ElementType.SUBSCRIPT) {
            offsetY = this.subscriptParticle.getOffsetY(element)
          }
          // 자리 표시자는 색상 계산에 참여하지 않음
          const color = element.control?.underline
            ? this.options.underlineColor
            : element.color
          this.underline.recordFillInfo(
            ctx,
            x - offsetX,
            y + curRow.height - rowMargin + offsetY,
            metrics.width + offsetX,
            0,
            color,
            element.textDecoration?.style
          )
        } else if (preElement?.underline || preElement?.control?.underline) {
          this.underline.render(ctx)
        }
        // 취소선 기록
        if (element.strikeout) {
          // 텍스트류 요소만 취소선 지원
          if (!element.type || TEXTLIKE_ELEMENT_TYPE.includes(element.type)) {
            // 글꼴 크기가 다른 경우 즉시 그리기
            if (
              preElement &&
              ((preElement.type === ElementType.SUBSCRIPT &&
                element.type !== ElementType.SUBSCRIPT) ||
                (preElement.type === ElementType.SUPERSCRIPT &&
                  element.type !== ElementType.SUPERSCRIPT) ||
                this.getElementSize(preElement) !==
                  this.getElementSize(element))
            ) {
              this.strikeout.render(ctx)
            }
            // 기준선 텍스트 측정 정보
            const standardMetrics = this.textParticle.measureBasisWord(
              ctx,
              this.getElementFont(element)
            )
            // 텍스트 렌더링 위치 + 기준선 텍스트 아래 오프셋 - 텍스트 높이의 절반
            let adjustY =
              y +
              offsetY +
              standardMetrics.actualBoundingBoxDescent * scale -
              metrics.height / 2
            // 위아래 첨자 위치 조정
            if (element.type === ElementType.SUBSCRIPT) {
              adjustY += this.subscriptParticle.getOffsetY(element)
            } else if (element.type === ElementType.SUPERSCRIPT) {
              adjustY += this.superscriptParticle.getOffsetY(element)
            }
            this.strikeout.recordFillInfo(ctx, x, adjustY, metrics.width)
          }
        } else if (preElement?.strikeout) {
          this.strikeout.render(ctx)
        }
        // 선택 영역 기록
        const {
          zone: currentZone,
          startIndex,
          endIndex
        } = this.range.getRange()
        if (
          currentZone === zone &&
          startIndex !== endIndex &&
          startIndex <= index &&
          index <= endIndex
        ) {
          const positionContext = this.position.getPositionContext()
          // 표는 상하 문맥을 제한
          if (
            (!positionContext.isTable && !element.tdId) ||
            positionContext.tdId === element.tdId
          ) {
            // 행 끝에서 시작 - 최소 너비 그리기
            if (startIndex === index) {
              const nextElement = elementList[startIndex + 1]
              if (nextElement && nextElement.value === ZERO) {
                rangeRecord.x = x + metrics.width
                rangeRecord.y = y
                rangeRecord.height = curRow.height
                rangeRecord.width += this.options.rangeMinWidth
              }
            } else {
              let rangeWidth = metrics.width
              // 최소 선택 영역 너비
              if (rangeWidth === 0 && curRow.elementList.length === 1) {
                rangeWidth = this.options.rangeMinWidth
              }
              // 첫 번째 위치, 행 높이 기록
              if (!rangeRecord.width) {
                rangeRecord.x = x
                rangeRecord.y = y
                rangeRecord.height = curRow.height
              }
              rangeRecord.width += rangeWidth
            }
          }
        }
        // 그룹 정보 기록
        if (!group.disabled && element.groupIds) {
          this.group.recordFillInfo(element, x, y, metrics.width, curRow.height)
        }
        index++
        // 표 내 요소 그리기
        if (element.type === ElementType.TABLE && !element.hide) {
          const tdPaddingWidth = tdPadding[1] + tdPadding[3]
          for (let t = 0; t < element.trList!.length; t++) {
            const tr = element.trList![t]
            for (let d = 0; d < tr.tdList!.length; d++) {
              const td = tr.tdList[d]
              this.drawRow(ctx, {
                elementList: td.value,
                positionList: td.positionList!,
                rowList: td.rowList!,
                pageNo,
                startIndex: 0,
                innerWidth: (td.width! - tdPaddingWidth) * scale,
                zone,
                isDrawLineBreak
              })
            }
          }
        }
      }
      // 목록 스타일 그리기
      if (curRow.isList) {
        this.listParticle.drawListStyle(
          ctx,
          curRow,
          positionList[curRow.startIndex]
        )
      }
      // 텍스트, 테두리, 밑줄, 취소선 그리기
      this.textParticle.complete()
      this.control.drawBorder(ctx)
      this.underline.render(ctx)
      this.strikeout.render(ctx)
      // 주석 스타일 그리기
      this.group.render(ctx)
      // 선택 영역 그리기
      if (!isPrintMode) {
        if (rangeRecord.width && rangeRecord.height) {
          const { x, y, width, height } = rangeRecord
          this.range.render(ctx, x, y, width, height)
        }
        if (
          isCrossRowCol &&
          tableRangeElement &&
          tableRangeElement.id === tableId
        ) {
          const {
            coordinate: {
              leftTop: [x, y]
            }
          } = positionList[curRow.startIndex]
          this.tableParticle.drawRange(ctx, tableRangeElement, x, y)
        }
      }
    }
  }

  private _drawFloat(
    ctx: CanvasRenderingContext2D,
    payload: IDrawFloatPayload
  ) {
    const { scale } = this.options
    const floatPositionList = this.position.getFloatPositionList()
    const { imgDisplays, pageNo } = payload
    for (let e = 0; e < floatPositionList.length; e++) {
      const floatPosition = floatPositionList[e]
      const element = floatPosition.element
      if (
        (pageNo === floatPosition.pageNo ||
          floatPosition.zone === EditorZone.HEADER ||
          floatPosition.zone == EditorZone.FOOTER) &&
        element.imgDisplay &&
        imgDisplays.includes(element.imgDisplay) &&
        element.type === ElementType.IMAGE
      ) {
        const imgFloatPosition = element.imgFloatPosition!
        this.imageParticle.render(
          ctx,
          element,
          imgFloatPosition.x * scale,
          imgFloatPosition.y * scale
        )
      }
    }
  }

  private _clearPage(pageNo: number) {
    const ctx = this.ctxList[pageNo]
    const pageDom = this.pageList[pageNo]
    ctx.clearRect(
      0,
      0,
      Math.max(pageDom.width, this.getWidth()),
      Math.max(pageDom.height, this.getHeight())
    )
    this.blockParticle.clear()
  }

  private _drawPage(payload: IDrawPagePayload) {
    const { elementList, positionList, rowList, pageNo } = payload
    const {
      inactiveAlpha,
      pageMode,
      header,
      footer,
      pageNumber,
      lineNumber,
      pageBorder
    } = this.options
    const isPrintMode = this.mode === EditorMode.PRINT
    const innerWidth = this.getInnerWidth()
    const ctx = this.ctxList[pageNo]
    // 현재 활성 영역 판단 - 비본문 영역일 때 요소 투명도 감소
    ctx.globalAlpha = !this.zone.isMainActive() ? inactiveAlpha : 1
    this._clearPage(pageNo)
    // 배경 그리기
    this.background.render(ctx, pageNo)
    // 영역 그리기
    if (!isPrintMode) {
      this.area.render(ctx, pageNo)
    }
    // 워터마크 그리기
    if (pageMode !== PageMode.CONTINUITY && this.options.watermark.data) {
      this.waterMark.render(ctx, pageNo)
    }
    // 페이지 여백 그리기
    if (!isPrintMode) {
      this.margin.render(ctx, pageNo)
    }
    // 텍스트 아래에 위치한 요소 렌더링
    this._drawFloat(ctx, {
      pageNo,
      imgDisplays: [ImageDisplay.FLOAT_BOTTOM]
    })
    // 컨트롤 하이라이트
    if (!isPrintMode) {
      this.control.renderHighlightList(ctx, pageNo)
    }
    // 요소 렌더링
    const index = rowList[0]?.startIndex
    this.drawRow(ctx, {
      elementList,
      positionList,
      rowList,
      pageNo,
      startIndex: index,
      innerWidth,
      zone: EditorZone.MAIN
    })
    if (this.getIsPagingMode()) {
      // 머리글 그리기
      if (!header.disabled) {
        this.header.render(ctx, pageNo)
      }
      // 페이지 번호 그리기
      if (!pageNumber.disabled) {
        this.pageNumber.render(ctx, pageNo)
      }
      // 바닥글 그리기
      if (!footer.disabled) {
        this.footer.render(ctx, pageNo)
      }
    }
    // 텍스트 위에 위치한 요소 렌더링
    this._drawFloat(ctx, {
      pageNo,
      imgDisplays: [ImageDisplay.FLOAT_TOP, ImageDisplay.SURROUND]
    })
    // 검색 매치 그리기
    if (!isPrintMode && this.search.getSearchKeyword()) {
      this.search.render(ctx, pageNo)
    }
    // 빈 공간 자리표시자 그리기
    if (this.elementList.length <= 1 && !this.elementList[0]?.listId) {
      this.placeholder.render(ctx)
    }
    // 행 번호 렌더링
    if (!lineNumber.disabled) {
      this.lineNumber.render(ctx, pageNo)
    }
    // 페이지 테두리 그리기
    if (!pageBorder.disabled) {
      this.pageBorder.render(ctx)
    }
    // 서명 그리기
    this.badge.render(ctx, pageNo)
  }

  private _disconnectLazyRender() {
    this.lazyRenderIntersectionObserver?.disconnect()
  }

  private _lazyRender() {
    const positionList = this.position.getOriginalMainPositionList()
    const elementList = this.getOriginalMainElementList()
    this._disconnectLazyRender()
    this.lazyRenderIntersectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number((<HTMLCanvasElement>entry.target).dataset.index)
          this._drawPage({
            elementList,
            positionList,
            rowList: this.pageRowList[index],
            pageNo: index
          })
        }
      })
    })
    this.pageList.forEach(el => {
      this.lazyRenderIntersectionObserver!.observe(el)
    })
  }

  private _immediateRender() {
    const positionList = this.position.getOriginalMainPositionList()
    const elementList = this.getOriginalMainElementList()
    for (let i = 0; i < this.pageRowList.length; i++) {
      this._drawPage({
        elementList,
        positionList,
        rowList: this.pageRowList[i],
        pageNo: i
      })
    }
  }

  public render(payload?: IDrawOption) {
    this.renderCount++
    const { header, footer } = this.options
    const {
      isSubmitHistory = true,
      isSetCursor = true,
      isCompute = true,
      isLazy = true,
      isInit = false,
      isSourceHistory = false,
      isFirstRender = false
    } = payload || {}
    let { curIndex } = payload || {}
    const innerWidth = this.getInnerWidth()
    const isPagingMode = this.getIsPagingMode()
    // 현재 페이지 수 정보 캐시
    const oldPageSize = this.pageRowList.length
    // 문서 정보 계산
    if (isCompute) {
      // 플로팅 요소 위치 정보 지우기
      this.position.setFloatPositionList([])
      if (isPagingMode) {
        // 머리글 정보
        if (!header.disabled) {
          this.header.compute()
        }
        // 바닥글 정보
        if (!footer.disabled) {
          this.footer.compute()
        }
      }
      // 행 정보
      const margins = this.getMargins()
      const pageHeight = this.getHeight()
      const extraHeight = this.header.getExtraHeight()
      const mainOuterHeight = this.getMainOuterHeight()
      const startX = margins[3]
      const startY = margins[0] + extraHeight
      const surroundElementList = pickSurroundElementList(this.elementList)
      this.rowList = this.computeRowList({
        startX,
        startY,
        pageHeight,
        mainOuterHeight,
        isPagingMode,
        innerWidth,
        surroundElementList,
        elementList: this.elementList
      })
      // 페이지 정보
      this.pageRowList = this._computePageList()
      // 위치 정보
      this.position.computePositionList()
      // 영역 정보
      this.area.compute()
      if (this.mode !== EditorMode.PRINT) {
        // 검색 정보
        const searchKeyword = this.search.getSearchKeyword()
        if (searchKeyword) {
          this.search.compute(searchKeyword)
        }
        // 컨트롤 키워드 하이라이트
        this.control.computeHighlightList()
      }
    }
    // 커서 등 부작용 제거
    this.imageObserver.clearAll()
    this.cursor.recoveryCursor()
    // 종이 생성
    for (let i = 0; i < this.pageRowList.length; i++) {
      if (!this.pageList[i]) {
        this._createPage(i)
      }
    }
    // 여분 페이지 제거
    const curPageCount = this.pageRowList.length
    const prePageCount = this.pageList.length
    if (prePageCount > curPageCount) {
      const deleteCount = prePageCount - curPageCount
      this.ctxList.splice(curPageCount, deleteCount)
      this.pageList
        .splice(curPageCount, deleteCount)
        .forEach(page => page.remove())
    }
    // 요소 그리기
    // 연속 페이지의 높이 변화로 인해 캔버스가 빈 공간을 렌더링하므로 즉시 렌더링해야 함, 그렇지 않으면 깜박임이 나타남
    if (isLazy && isPagingMode) {
      this._lazyRender()
    } else {
      this._immediateRender()
    }
    // 커서 다시 그리기
    if (isSetCursor) {
      curIndex = this.setCursor(curIndex)
    } else if (this.range.getIsSelection()) {
      // 선택 영역이 있을 때는 이벤트를 캐치할 수 없도록 위치만 지정
      this.cursor.focus()
    }
    // 실행 취소, 다시 실행에 사용되는 기록 (첫 번째 렌더링이 아닌 콘텐츠 변경 || 커서가 첫 번째로 존재할 때)
    if (
      (isSubmitHistory && !isFirstRender) ||
      (curIndex !== undefined && this.historyManager.isStackEmpty())
    ) {
      this.submitHistory(curIndex)
    }
    // 정보 변경 콜백
    nextTick(() => {
      // 선택 영역 스타일
      this.range.setRangeStyle()
      // 팝업류 컨트롤을 다시 활성화
      if (isCompute && this.control.getActiveControl()) {
        this.control.reAwakeControl()
      }
      // 테이블 도구 다시 렌더링
      if (
        isCompute &&
        !this.isReadonly() &&
        this.position.getPositionContext().isTable
      ) {
        this.tableTool.render()
      }
      // 머리글 지시기 다시 렌더링
      if (isCompute && !this.zone.isMainActive()) {
        this.zone.drawZoneIndicator()
      }
      // 페이지 수 변경
      if (oldPageSize !== this.pageRowList.length) {
        if (this.listener.pageSizeChange) {
          this.listener.pageSizeChange(this.pageRowList.length)
        }
        if (this.eventBus.isSubscribe('pageSizeChange')) {
          this.eventBus.emit('pageSizeChange', this.pageRowList.length)
        }
      }
      // 문서 콘텐츠 변경
      if ((isSubmitHistory || isSourceHistory) && !isInit) {
        if (this.listener.contentChange) {
          this.listener.contentChange()
        }
        if (this.eventBus.isSubscribe('contentChange')) {
          this.eventBus.emit('contentChange')
        }
      }
    })
  }

  public setCursor(curIndex: number | undefined) {
    const positionContext = this.position.getPositionContext()
    const positionList = this.position.getPositionList()
    if (positionContext.isTable) {
      const { index, trIndex, tdIndex } = positionContext
      const elementList = this.getOriginalElementList()
      const tablePositionList =
        elementList[index!].trList?.[trIndex!].tdList[tdIndex!].positionList
      if (curIndex === undefined && tablePositionList) {
        curIndex = tablePositionList.length - 1
      }
      const tablePosition = tablePositionList?.[curIndex!]
      this.position.setCursorPosition(tablePosition || null)
    } else {
      this.position.setCursorPosition(
        curIndex !== undefined ? positionList[curIndex] : null
      )
    }
    // 이미지 요소로 이동하고 위치가 변경됨
    let isShowCursor = true
    if (
      curIndex !== undefined &&
      positionContext.isImage &&
      positionContext.isDirectHit
    ) {
      const elementList = this.getElementList()
      const element = elementList[curIndex]
      if (IMAGE_ELEMENT_TYPE.includes(element.type!)) {
        isShowCursor = false
        const position = this.position.getCursorPosition()
        this.previewer.updateResizer(element, position)
      }
    }
    this.cursor.drawCursor({
      isShow: isShowCursor
    })
    return curIndex
  }

  public submitHistory(curIndex: number | undefined) {
    const positionContext = this.position.getPositionContext()
    const oldElementList = getSlimCloneElementList(this.elementList)
    const oldHeaderElementList = getSlimCloneElementList(
      this.header.getElementList()
    )
    const oldFooterElementList = getSlimCloneElementList(
      this.footer.getElementList()
    )
    const oldRange = deepClone(this.range.getRange())
    const pageNo = this.pageNo
    const oldPositionContext = deepClone(positionContext)
    const zone = this.zone.getZone()
    this.historyManager.execute(() => {
      this.zone.setZone(zone)
      this.setPageNo(pageNo)
      this.position.setPositionContext(deepClone(oldPositionContext))
      this.header.setElementList(deepClone(oldHeaderElementList))
      this.footer.setElementList(deepClone(oldFooterElementList))
      this.elementList = deepClone(oldElementList)
      this.range.replaceRange(deepClone(oldRange))
      this.render({
        curIndex,
        isSubmitHistory: false,
        isSourceHistory: true
      })
    })
  }

  public destroy() {
    this.container.remove()
    this.globalEvent.removeEvent()
    this.scrollObserver.removeEvent()
    this.selectionObserver.removeEvent()
  }

  public clearSideEffect() {
    // 미리보기 도구 컬포넌트
    this.getPreviewer().clearResizer()
    // 테이블 도구 컬포넌트
    this.getTableTool().dispose()
    // 하이퍼링크 팝업
    this.getHyperlinkParticle().clearHyperlinkPopup()
    // 날짜 컨트롤
    this.getDateParticle().clearDatePicker()
  }
}
