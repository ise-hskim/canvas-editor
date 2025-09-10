import { ILineNumberOption } from '../../interface/LineNumber'
import { LineNumberType } from '../enum/LineNumber'

export const defaultLineNumberOption: Readonly<Required<ILineNumberOption>> = {
  size: 12,
  font: 'Malgun Gothic',
  color: '#000000',
  disabled: true,
  right: 20,
  type: LineNumberType.CONTINUITY
}
