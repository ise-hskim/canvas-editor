import { IPositionContextChangePayload } from '../../../interface/Listener'
import { Draw } from '../../draw/Draw'

export function positionContextChange(
  draw: Draw,
  payload: IPositionContextChangePayload
) {
  const { value, oldValue } = payload
  // 테이블 도구 제거
  if (oldValue.isTable && !value.isTable) {
    draw.getTableTool().dispose()
  }
}
