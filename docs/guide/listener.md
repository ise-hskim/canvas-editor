# 이벤트 리스너(listener)

::: warning
listener는 하나의 메서드만 응답할 수 있으며, 향후 새로운 리스너 메서드를 추가하지 않습니다. 이벤트 리스늤에는 eventBus를 사용하는 것을 강력히 방법니다.
:::

## 사용 방법

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.listener.eventName = ()=>{}
```

## rangeStyleChange

기능: 선택 영역 스타일 변경

사용법:

```javascript
instance.listener.rangeStyleChange = (payload: IRangeStyle) => {}
```

## visiblePageNoListChange

기능: 표시되는 페이지 변경

사용법:

```javascript
instance.listener.visiblePageNoListChange = (payload: number[]) => {}
```

## intersectionPageNoChange

기능: 현재 페이지 변경

사용법:

```javascript
instance.listener.intersectionPageNoChange = (payload: number) => {}
```

## pageSizeChange

기능: 현재 페이지 수 변경

사용법:

```javascript
instance.listener.pageSizeChange = (payload: number) => {}
```

## pageScaleChange

기능: 현재 페이지 확대/축소 비율 변경

사용법:

```javascript
instance.listener.pageScaleChange = (payload: number) => {}
```

## contentChange

기능: 현재 콘텐츠 변경

사용법:

```javascript
instance.listener.contentChange = () => {}
```

## controlChange

기능: 현재 커서가 위치한 컨트롤 변경

사용법:

```javascript
instance.listener.controlChange = (payload: IControlChangeResult) => {}
```

## controlContentChange

기능: 컨트롤 콘텐츠 변경

사용법:

```javascript
instance.listener.controlContentChange = (
  payload: IControlContentChangeResult
) => {}
```

## pageModeChange

기능: 페이지 모드 변경

사용법:

```javascript
instance.listener.pageModeChange = (payload: PageMode) => {}
```

## saved

기능: 문서 저장 실행

사용법:

```javascript
instance.listener.saved = (payload: IEditorResult) => {}
```

## zoneChange

기능: 영역 변경

사용법:

```javascript
instance.listener.zoneChange = (payload: EditorZone) => {}
```
