# 데이터 조회 명령

## 사용법

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
const value = instance.command.commandName()
```

## getValue

기능: 현재 문서 정보 조회

용법:

```javascript
const {
  version: string
  data: IEditorData
  options: IEditorOption
} = instance.command.getValue(options?: IGetValueOption)
```

## getValueAsync

기능: 현재 문서 정보 조회(비동기)

용법:

```javascript
const {
  version: string
  data: IEditorData
  options: IEditorOption
} = await instance.command.getValueAsync(options?: IGetValueOption)
```

## getImage

기능: 현재 페이지 이미지 base64 문자열 조회

용법:

```javascript
const base64StringList = await instance.command.getImage(option?: IGetImageOption)
```

## getOptions

기능: 편집기 설정 조회

용법:

```javascript
const editorOption = await instance.command.getOptions()
```

## getWordCount

기능: 문서 글자 수 조회

용법:

```javascript
const wordCount = await instance.command.getWordCount()
```

## getCursorPosition

기능: 커서 위치 좌표 조회

용법:

```javascript
const range = instance.command.getCursorPosition()
```

## getRange

기능: 선택 영역 조회

용법:

```javascript
const range = instance.command.getRange()
```

## getRangeText

기능: 선택 영역 텍스트 조회

용법:

```javascript
const rangeText = instance.command.getRangeText()
```

## getRangeContext

기능: 선택 영역 컨텍스트 조회

용법:

```javascript
const rangeContext = instance.command.getRangeContext()
```

## getRangeRow

기능: 선택 영역 행 요소 목록 조회

용법:

```javascript
const rowElementList = instance.command.getRangeRow()
```

## getKeywordRangeList

기능: 키워드 선택 영역 목록 조회

용법:

```javascript
const rangeList = instance.command.getKeywordRangeList()
```

## getKeywordContext

기능: 키워드 컨텍스트 텍스트 정보 조회

용법:

```javascript
const keywordContextList = instance.command.getKeywordContext(payload: string)
```

## getRangeParagraph

기능: 선택 영역 단락 요소 목록 조회

용법:

```javascript
const paragraphElementList = instance.command.getRangeParagraph()
```

## getPaperMargin

기능: 페이지 여백 조회

용법:

```javascript
const [top: number, right: number, bottom: number, left: number] =
  instance.command.getPaperMargin()
```

## getSearchNavigateInfo

기능: 검색 내비게이션 정보 조회

용법:

```javascript
const {
  index: number;
  count: number;
} = instance.command.getSearchNavigateInfo()
```

## getCatalog

기능: 목차 조회

용법:

```javascript
const catalog = await instance.command.getCatalog()
```

## getHTML

기능: HTML 조회

용법:

```javascript
const {
  header: string
  main: string
  footer: string
} = await instance.command.getHTML()
```

## getText

기능: 텍스트 조회

용법:

```javascript
const {
  header: string
  main: string
  footer: string
} = await instance.command.getText()
```

## getLocale

기능: 현재 언어 조회

용법:

```javascript
const locale = await instance.command.getLocale()
```

## getGroupIds

기능: 모든 그룹 id 조회

용법:

```javascript
const groupIds = await instance.command.getGroupIds()
```

## getControlValue

기능: 컴트롤 값 조회

용법:

```javascript
const {
  value: string | null
  innerText: string | null
  zone: EditorZone
  elementList?: IElement[]
}[] = await instance.command.getControlValue(payload: IGetControlValueOption)
```

## getControlList

기능: 모든 컴트롤 조회

용법:

```javascript
const controlList = await instance.command.getControlList()
```

## getContainer

기능: 편집기 컨테이너 조회

용법:

```javascript
const container = await instance.command.getContainer()
```

## getTitleValue

기능: 제목 값 조회

용법:

```javascript
const {
  value: string | null
  elementList: IElement[]
  zone: EditorZone
}[] = await instance.command.getTitleValue(payload: IGetTitleValueOption)
```

## getPositionContextByEvent

기능: 마우스 이벤트로 위치 컨텍스트 정보 조회

용법:

```javascript
const {
  pageNo: number
  element: IElement | null
  rangeRect: RangeRect | null
  tableInfo: ITableInfoByEvent | null
}[] = await instance.command.getPositionContextByEvent(evt: MouseEvent, options?: IPositionContextByEventOption)
```

예시:

```javascript
instance.eventBus.on(
  'mousemove',
  debounce(evt => {
    const positionContext = instance.command.getPositionContextByEvent(evt)
    console.log(positionContext)
  }, 200)
)``
```

## getElementById

기능: id로 요소 조회

용법:

```javascript
const elementList = await instance.command.getElementById(payload: IGetElementByIdOption)
```

## getAreaValue

기능: 영역 데이터 조회
용법:

```js
const {
  id?: string
  area: IArea
  value: IElement[]
  startPageNo: number
  endPageNo: number
} = instance.command.getAreaValue(options: IGetAreaValueOption)
```
