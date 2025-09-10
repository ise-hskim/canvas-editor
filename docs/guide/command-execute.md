# 액션 명령 실행

## 사용 방법

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.command.commandName()
```

## executeMode

기능：에디터 모드 전환（편집, 정리, 읽기 전용, 양식）

사용법：

```javascript
instance.command.executeMode(editorMode: EditorMode)
```

## executeCut

기능：잘라내기

사용법：

```javascript
instance.command.executeCut()
```

## executeCopy

기능：복사

사용법：

```javascript
instance.command.executeCopy(payload?: ICopyOption)
```

## executePaste

기능：붙여넣기

사용법：

```javascript
instance.command.executePaste(payload?: IPasteOption)
```

## executeSelectAll

기능：전체 선택

사용법：

```javascript
instance.command.executeSelectAll()
```

## executeBackspace

기능：앞으로 삭제

사용법：

```javascript
instance.command.executeBackspace()
```

## executeSetRange

기능：선택 영역 설정

사용법：

```javascript
instance.command.executeSetRange(
  startIndex: number,
  endIndex: number,
  tableId?: string,
  startTdIndex?: number,
  endTdIndex?: number,
  startTrIndex?: number,
  endTrIndex?: number
)
```

## executeReplaceRange

기능：선택 영역 교체

사용법：

```javascript
instance.command.executeReplaceRange(range: IRange)
```

## executeSetPositionContext

기능：위치 컨텍스트 설정

사용법：

```javascript
instance.command.executeSetPositionContext(range: IRange)
```

## executeForceUpdate

기능：문서 강제 재렌더링

사용법：

```javascript
instance.command.executeForceUpdate(options?: IForceUpdateOption)
```

## executeBlur

기능：에디터 포커스 해제 설정

사용법：

```javascript
instance.command.executeBlur()
```

## executeUndo

기능：실행 취소

사용법：

```javascript
instance.command.executeUndo()
```

## executeRedo

기능：다시 실행

사용법：

```javascript
instance.command.executeRedo()
```

## executePainter

기능：서식 복사-스타일 복사

사용법：

```javascript
instance.command.executePainter()
```

## executeApplyPainterStyle

기능：서식 복사-스타일 적용

사용법：

```javascript
instance.command.executeApplyPainterStyle()
```

## executeFormat

기능：스타일 지우기

사용법：

```javascript
instance.command.executeFormat(options?: IRichtextOption)
```

## executeFont

기능：글꼴 설정

사용법：

```javascript
instance.command.executeFont(font: string, options?: IRichtextOption)
```

## executeSize

기능：글자 크기 설정

사용법：

```javascript
instance.command.executeSize(size: number, options?: IRichtextOption)
```

## executeSizeAdd

기능：글자 크기 증가

사용법：

```javascript
instance.command.executeSizeAdd(options?: IRichtextOption)
```

## executeSizeMinus

기능：글자 크기 감소

사용법：

```javascript
instance.command.executeSizeMinus(options?: IRichtextOption)
```

## executeBold

기능：글꼴 굵게

사용법：

```javascript
instance.command.executeBold(options?: IRichtextOption)
```

## executeItalic

기능：글꼴 기울임

사용법：

```javascript
instance.command.executeItalic(options?: IRichtextOption)
```

## executeUnderline

기능：밑줄

사용법：

```javascript
instance.command.executeUnderline(textDecoration?: ITextDecoration, options?: IRichtextOption)
```

## executeStrikeout

기능：취소선

사용법：

```javascript
instance.command.executeStrikeout(options?: IRichtextOption)
```

## executeSuperscript

기능：위 첨자

사용법：

```javascript
instance.command.executeSuperscript(options?: IRichtextOption)
```

## executeSubscript

기능：아래 첨자

사용법：

```javascript
instance.command.executeSubscript(options?: IRichtextOption)
```

## executeColor

기능：글꼴 색상

사용법：

```javascript
instance.command.executeColor(color: string | null, options?: IRichtextOption)
```

## executeHighlight

기능：하이라이트

사용법：

```javascript
instance.command.executeHighlight(color: string | null, options?: IRichtextOption)
```

## executeTitle

기능：제목 설정

사용법：

```javascript
instance.command.executeTitle(TitleLevel | null)
```

## executeList

기능：목록 설정

사용법：

```javascript
instance.command.executeList(listType: ListType | null, listStyle?: ListStyle)
```

## executeRowFlex

기능：행 정렬

사용법：

```javascript
instance.command.executeRowFlex(rowFlex: RowFlex)
```

## executeRowMargin

기능：행 간격

사용법：

```javascript
instance.command.executeRowMargin(rowMargin: number)
```

## executeInsertTable

기능：테이블 삽입

사용법：

```javascript
instance.command.executeInsertTable(row: number, col: number)
```

## executeInsertTableTopRow

기능：위로 한 행 삽입

사용법：

```javascript
instance.command.executeInsertTableTopRow()
```

## executeInsertTableBottomRow

기능：아래로 한 행 삽입

사용법：

```javascript
instance.command.executeInsertTableBottomRow()
```

## executeInsertTableLeftCol

기능：왼쪽으로 한 열 삽입

사용법：

```javascript
instance.command.executeInsertTableLeftCol()
```

## executeInsertTableRightCol

기능：오른쪽으로 한 열 삽입

사용법：

```javascript
instance.command.executeInsertTableRightCol()
```

## executeDeleteTableRow

기능：현재 행 삭제

사용법：

```javascript
instance.command.executeDeleteTableRow()
```

## executeDeleteTableCol

기능：현재 열 삭제

사용법：

```javascript
instance.command.executeDeleteTableCol()
```

## executeDeleteTable

기능：테이블 삭제

사용법：

```javascript
instance.command.executeDeleteTable()
```

## executeMergeTableCell

기능：테이블 병합

사용법：

```javascript
instance.command.executeMergeTableCell()
```

## executeCancelMergeTableCell

기능：테이블 병합 취소

사용법：

```javascript
instance.command.executeCancelMergeTableCell()
```

## executeSplitVerticalTableCell

기능：현재 셀 분할(수직 방향)

사용법：

```javascript
instance.command.executeSplitVerticalTableCell()
```

## executeSplitHorizontalTableCell

기능：현재 셀 분할(수평 방향)

사용법：

```javascript
instance.command.executeSplitHorizontalTableCell()
```

## executeTableTdVerticalAlign

기능：테이블 셀 수직 정렬 방식

사용법：

```javascript
instance.command.executeTableTdVerticalAlign(payload: VerticalAlign)
```

## executeTableBorderType

기능：테이블 테두리 유형

사용법：

```javascript
instance.command.executeTableBorderType(payload: TableBorder)
```

## executeTableBorderColor

기능：테이블 테두리 색상

사용법：

```javascript
instance.command.executeTableBorderColor(payload: string)
```

## executeTableTdBorderType

기능：테이블 셀 테두리 유형

사용법：

```javascript
instance.command.executeTableTdBorderType(payload: TdBorder)
```

## executeTableTdSlashType

기능：테이블 셀 내 대각선

사용법：

```javascript
instance.command.executeTableTdSlashType(payload: TdSlash)
```

## executeTableTdBackgroundColor

기능：테이블 셀 배경색

사용법：

```javascript
instance.command.executeTableTdBackgroundColor(payload: string)
```

## executeTableSelectAll

기능：전체 테이블 선택

사용법：

```javascript
instance.command.executeTableSelectAll()
```

## executeImage

기능：이미지 삽입

사용법：

```javascript
instance.command.executeImage({
  id?: string;
  width: number;
  height: number;
  value: string;
  imgDisplay?: ImageDisplay;
})
```

## executeHyperlink

기능：링크 삽입

사용법：

```javascript
instance.command.executeHyperlink({
  type: ElementType.HYPERLINK,
  value: string,
  url: string,
  valueList: IElement[]
})
```

## executeDeleteHyperlink

기능：링크 삭제

사용법：

```javascript
instance.command.executeDeleteHyperlink()
```

## executeCancelHyperlink

기능：링크 취소

사용법：

```javascript
instance.command.executeCancelHyperlink()
```

## executeEditHyperlink

기능：링크 편집

사용법：

```javascript
instance.command.executeEditHyperlink(newUrl: string)
```

## executeSeparator

기능：구분선 삽입

사용법：

```javascript
instance.command.executeSeparator(dashArray: number[])
```

## executePageBreak

기능：페이지 나누기

사용법：

```javascript
instance.command.executePageBreak()
```

## executeAddWatermark

기능：워터마크 추가

사용법：

```javascript
instance.command.executeAddWatermark({
  data: string;
  color?: string;
  opacity?: number;
  size?: number;
  font?: string;
})
```

## executeDeleteWatermark

기능：워터마크 삭제

사용법：

```javascript
instance.command.executeDeleteWatermark()
```

## executeSearch

기능：검색

사용법：

```javascript
instance.command.executeSearch(keyword: string)
```

## executeSearchNavigatePre

기능：검색 탐색-이전

사용법：

```javascript
instance.command.executeSearchNavigatePre()
```

## executeSearchNavigateNext

기능：검색 탐색-다음

사용법：

```javascript
instance.command.executeSearchNavigateNext()
```

## executeReplace

기능：검색 바꾸기

사용법：

```javascript
instance.command.executeReplace(newWord: string, option?: IReplaceOption)
```

## executePrint

기능：인쇄

사용법：

```javascript
instance.command.executePrint()
```

## executeReplaceImageElement

기능：이미지 교체

사용법：

```javascript
instance.command.executeReplaceImageElement(newUrl: string)
```

## executeSaveAsImageElement

기능：이미지로 다른 이름으로 저장

사용법：

```javascript
instance.command.executeSaveAsImageElement()
```

## executeChangeImageDisplay

기능：이미지 행 표시 방식 변경

사용법：

```javascript
instance.command.executeChangeImageDisplay(element: IElement, display: ImageDisplay)
```

## executePageMode

기능：페이지 모드

사용법：

```javascript
instance.command.executePageMode(pageMode: PageMode)
```

## executePageScale

기능：확대/축소 비율 설정

사용법：

```javascript
instance.command.executePageScale(scale: number)
```

## executePageScaleRecovery

기능：페이지 원본 확대/축소 비율 복원

사용법：

```javascript
instance.command.executePageScaleRecovery()
```

## executePageScaleMinus

기능：페이지 축소

사용법：

```javascript
instance.command.executePageScaleMinus()
```

## executePageScaleAdd

기능：페이지 확대

사용법：

```javascript
instance.command.executePageScaleAdd()
```

## executePaperSize

기능：용지 크기 설정

사용법：

```javascript
instance.command.executePaperSize(width: number, height: number)
```

## executePaperDirection

기능：용지 방향 설정

사용법：

```javascript
instance.command.executePaperDirection(paperDirection: PaperDirection)
```

## executeSetPaperMargin

기능：용지 여백 설정

사용법：

```javascript
instance.command.executeSetPaperMargin([top: number, right: number, bottom: number, left: number])
```

## executeSetMainBadge

기능：본문 뱃지 설정

사용법：

```javascript
instance.command.executeSetMainBadge(payload: IBadge | null)
```

## executeSetAreaBadge

기능：영역 뱃지 설정

사용법：

```javascript
instance.command.executeSetAreaBadge(payload: IAreaBadge[])
```

## executeInsertElementList

기능：요소 삽입

사용법：

```javascript
instance.command.executeInsertElementList(elementList: IElement[], options?: IInsertElementListOption)
```

## executeAppendElementList

기능：요소 추가

사용법：

```javascript
instance.command.executeAppendElementList(elementList: IElement[], options?: IAppendElementListOption)
```

## executeUpdateElementById

기능：ID로 요소 속성 수정

사용법：

```javascript
instance.command.executeUpdateElementById(payload: IUpdateElementByIdOption)
```

## executeDeleteElementById

기능：ID로 요소 삭제

사용법：

```javascript
instance.command.executeDeleteElementById(payload: IDeleteElementByIdOption)
```

## executeSetValue

기능：에디터 데이터 설정

사용법：

```javascript
instance.command.executeSetValue(payload: Partial<IEditorData>, options?: ISetValueOption)
```

## executeRemoveControl

기능：컨트롤 삭제

사용법：

```javascript
instance.command.executeRemoveControl(payload?: IRemoveControlOption)
```

## executeSetLocale

기능：로컬 언어 설정

사용법：

```javascript
instance.command.executeSetLocale(locale: string)
```

## executeLocationCatalog

기능：디렉토리 위치 찾기

사용법：

```javascript
instance.command.executeLocationCatalog(titleId: string)
```

## executeWordTool

기능：텍스트 도구(빈 줄 삭제, 줄 첫 공백)

사용법：

```javascript
instance.command.executeWordTool()
```

## executeSetHTML

기능：에디터 HTML 데이터 설정

사용법：

```javascript
instance.command.executeSetHTML(payload: Partial<IEditorHTML)
```

## executeSetGroup

기능：그룹 설정

사용법：

```javascript
instance.command.executeSetGroup()
```

## executeDeleteGroup

기능：그룹 삭제

사용법：

```javascript
instance.command.executeDeleteGroup(groupId: string)
```

## executeLocationGroup

기능：그룹 위치 찾기

사용법：

```javascript
instance.command.executeLocationGroup(groupId: string)
```

## executeSetZone

기능：활성 영역 설정(머리글, 본문, 바닥글)

사용법：

```javascript
instance.command.executeSetZone(zone: EditorZone)
```

## executeSetControlValue

기능：컨트롤 값 설정

사용법：

```javascript
instance.command.executeSetControlValue(payload: ISetControlValueOption)
```

## executeSetControlValueList

기능：컨트롤 값 일괄 설정

사용법：

```javascript
instance.command.executeSetControlValueList(payload: ISetControlValueOption[])
```

## executeSetControlExtension

기능：컨트롤 확장 값 설정

사용법：

```javascript
instance.command.executeSetControlExtension(payload: ISetControlExtensionOption)
```

## executeSetControlExtensionList

기능：컨트롤 확장 값 일괄 설정

사용법：

```javascript
instance.command.executeSetControlExtensionList(payload: ISetControlExtensionOption[])
```

## executeSetControlProperties

기능：컨트롤 속성 설정

사용법：

```javascript
instance.command.executeSetControlProperties(payload: ISetControlProperties)
```

## executeSetControlPropertiesList

기능：컨트롤 속성 일괄 설정

사용법：

```javascript
instance.command.executeSetControlPropertiesList(payload: ISetControlProperties[])
```

## executeSetControlHighlight

기능：컨트롤 하이라이트 설정(키워드 기반)

사용법：

```javascript
instance.command.executeSetControlHighlight(payload: ISetControlHighlightOption)
```

## executeLocationControl

기능：컨트롤 위치 찾기 및 활성화

사용법：

```javascript
instance.command.executeLocationControl(controlId: string, options?: ILocationControlOption)
```

## executeInsertControl

기능：컨트롤 삽입

사용법：

```javascript
instance.command.executeInsertControl(payload: IElement)
```

## executeUpdateOptions

기능：설정 수정

사용법：

```javascript
instance.command.executeUpdateOptions(payload: IUpdateOption)
```

## executeInsertTitle

기능：제목 삽입

사용법：

```javascript
instance.command.executeInsertTitle(payload: IElement)
```

## executeFocus

기능：커서 포커스

사용법：

```javascript
instance.command.executeFocus(payload?: IFocusOption)
```

## executeInsertArea

기능： 영역 삽입

```js
const areaId = instance.command.executeInsertArea(payload: IInsertAreaOption)
```

## executeSetAreaProperties

기능：영역 속성 설정

```js
instance.command.executeSetAreaProperties(payload: ISetAreaPropertiesOption)
```

## executeSetAreaValue

기능：영역 값 설정

```js
instance.command.executeSetAreaValue(payload: ISetAreaValueOption)
```

## executeLocationArea

기능：영역 위치 찾기

```js
instance.command.executeLocationArea(areaId: string, options?: ILocationAreaOption)
```
