# 이벤트 리스너(eventBus)

## 사용법

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)

// 등록
instance.eventBus.on<K keyof EventMap>(
  eventName: K,
  callback: EventMap[K]
)

// 제거
instance.eventBus.off<K keyof EventMap>(
  eventName: K,
  callback: EventMap[K]
)
```

## rangeStyleChange

기능: 선택 영역 스타일 변경

용법:

```javascript
instance.eventBus.on('rangeStyleChange', (payload: IRangeStyle) => void)
```

## visiblePageNoListChange

기능: 보이는 페이지 변경

용법:

```javascript
instance.eventBus.on('visiblePageNoListChange', (payload: number[]) => void)
```

## intersectionPageNoChange

기능: 현재 페이지 변경

용법:

```javascript
instance.eventBus.on('intersectionPageNoChange', (payload: number) => void)
```

## pageSizeChange

기능: 현재 페이지 수 변경

용법:

```javascript
instance.eventBus.on('pageSizeChange', (payload: number) => void)
```

## pageScaleChange

기능: 현재 페이지 확대/축소 비율 변경

용법:

```javascript
instance.eventBus.on('pageScaleChange', (payload: number) => void)
```

## contentChange

기능: 현재 콘텐츠 변경

용법:

```javascript
instance.eventBus.on('contentChange', () => void)
```

## controlChange

기능: 현재 커서 위치 컴트롤 변경

용법:

```javascript
instance.eventBus.on('controlChange', (payload: IControlChangeResult) => void)
```

## controlContentChange

기능: 컴트롤 콘텐츠 변경

용법:

```javascript
instance.eventBus.on('controlContentChange', (payload: IControlContentChangeResult) => void)
```

## pageModeChange

기능: 페이지 모드 변경

용법:

```javascript
instance.eventBus.on('pageModeChange', (payload: PageMode) => void)
```

## saved

기능: 문서 저장 실행

용법:

```javascript
instance.eventBus.on('saved', (payload: IEditorResult) => void)
```

## zoneChange

기능: 영역 변경

용법:

```javascript
instance.eventBus.on('zoneChange', (payload: EditorZone) => void)
```

## mousemove

기능: 편집기 mousemove 이벤트 리스너

용법:

```javascript
instance.eventBus.on('mousemove', (evt: MouseEvent) => void)
```

## mouseenter

기능: 편집기 mouseenter 이벤트 리스너

용법:

```javascript
instance.eventBus.on('mouseenter', (evt: MouseEvent) => void)
```

## mouseleave

기능: 편집기 mouseleave 이벤트 리스너

용법:

```javascript
instance.eventBus.on('mouseleave', (evt: MouseEvent) => void)
```

## mousedown

기능: 편집기 mousedown 이벤트 리스너

용법:

```javascript
instance.eventBus.on('mousedown', (evt: MouseEvent) => void)
```

## mouseup

기능: 편집기 mouseup 이벤트 리스너

용법:

```javascript
instance.eventBus.on('mouseup', (evt: MouseEvent) => void)
```

## click

기능: 편집기 click 이벤트 리스너

용법:

```javascript
instance.eventBus.on('click', (evt: MouseEvent) => void)
```

## input

기능: 편집기 input 이벤트 리스너

용법:

```javascript
instance.eventBus.on('input', (evt: Event) => void)
```

## positionContextChange

기능: 컨텍스트 콘텐츠 변경

용법:

```javascript
instance.eventBus.on('positionContextChange', (payload: IPositionContextChangePayload) => void)
```

## imageSizeChange

기능: 이미지 크기 변경 이벤트

용법:

```javascript
instance.eventBus.on('imageSizeChange', (payload: { element: IElement }) => void)
```

## imageMousedown

기능: 이미지 mousedown 이벤트

용법:

```javascript
instance.eventBus.on('imageMousedown', (payload: {
  evt: MouseEvent
  element: IElement
}) => void)
```
