import { ZERO } from '../../../dataset/constant/Common'
import { TEXTLIKE_ELEMENT_TYPE } from '../../../dataset/constant/Element'
import { NUMBER_LIKE_REG } from '../../../dataset/constant/Regular'
import { ElementType } from '../../../dataset/enum/Element'
import { IRange } from '../../../interface/Range'
import { CanvasEvent } from '../CanvasEvent'

// 분절기를 통해 단어가 위치한 선택 영역 얻기
function getWordRangeBySegmenter(host: CanvasEvent): IRange | null {
  if (!Intl.Segmenter) return null
  const draw = host.getDraw()
  const cursorPosition = draw.getPosition().getCursorPosition()
  if (!cursorPosition) return null
  const rangeManager = draw.getRange()
  const paragraphInfo = rangeManager.getRangeParagraphInfo()
  if (!paragraphInfo) return null
  // 단락 텍스트 조립
  const paragraphText =
    paragraphInfo?.elementList
      ?.map(e =>
        !e.type ||
        (e.type !== ElementType.CONTROL &&
          TEXTLIKE_ELEMENT_TYPE.includes(e.type))
          ? e.value
          : ZERO
      )
      .join('') || ''
  if (!paragraphText) return null
  // 커서 위치
  const cursorStartIndex = cursorPosition.index
  // 단락 첫 번째 문자의 문서 시작 위치 대비 상대 위치
  const offset = paragraphInfo.startIndex
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' })
  const segments = segmenter.segment(paragraphText)
  // 새로운 커서 위치
  let startIndex = -1
  let endIndex = -1
  for (const { segment, index, isWordLike } of segments) {
    const realSegmentStartIndex = index + offset
    if (
      isWordLike &&
      cursorStartIndex >= realSegmentStartIndex &&
      cursorStartIndex < realSegmentStartIndex + segment.length
    ) {
      startIndex = realSegmentStartIndex - 1
      endIndex = startIndex + segment.length
      break
    }
  }
  return ~startIndex && ~endIndex ? { startIndex, endIndex } : null
}

// 커서 위치를 통해 단어가 위치한 선택 영역 얻기
function getWordRangeByCursor(host: CanvasEvent): IRange | null {
  const draw = host.getDraw()
  const cursorPosition = draw.getPosition().getCursorPosition()
  if (!cursorPosition) return null
  const { value, index } = cursorPosition
  // 숫자 또는 영문인지 판단
  const LETTER_REG = draw.getLetterReg()
  let upCount = 0
  let downCount = 0
  const isNumber = NUMBER_LIKE_REG.test(value)
  if (isNumber || LETTER_REG.test(value)) {
    const elementList = draw.getElementList()
    // 위로 검색
    let upStartIndex = index - 1
    while (upStartIndex > 0) {
      const value = elementList[upStartIndex].value
      if (
        (isNumber && NUMBER_LIKE_REG.test(value)) ||
        (!isNumber && LETTER_REG.test(value))
      ) {
        upCount++
        upStartIndex--
      } else {
        break
      }
    }
    // 아래로 검색
    let downStartIndex = index + 1
    while (downStartIndex < elementList.length) {
      const value = elementList[downStartIndex].value
      if (
        (isNumber && NUMBER_LIKE_REG.test(value)) ||
        (!isNumber && LETTER_REG.test(value))
      ) {
        downCount++
        downStartIndex++
      } else {
        break
      }
    }
  }
  // 새로운 커서 위치
  const startIndex = index - upCount - 1
  if (startIndex < 0) return null
  return {
    startIndex,
    endIndex: index + downCount
  }
}

function dblclick(host: CanvasEvent, evt: MouseEvent) {
  const draw = host.getDraw()
  const position = draw.getPosition()
  const positionContext = position.getPositionByXY({
    x: evt.offsetX,
    y: evt.offsetY
  })
  // 이미지 미리보기
  if (positionContext.isImage && positionContext.isDirectHit) {
    draw.getPreviewer().render()
    return
  }
  // 영역 전환
  if (draw.getIsPagingMode()) {
    if (!~positionContext.index && positionContext.zone) {
      draw.getZone().setZone(positionContext.zone)
      draw.clearSideEffect()
      position.setPositionContext({
        isTable: false
      })
      return
    }
  }
  // 체크박스/라디오 버튼 더블클릭 시 선택 상태 전환, 확장 선택 비활성화
  if (
    (positionContext.isCheckbox || positionContext.isRadio) &&
    positionContext.isDirectHit
  ) {
    return
  }
  // 자동 텍스트 확장 선택 - 분절 처리, 분절기를 우선 사용하지 않으면 커서 위치 사용으로 다운그레이드
  const rangeManager = draw.getRange()
  const segmenterRange =
    getWordRangeBySegmenter(host) || getWordRangeByCursor(host)
  if (!segmenterRange) return
  rangeManager.setRange(segmenterRange.startIndex, segmenterRange.endIndex)
  // 문서 새로고침
  draw.render({
    isSubmitHistory: false,
    isSetCursor: false,
    isCompute: false
  })
  // 선택 영역 업데이트
  rangeManager.setRangeStyle()
}

function threeClick(host: CanvasEvent) {
  const draw = host.getDraw()
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const { index } = cursorPosition
  const elementList = draw.getElementList()
  // 영너비 문자인지 판단
  let upCount = 0
  let downCount = 0
  // 위로 검색
  let upStartIndex = index - 1
  while (upStartIndex > 0) {
    const element = elementList[upStartIndex]
    const preElement = elementList[upStartIndex - 1]
    if (
      (element.value === ZERO && !element.listWrap) ||
      element.listId !== preElement?.listId ||
      element.titleId !== preElement?.titleId
    ) {
      break
    }
    upCount++
    upStartIndex--
  }
  // 아래로 검색
  let downStartIndex = index + 1
  while (downStartIndex < elementList.length) {
    const element = elementList[downStartIndex]
    const nextElement = elementList[downStartIndex + 1]
    if (
      (element.value === ZERO && !element.listWrap) ||
      element.listId !== nextElement?.listId ||
      element.titleId !== nextElement?.titleId
    ) {
      break
    }
    downCount++
    downStartIndex++
  }
  // 선택 영역 설정 - 단락 시작/끝 개행 문자 선택 안 함
  const rangeManager = draw.getRange()
  let newStartIndex = index - upCount - 1
  if (elementList[newStartIndex]?.value !== ZERO) {
    newStartIndex -= 1
  }
  if (newStartIndex < 0) return
  let newEndIndex = index + downCount + 1
  if (
    elementList[newEndIndex]?.value === ZERO ||
    newEndIndex > elementList.length - 1
  ) {
    newEndIndex -= 1
  }
  rangeManager.setRange(newStartIndex, newEndIndex)
  // 문서 새로고침
  draw.render({
    isSubmitHistory: false,
    isSetCursor: false,
    isCompute: false
  })
}

export default {
  dblclick,
  threeClick
}
