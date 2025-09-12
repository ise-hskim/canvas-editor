/**
 * HWPX to Canvas Editor Converter
 * 
 * 사용법:
 * ```typescript
 * import { HWPXToCanvasConverter } from './converters/hwpx-to-canvas'
 * 
 * const converter = new HWPXToCanvasConverter({
 *   preserveStyles: true,
 *   defaultFont: '바탕'
 * })
 * 
 * const result = await converter.convert(hwpxJson)
 * if (result.success) {
 *   console.log(result.data)
 * }
 * ```
 */

export { HWPXToCanvasConverter } from './HWPXToCanvasConverter'
export * from './types'
export * from './mappings'