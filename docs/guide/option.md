# 설정

## 사용 방법

```javascript
import Editor from "@hufe921/canvas-editor"

new Editor(container, IEditorData | IElement[], {
  // 설정 항목
})
```

## 전체 설정

```typescript
interface IEditorOption {
  mode?: EditorMode // 에디터 모드：편집, 정리(시각적 보조 요소 비표시. 예: 페이지 나눔 기호), 읽기 전용, 양식(컨트롤 내에서만 편집 가능), 인쇄(보조 요소, 작성되지 않은 컨트롤 및 전후 괄호 비표시), 디자인 모드(삭제 불가, 읽기 전용 등 설정 제어 안 함). 기본값: 편집
  locale?: string // 다국어 유형. 기본값: zhCN
  defaultType?: string // 기본 요소 유형. 기본값: TEXT
  defaultColor?: string // 기본 글꼴 색상. 기본값: #000000
  defaultFont?: string // 기본 글꼴. 기본값: Microsoft YaHei
  defaultSize?: number // 기본 글자 크기. 기본값: 16
  minSize?: number // 최소 글자 크기. 기본값: 5
  maxSize?: number // 최대 글자 크기. 기본값: 72
  defaultBasicRowMarginHeight?: number // 기본 행 높이. 기본값: 8
  defaultRowMargin?: number // 기본 행 간격. 기본값: 1
  defaultTabWidth?: number // 기본 탭 너비. 기본값: 32
  width?: number // 용지 너비. 기본값: 794
  height?: number // 용지 높이. 기본값: 1123
  scale?: number // 확대/축소 비율. 기본값: 1
  pageGap?: number // 용지 간격. 기본값: 20
  underlineColor?: string // 밑줄 색상. 기본값: #000000
  strikeoutColor?: string // 취소선 색상. 기본값: #FF0000
  rangeColor?: string // 선택 영역 색상. 기본값: #AECBFA
  rangeAlpha?: number // 선택 영역 투명도. 기본값: 0.6
  rangeMinWidth?: number // 선택 영역 최소 너비. 기본값: 5
  searchMatchColor?: string // 검색 하이라이트 색상. 기본값: #FFFF00
  searchNavigateMatchColor?: string // 검색 탐색 하이라이트 색상. 기본값: #AAD280
  searchMatchAlpha?: number // 검색 하이라이트 투명도. 기본값: 0.6
  highlightAlpha?: number // 하이라이트 요소 투명도. 기본값: 0.6
  highlightMarginHeight?: number // 하이라이트 요소 여백 높이. 기본값: 8
  resizerColor?: string // 이미지 크기 조절기 색상. 기본값: #4182D9
  resizerSize?: number // 이미지 크기 조절기 크기. 기본값: 5
  marginIndicatorSize?: number // 페이지 여백 표시기 길이. 기본값: 35
  marginIndicatorColor?: string // 페이지 여백 표시기 색상. 기본값: #BABABA
  margins?: IMargin // 페이지 여백. 기본값: [100, 120, 100, 120]
  pageMode?: PageMode // 용지 모드: 연속 페이지, 개별 페이지. 기본값: 개별 페이지
  renderMode?: RenderMode // 렌더링 모드: 초고속(여러 글자 결합 렌더링), 호환(글자별 렌더링: 브라우저 글꼴 등 환경 차이 방지). 기본값: 초고속
  defaultHyperlinkColor?: string // 기본 하이퍼링크 색상. 기본값: #0000FF
  table?: ITableOption // 테이블 설정. {tdPadding?:IPadding; defaultTrMinHeight?:number; defaultColMinWidth?:number}
  header?: IHeader // 머리글 정보. {top?:number; maxHeightRadio?:MaxHeightRatio;}
  footer?: IFooter // 바닥글 정보. {bottom?:number; maxHeightRadio?:MaxHeightRatio;}
  pageNumber?: IPageNumber // 페이지 번호 정보. {bottom:number; size:number; font:string; color:string; rowFlex:RowFlex; format:string; numberType:NumberType;}
  paperDirection?: PaperDirection // 용지 방향: 세로, 가로
  inactiveAlpha?: number // 본문 콘텐츠 비활성 시 투명도. 기본값: 0.6
  historyMaxRecordCount?: number // 히스토리(실행 취소/다시 실행) 최대 기록 횟수. 기본값: 100회
  printPixelRatio?: number // 인쇄 픽셀 비율(값이 클수록 더 선명하지만 크기가 커짐). 기본값: 3
  maskMargin?: IMargin // 에디터 위의 마스크 여백(에디터 위에 떠 있는 메뉴바, 하단 도구모음 등). 기본값: [0, 0, 0, 0]
  letterClass?: string[] // 레이아웃이 지원하는 문자 클래스. 기본값: a-zA-Z. 내장 선택 가능한 문자 표 클래스: LETTER_CLASS
  contextMenuDisableKeys?: string[] // 비활성화된 우클릭 메뉴. 기본값: []
  shortcutDisableKeys?: string[] // 비활성화된 단축키. 기본값: []
  scrollContainerSelector?: string // 스크롤 영역 선택자. 기본값: document
  pageOuterSelectionDisable?: boolean // 마우스가 페이지를 떠날 때 선택 영역 비활성화. 기본값: false
  wordBreak?: WordBreak // 단어와 문장부호 줄바꿈: BREAK_WORD 첫 줄에 문장부호 나타나지 않음&단어 분할 안 함, BREAK_ALL 문자 너비에 따라 채운 후 줄바꿈. 기본값: BREAK_WORD
  watermark?: IWatermark // 워터마크 정보. {data:string; color?:string; opacity?:number; size?:number; font?:string; numberType:NumberType;}
  control?: IControlOption // 컨트롤 정보. {placeholderColor?:string; bracketColor?:string; prefix?:string; postfix?:string; borderWidth?: number; borderColor?: string; activeBackgroundColor?: string; disabledBackgroundColor?: string; existValueBackgroundColor?: string; noValueBackgroundColor?: string;}
  checkbox?: ICheckboxOption // 체크박스 정보. {width?:number; height?:number; gap?:number; lineWidth?:number; fillStyle?:string; strokeStyle?: string; verticalAlign?: VerticalAlign;}
  radio?: IRadioOption // 라디오 버튼 정보. {width?:number; height?:number; gap?:number; lineWidth?:number; fillStyle?:string; strokeStyle?: string; verticalAlign?: VerticalAlign;}
  cursor?: ICursorOption // 커서 스타일. {width?: number; color?: string; dragWidth?: number; dragColor?: string; dragFloatImageDisabled?: boolean;}
  title?: ITitleOption // 제목 설정. { defaultFirstSize?: number; defaultSecondSize?: number; defaultThirdSize?: number defaultFourthSize?: number; defaultFifthSize?: number; defaultSixthSize?: number;}
  placeholder?: IPlaceholder // 에디터 빈 공간 자리표시자 텍스트
  group?: IGroup // 그룹 설정. {opacity?:number; backgroundColor?:string; activeOpacity?:number; activeBackgroundColor?:string; disabled?:boolean; deletable?:boolean;}
  pageBreak?: IPageBreak // 페이지 나눔 기호 설정. {font?:string; fontSize?:number; lineDash?:number[];}
  zone?: IZoneOption // 에디터 영역 설정. {tipDisabled?:boolean;}
  background?: IBackgroundOption // 배경 설정. {color?:string; image?:string; size?:BackgroundSize; repeat?:BackgroundRepeat; applyPageNumbers?:number[]}. 기본값: {color: '#FFFFFF'}
  lineBreak?: ILineBreakOption // 줄바꿈 기호 설정. {disabled?:boolean; color?:string; lineWidth?:number;}
  separator?: ISeparatorOption // 구분자 설정. {lineWidth?:number; strokeStyle?:string;}
  lineNumber?: ILineNumberOption // 행 번호 설정. {size?:number; font?:string; color?:string; disabled?:boolean; right?:number}
  pageBorder?: IPageBorderOption // 페이지 테두리 설정. {color?:string; lineWidth:number; padding?:IPadding; disabled?:boolean;}
  badge?: IBadgeOption // 뱃지 설정. {top?:number; left?:number}
  modeRule?: IModeRule // 에디터 모드 규칙 설정. {print:{imagePreviewerDisabled?: boolean}; readonly:{imagePreviewerDisabled?: boolean}; form:{controlDeletableDisabled?: boolean}}
}
```

## 테이블 설정

```typescript
interface ITableOption {
  tdPadding?: IPadding // 셀 내부 여백. 기본값: [0, 5, 5, 5]
  defaultTrMinHeight?: number // 기본 테이블 행 최소 높이. 기본값: 42
  defaultColMinWidth?: number // 기본 테이블 열 최소 너비(전체 너비가 충분할 때 적용, 그렇지 않으면 비율로 축소). 기본값: 40
}
```

## 머리글 설정

```typescript
interface IHeader {
  top?: number // 페이지 상단에서의 거리. 기본값: 30
  inactiveAlpha?: number // 비활성 시 투명도. 기본값: 1
  maxHeightRadio?: MaxHeightRatio // 페이지 최대 높이 비율. 기본값: HALF
  disabled?: boolean // 비활성화 여부
  editable?: boolean // 제목 내용 편집 금지
}
```

## 페이지 푸터 설정

```typescript
interface IFooter {
  bottom?: number // 페이지 하단으로부터의 거리. 기본값: 30
  inactiveAlpha?: number // 비활성 시 투명도. 기본값: 1
  maxHeightRadio?: MaxHeightRatio // 페이지 최대 높이 비율. 기본값: HALF
  disabled?: boolean // 비활성화 여부
  editable?: boolean // 페이지 푸터 내용 편집 금지
}
```

## 페이지 번호 설정

```typescript
interface IPageNumber {
  bottom?: number // 페이지 하단으로부터의 거리. 기본값: 60
  size?: number // 글꼴 크기. 기본값: 12
  font?: string // 글꼴. 기본값: Microsoft YaHei
  color?: string // 글꼴색상. 기본값: #000000
  rowFlex?: RowFlex // 행 정렬 방식. 기본값: CENTER
  format?: string // 페이지 번호 형식. 기본값: {pageNo}. 예시: 제{pageNo}페이지/총{pageCount}페이지
  numberType?: NumberType // 숫자 타입. 기본값: ARABIC
  disabled?: boolean // 비활성화 여부
  startPageNo?: number // 시작 페이지 번호. 기본값: 1
  fromPageNo?: number // 몇 번째 페이지부터 페이지 번호가 나타나기 시작할지. 기본값: 0
  maxPageNo?: number | null // 최대 페이지 번호(0부터 시작). 기본값: null
}
```

## 워터마크 설정

```typescript
interface IWatermark {
  data: string // 텍스트
  type?: WatermarkType
  width?: number
  height?: number
  color?: string // 색상. 기본값: #AEB5C0
  opacity?: number // 투명도. 기본값: 0.3
  size?: number // 글꼴 크기. 기본값: 200
  font?: string // 글꼴. 기본값: Microsoft YaHei
  repeat?: boolean // 반복 워터마크. 기본값: false
  gap?: [horizontal: number, vertical: number] // 워터마크 간격. 기본값: [10,10]
  numberType: NumberType.ARABIC // 페이지 번호 형식. 기본값: {pageNo}. 예시: 제{pageNo}페이지/총{pageCount}페이지
}
```

## 점위 텍스트 설정

```typescript
interface IPlaceholder {
  data: string // 텍스트
  color?: string // 색상。기본값：#DCDFE6
  opacity?: number // 투명도。기본값：1
  size?: number // 글꼴 크기. 기본값: 16
  font?: string // 글꼴. 기본값: Microsoft YaHei
}
```

## 행 번호 설정

```typescript
interface ILineNumberOption {
  size?: number // 글꼴 크기. 기본값: 12
  font?: string // 글꼴. 기본값: Microsoft YaHei
  color?: string // 색상. 기본값: #000000
  disabled?: boolean // 비활성화 여부。기본값: true
  right?: number // 본문으로부터의 거리. 기본값: 20
  type?: LineNumberType // 번호 타입(페이지별 재번호 매김, 연속 번호 매김). 기본값: 연속 번호 매김
}
```

## 페이지 테두리 설정

```typescript
interface IPageBorderOption {
  color?: string // 색상. 기본값: #000000
  lineWidth?: number // 너비. 기본값: 1
  padding?: IPadding // 본문에서의 내부 여백. 기본값: [0, 5, 0, 5]
  disabled?: boolean // 비활성화 여부。기본값: true
}
```
