import { IOverrideResult } from '../../override/Override'
import { CanvasEvent } from '../CanvasEvent'
import { pasteImage } from './paste'

export function drop(evt: DragEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  // 사용자 정의 드래그 앤 드롭 이벤트
  const { drop } = draw.getOverride()
  if (drop) {
    const overrideResult = drop(evt)
    // 기본적으로 기본 이벤트 차단
    if ((<IOverrideResult>overrideResult)?.preventDefault !== false) return
  }
  evt.preventDefault()
  const data = evt.dataTransfer?.getData('text')
  if (data) {
    host.input(data)
  } else {
    const files = evt.dataTransfer?.files
    if (!files) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image')) {
        pasteImage(host, file)
      }
    }
  }
}
