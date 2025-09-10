import { CanvasEvent } from '../CanvasEvent'
import { input, removeComposingInput } from './input'

function compositionstart(host: CanvasEvent) {
  host.isComposing = true
}

function compositionend(host: CanvasEvent, evt: CompositionEvent) {
  host.isComposing = false
  // 입력창 닫기 처리
  const draw = host.getDraw()
  // 값이 존재하지 않음: 합성 입력 삭제
  if (!evt.data) {
    removeComposingInput(host)
    const rangeManager = draw.getRange()
    const { endIndex: curIndex } = rangeManager.getRange()
    draw.render({
      curIndex,
      isSubmitHistory: false
    })
  } else {
    // 값이 존재함: input 이벤트를 트리거할 수 없어 수동 감지 및 렌더링 트리거 필요
    if (host.compositionInfo) {
      input(evt.data, host)
    }
  }
  // 프록시 입력창 데이터 제거
  const cursor = draw.getCursor()
  cursor.clearAgentDomValue()
}

export default {
  compositionstart,
  compositionend
}
