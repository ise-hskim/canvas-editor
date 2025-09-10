import { ICatalog, ICatalogItem } from '../../../interface/Catalog'
import { IElement, IElementPosition } from '../../../interface/Element'

interface IGetCatalogPayload {
  elementList: IElement[]
  positionList: IElementPosition[]
}

type ICatalogElement = IElement & {
  pageNo: number
}

enum ElementType {
  TEXT = 'text',
  IMAGE = 'image',
  TABLE = 'table',
  HYPERLINK = 'hyperlink',
  SUPERSCRIPT = 'superscript',
  SUBSCRIPT = 'subscript',
  SEPARATOR = 'separator',
  PAGE_BREAK = 'pageBreak',
  CONTROL = 'control',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  LATEX = 'latex',
  TAB = 'tab',
  DATE = 'date',
  BLOCK = 'block',
  TITLE = 'title',
  AREA = 'area',
  LIST = 'list'
}

enum TitleLevel {
  FIRST = 'first',
  SECOND = 'second',
  THIRD = 'third',
  FOURTH = 'fourth',
  FIFTH = 'fifth',
  SIXTH = 'sixth'
}

const titleOrderNumberMapping: Record<TitleLevel, number> = {
  [TitleLevel.FIRST]: 1,
  [TitleLevel.SECOND]: 2,
  [TitleLevel.THIRD]: 3,
  [TitleLevel.FOURTH]: 4,
  [TitleLevel.FIFTH]: 5,
  [TitleLevel.SIXTH]: 6
}

const TEXTLIKE_ELEMENT_TYPE: ElementType[] = [
  ElementType.TEXT,
  ElementType.HYPERLINK,
  ElementType.SUBSCRIPT,
  ElementType.SUPERSCRIPT,
  ElementType.CONTROL,
  ElementType.DATE
]

const ZERO = '\u200B'

function isTextLikeElement(element: IElement): boolean {
  return !element.type || TEXTLIKE_ELEMENT_TYPE.includes(element.type)
}

function getCatalog(payload: IGetCatalogPayload): ICatalog | null {
  const { elementList, positionList } = payload
  // 제목 필터링
  const titleElementList: ICatalogElement[] = []
  let t = 0
  while (t < elementList.length) {
    const element = elementList[t]
    const getElementInfo = (
      element: IElement,
      elementList: IElement[],
      position: number
    ) => {
      const titleId = element.titleId
      const level = element.level
      const titleElement: ICatalogElement = {
        type: ElementType.TITLE,
        value: '',
        level,
        titleId,
        pageNo: positionList[t].pageNo
      }
      const valueList: IElement[] = []
      while (position < elementList.length) {
        const titleE = elementList[position]
        if (titleId !== titleE.titleId) {
          position--
          break
        }
        valueList.push(titleE)
        position++
      }
      titleElement.value = valueList
        .filter(el => isTextLikeElement(el))
        .map(el => el.value)
        .join('')
        .replace(new RegExp(ZERO, 'g'), '')
      return { position, titleElement }
    }
    if (element.titleId) {
      const { position, titleElement } = getElementInfo(element, elementList, t)
      t = position
      titleElementList.push(titleElement)
    }
    if (element.type === ElementType.TABLE) {
      const trList = element.trList!
      for (let r = 0; r < trList.length; r++) {
        const tr = trList[r]
        for (let d = 0; d < tr.tdList.length; d++) {
          const td = tr.tdList[d]
          const value = td.value
          if (value.length > 1) {
            let index = 1
            while (index < value.length) {
              if (value[index]?.titleId) {
                const { titleElement, position } = getElementInfo(
                  value[index],
                  value,
                  index
                )
                titleElementList.push(titleElement)
                index = position
              }
              index++
            }
          }
        }
      }
    }
    t++
  }
  if (!titleElementList.length) return null
  // 최신 요소보다 큰 제목을 찾았을 때 종료
  const recursiveInsert = (
    title: ICatalogElement,
    catalogItem: ICatalogItem
  ) => {
    const subCatalogItem =
      catalogItem.subCatalog[catalogItem.subCatalog.length - 1]
    const catalogItemLevel = titleOrderNumberMapping[subCatalogItem?.level]
    const titleLevel = titleOrderNumberMapping[title.level!]
    if (subCatalogItem && titleLevel > catalogItemLevel) {
      recursiveInsert(title, subCatalogItem)
    } else {
      catalogItem.subCatalog.push({
        id: title.titleId!,
        name: title.value,
        level: title.level!,
        pageNo: title.pageNo,
        subCatalog: []
      })
    }
  }
  // 제목 그룹 루프
  // 현재 목록 레벨이 제목 그룹의 최신 제목 레벨보다 작으면: 재귀로 최소 레벨을 찾고 추가
  // 크면: 현재 제목 그룹에 직접 추가
  const catalog: ICatalog = []
  for (let e = 0; e < titleElementList.length; e++) {
    const title = titleElementList[e]
    const catalogItem = catalog[catalog.length - 1]
    const catalogItemLevel = titleOrderNumberMapping[catalogItem?.level]
    const titleLevel = titleOrderNumberMapping[title.level!]
    if (catalogItem && titleLevel > catalogItemLevel) {
      recursiveInsert(title, catalogItem)
    } else {
      catalog.push({
        id: title.titleId!,
        name: title.value,
        level: title.level!,
        pageNo: title.pageNo,
        subCatalog: []
      })
    }
  }
  return catalog
}

onmessage = evt => {
  const payload = <IGetCatalogPayload>evt.data
  const catalog = getCatalog(payload)
  postMessage(catalog)
}
