# Canvas Editor JSON 구조 완벽 가이드

## 목차
1. [최상위 구조](#최상위-구조)
2. [Element 인터페이스](#element-인터페이스)
3. [Element Types](#element-types)
4. [표(Table) 구조](#표table-구조)
5. [컨트롤(Control) 구조](#컨트롤control-구조)
6. [기타 특수 요소](#기타-특수-요소)
7. [Editor Options](#editor-options)
8. [사용 예시](#사용-예시)

## 최상위 구조

Canvas Editor의 JSON 구조는 `IEditorResult` 인터페이스를 따릅니다:

```typescript
interface IEditorResult {
  version: string        // 에디터 버전
  data: IEditorData      // 문서 데이터
  options: IEditorOption // 에디터 옵션
}

interface IEditorData {
  header?: IElement[]    // 머리글 요소들
  main: IElement[]       // 본문 요소들 (필수)
  footer?: IElement[]    // 바닥글 요소들
}
```

## Element 인터페이스

모든 콘텐츠는 `IElement` 인터페이스를 구현합니다. 이는 여러 인터페이스의 조합입니다:

```typescript
type IElement = IElementBasic &
  IElementStyle &
  IElementRule &
  IElementGroup &
  ITable &
  IHyperlinkElement &
  ISuperscriptSubscript &
  ISeparator &
  IControlElement &
  ICheckboxElement &
  IRadioElement &
  ILaTexElement &
  IDateElement &
  IImageElement &
  IBlockElement &
  ITitleElement &
  IListElement &
  IAreaElement
```

### IElementBasic (기본 속성)
```typescript
interface IElementBasic {
  id?: string              // 요소 고유 ID
  type?: ElementType       // 요소 타입 (enum)
  value: string            // 요소 값 (필수)
  extension?: unknown      // 확장 데이터
  externalId?: string      // 외부 시스템 ID
}
```

### IElementStyle (스타일 속성)
```typescript
interface IElementStyle {
  font?: string            // 폰트 패밀리
  size?: number            // 폰트 크기
  width?: number           // 요소 너비
  height?: number          // 요소 높이
  bold?: boolean           // 굵게
  color?: string           // 텍스트 색상 (#RRGGBB)
  highlight?: string       // 배경 강조색 (#RRGGBB)
  italic?: boolean         // 기울임
  underline?: boolean      // 밑줄
  strikeout?: boolean      // 취소선
  rowFlex?: RowFlex        // 정렬 (left, center, right, alignment, justify)
  rowMargin?: number       // 줄 간격
  letterSpacing?: number   // 자간
  textDecoration?: ITextDecoration  // 텍스트 장식
}

interface ITextDecoration {
  style?: TextDecorationStyle  // solid, double, dashed, dotted, wavy
}
```

### IElementRule (규칙 속성)
```typescript
interface IElementRule {
  hide?: boolean           // 요소 숨김 여부
}
```

### IElementGroup (그룹 속성)
```typescript
interface IElementGroup {
  groupIds?: string[]      // 소속 그룹 ID들
}
```

## Element Types

`ElementType` enum 정의:

```typescript
enum ElementType {
  TEXT = 'text',           // 일반 텍스트
  IMAGE = 'image',         // 이미지
  TABLE = 'table',         // 표
  HYPERLINK = 'hyperlink', // 하이퍼링크
  SUPERSCRIPT = 'superscript',  // 위 첨자
  SUBSCRIPT = 'subscript',       // 아래 첨자
  SEPARATOR = 'separator',       // 구분선
  PAGE_BREAK = 'pageBreak',      // 페이지 나누기
  CONTROL = 'control',           // 컨트롤 (입력 필드)
  AREA = 'area',                 // 영역
  CHECKBOX = 'checkbox',         // 체크박스
  RADIO = 'radio',               // 라디오 버튼
  LATEX = 'latex',               // LaTeX 수식
  TAB = 'tab',                   // 탭
  DATE = 'date',                 // 날짜
  BLOCK = 'block',               // 블록
  TITLE = 'title',               // 제목
  LIST = 'list'                  // 목록
}
```

## 표(Table) 구조

### ITable (표 속성)
```typescript
type ITable = ITableAttr & ITableRule & ITableElement

interface ITableAttr {
  colgroup?: IColgroup[]        // 열 그룹 정의
  trList?: ITr[]                 // 행 리스트
  borderType?: TableBorder      // 테두리 타입
  borderColor?: string           // 테두리 색상
  borderWidth?: number           // 테두리 두께
  borderExternalWidth?: number   // 외부 테두리 두께
}

interface ITableRule {
  tableToolDisabled?: boolean    // 표 도구 비활성화
}

interface ITableElement {
  tdId?: string                  // 셀 ID
  trId?: string                  // 행 ID
  tableId?: string               // 표 ID
  conceptId?: string             // 개념 ID
  pagingId?: string              // 페이징 ID
  pagingIndex?: number           // 페이징 인덱스
}
```

### IColgroup (열 그룹)
```typescript
interface IColgroup {
  id?: string
  width: number                  // 열 너비
}
```

### ITr (표 행)
```typescript
interface ITr {
  id?: string
  extension?: unknown
  externalId?: string
  height: number                 // 행 높이
  tdList: ITd[]                  // 셀 리스트
  minHeight?: number             // 최소 높이
  pagingRepeat?: boolean         // 페이지마다 반복 (제목 행)
}
```

### ITd (표 셀)
```typescript
interface ITd {
  conceptId?: string
  id?: string
  extension?: unknown
  externalId?: string
  x?: number                     // X 좌표
  y?: number                     // Y 좌표
  width?: number                 // 셀 너비
  height?: number                // 셀 높이
  colspan: number                // 열 병합 수
  rowspan: number                // 행 병합 수
  value: IElement[]              // 셀 내용
  trIndex?: number               // 행 인덱스
  tdIndex?: number               // 셀 인덱스
  isLastRowTd?: boolean          // 마지막 행 여부
  isLastColTd?: boolean          // 마지막 열 여부
  isLastTd?: boolean             // 마지막 셀 여부
  rowIndex?: number              // 행 번호
  colIndex?: number              // 열 번호
  rowList?: IRow[]               // 행 목록
  positionList?: IElementPosition[]  // 위치 목록
  verticalAlign?: VerticalAlign  // 수직 정렬
  backgroundColor?: string       // 배경색
  borderTypes?: TdBorder[]       // 셀 테두리 타입
  slashTypes?: TdSlash[]         // 대각선 타입
  mainHeight?: number            // 콘텐츠 + 내부 여백 높이
  realHeight?: number            // 실제 높이
  realMinHeight?: number         // 실제 최소 높이
  disabled?: boolean             // 편집 불가
  deletable?: boolean            // 삭제 불가
}
```

### Table Enums
```typescript
enum TableBorder {
  ALL = 'all',           // 모든 테두리
  EMPTY = 'empty',       // 테두리 없음
  EXTERNAL = 'external', // 외부 테두리만
  INTERNAL = 'internal', // 내부 테두리만
  DASH = 'dash'          // 점선 테두리
}

enum TdBorder {
  TOP = 'top',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  LEFT = 'left'
}

enum TdSlash {
  FORWARD = 'forward',   // 정사선 /
  BACK = 'back'          // 역사선 \
}

enum VerticalAlign {
  TOP = 'top',
  MIDDLE = 'middle',
  BOTTOM = 'bottom'
}
```

## 컨트롤(Control) 구조

### IControlElement
```typescript
interface IControlElement {
  control?: IControl             // 컨트롤 정의
  controlId?: string             // 컨트롤 ID
  controlComponent?: ControlComponent  // 컨트롤 컴포넌트 타입
}

type IControl = IControlBasic &
  IControlRule &
  Partial<IControlStyle> &
  Partial<IControlSelect> &
  Partial<IControlCheckbox> &
  Partial<IControlRadio> &
  Partial<IControlDate>
```

### IControlBasic
```typescript
interface IControlBasic {
  type: ControlType              // 컨트롤 타입
  value: IElement[] | null       // 컨트롤 값
  placeholder?: string           // 플레이스홀더
  conceptId?: string
  prefix?: string                // 접두사
  postfix?: string               // 접미사
  minWidth?: number              // 최소 너비
  underline?: boolean            // 밑줄
  border?: boolean               // 테두리
  extension?: unknown
  indentation?: ControlIndentation
  rowFlex?: RowFlex
  preText?: string               // 앞 텍스트
  postText?: string              // 뒤 텍스트
}

enum ControlType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  DATE = 'date'
}
```

### IControlSelect (선택 컨트롤)
```typescript
interface IControlSelect {
  code: string | null
  valueSets: IValueSet[]        // 선택 옵션들
  isMultiSelect?: boolean       // 다중 선택 가능
  multiSelectDelimiter?: string // 다중 선택 구분자
  selectExclusiveOptions?: {
    inputAble?: boolean          // 입력 가능 여부
  }
}

interface IValueSet {
  value: string                  // 표시 값
  code: string                   // 코드 값
}
```

## 기타 특수 요소

### 이미지 요소
```typescript
interface IImageElement {
  imgDisplay?: ImageDisplay      // 이미지 표시 방식
  imgFloatPosition?: {           // 플로팅 위치
    x: number
    y: number
    pageNo?: number
  }
  imgToolDisabled?: boolean      // 이미지 도구 비활성화
}

enum ImageDisplay {
  INLINE = 'inline',             // 인라인
  BLOCK = 'block',               // 블록
  FLOAT = 'float'                // 플로팅
}
```

### 하이퍼링크 요소
```typescript
interface IHyperlinkElement {
  valueList?: IElement[]         // 링크 텍스트 요소들
  url?: string                   // URL
  hyperlinkId?: string           // 하이퍼링크 ID
}
```

### 제목 요소
```typescript
interface ITitleElement {
  valueList?: IElement[]         // 제목 내용
  level?: TitleLevel             // 제목 레벨
  titleId?: string
  title?: ITitle
}

enum TitleLevel {
  FIRST = 'first',    // 제목 1
  SECOND = 'second',  // 제목 2
  THIRD = 'third',    // 제목 3
  FOURTH = 'fourth',  // 제목 4
  FIFTH = 'fifth',    // 제목 5
  SIXTH = 'sixth'     // 제목 6
}
```

### 목록 요소
```typescript
interface IListElement {
  valueList?: IElement[]         // 목록 항목들
  listType?: ListType            // 목록 타입
  listStyle?: ListStyle          // 목록 스타일
  listId?: string
  listWrap?: boolean
}

enum ListType {
  UL = 'ul',        // 순서 없는 목록
  OL = 'ol'         // 순서 있는 목록
}

enum ListStyle {
  DISC = 'disc',         // 실심 원
  CIRCLE = 'circle',     // 빈 원
  SQUARE = 'square',     // 사각형
  DECIMAL = 'decimal',   // 숫자
  CHECKBOX = 'checkbox'  // 체크박스
}
```

### 체크박스 요소
```typescript
interface ICheckboxElement {
  checkbox?: ICheckbox
}

interface ICheckbox {
  value: boolean | null         // 체크 상태
  disabled?: boolean             // 비활성화
}
```

### 라디오 버튼 요소
```typescript
interface IRadioElement {
  radio?: IRadio
}

interface IRadio {
  value: boolean | null         // 선택 상태
  disabled?: boolean            // 비활성화
  code?: string                 // 그룹 코드
}
```

### LaTeX 요소
```typescript
interface ILaTexElement {
  laTexSVG?: string             // LaTeX SVG 문자열
}
```

### 날짜 요소
```typescript
interface IDateElement {
  dateFormat?: string           // 날짜 형식
  dateId?: string
}
```

### 구분선 요소
```typescript
interface ISeparator {
  dashArray?: number[]          // 점선 패턴 [선길이, 공백길이, ...]
}
```

### 블록 요소
```typescript
interface IBlockElement {
  block?: IBlock
}

interface IBlock {
  type: BlockType
  isCrossRowCol?: boolean       // 행/열 교차 여부
}
```

### 영역 요소
```typescript
interface IAreaElement {
  valueList?: IElement[]        // 영역 내 요소들
  areaId?: string
  areaIndex?: number
  area?: IArea
}
```

### 위/아래 첨자
```typescript
interface ISuperscriptSubscript {
  actualSize?: number           // 실제 크기
}
```

## Editor Options

`IEditorOption`은 에디터의 전반적인 설정을 정의합니다:

```typescript
interface IEditorOption {
  // 기본 설정
  mode?: EditorMode              // 에디터 모드 (edit, readonly, print, form, design)
  locale?: string                // 로케일 (koKR, enUS, zhCN)
  
  // 텍스트 기본값
  defaultType?: string           // 기본 요소 타입
  defaultColor?: string          // 기본 색상
  defaultFont?: string           // 기본 폰트
  defaultSize?: number           // 기본 크기
  minSize?: number               // 최소 크기
  maxSize?: number               // 최대 크기
  
  // 레이아웃
  width?: number                 // 에디터 너비
  height?: number                // 에디터 높이
  scale?: number                 // 배율
  pageGap?: number               // 페이지 간격
  margins?: IMargin              // 여백
  
  // 페이지 설정
  pageMode?: PageMode            // 페이지 모드 (paging, continuity)
  renderMode?: RenderMode        // 렌더링 모드
  paperDirection?: PaperDirection // 종이 방향 (vertical, horizontal)
  
  // 스타일
  underlineColor?: string        // 밑줄 색상
  strikeoutColor?: string        // 취소선 색상
  rangeColor?: string            // 선택 영역 색상
  rangeAlpha?: number            // 선택 영역 투명도
  searchMatchColor?: string      // 검색 일치 색상
  highlightAlpha?: number        // 강조 투명도
  
  // 행동 설정
  defaultRowMargin?: number      // 기본 줄 간격
  defaultTabWidth?: number       // 기본 탭 너비
  historyMaxRecordCount?: number // 실행 취소 최대 개수
  wordBreak?: WordBreak          // 단어 줄바꿈
  
  // 기능 설정
  contextMenuDisableKeys?: string[]  // 비활성화할 컨텍스트 메뉴
  shortcutDisableKeys?: string[]     // 비활성화할 단축키
  
  // 컴포넌트 옵션
  table?: ITableOption           // 표 옵션
  header?: IHeader               // 머리글 옵션
  footer?: IFooter               // 바닥글 옵션
  pageNumber?: IPageNumber       // 페이지 번호 옵션
  watermark?: IWatermark         // 워터마크 옵션
  control?: IControlOption       // 컨트롤 옵션
  checkbox?: ICheckboxOption     // 체크박스 옵션
  radio?: IRadioOption           // 라디오 옵션
  cursor?: ICursorOption         // 커서 옵션
  title?: ITitleOption           // 제목 옵션
  placeholder?: IPlaceholder     // 플레이스홀더 옵션
  group?: IGroup                 // 그룹 옵션
  pageBreak?: IPageBreak         // 페이지 나누기 옵션
  zone?: IZoneOption             // 영역 옵션
  background?: IBackgroundOption // 배경 옵션
  lineBreak?: ILineBreakOption   // 줄바꿈 옵션
  separator?: ISeparatorOption   // 구분선 옵션
  lineNumber?: ILineNumberOption // 줄 번호 옵션
  pageBorder?: IPageBorderOption // 페이지 테두리 옵션
  badge?: IBadgeOption           // 배지 옵션
  modeRule?: IModeRule           // 모드별 규칙
}
```

### Editor Enums
```typescript
enum EditorMode {
  EDIT = 'edit',         // 편집 모드
  READONLY = 'readonly', // 읽기 전용
  PRINT = 'print',       // 인쇄 모드
  FORM = 'form',         // 폼 모드
  DESIGN = 'design'      // 디자인 모드
}

enum PageMode {
  PAGING = 'paging',         // 페이지 모드
  CONTINUITY = 'continuity'  // 연속 모드
}

enum PaperDirection {
  VERTICAL = 'vertical',     // 세로
  HORIZONTAL = 'horizontal'  // 가로
}

enum RowFlex {
  LEFT = 'left',             // 왼쪽 정렬
  CENTER = 'center',         // 가운데 정렬
  RIGHT = 'right',           // 오른쪽 정렬
  ALIGNMENT = 'alignment',   // 양쪽 정렬
  JUSTIFY = 'justify'        // 균등 분배
}
```

## 사용 예시

### 1. 기본 텍스트
```json
{
  "type": "text",
  "value": "안녕하세요, Canvas Editor입니다.",
  "size": 16,
  "color": "#000000",
  "font": "AppleGothic"
}
```

### 2. 굵은 텍스트 with 강조
```json
{
  "type": "text",
  "value": "중요한 내용",
  "bold": true,
  "highlight": "#FFFF00",
  "size": 18
}
```

### 3. 하이퍼링크
```json
{
  "type": "hyperlink",
  "url": "https://example.com",
  "valueList": [
    {
      "type": "text",
      "value": "여기를 클릭",
      "color": "#0000FF",
      "underline": true
    }
  ]
}
```

### 4. 이미지
```json
{
  "type": "image",
  "value": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "width": 300,
  "height": 200,
  "imgDisplay": "inline"
}
```

### 5. 표 (2x2)
```json
{
  "type": "table",
  "colgroup": [
    { "width": 150 },
    { "width": 150 }
  ],
  "trList": [
    {
      "height": 30,
      "tdList": [
        {
          "colspan": 1,
          "rowspan": 1,
          "value": [
            {
              "type": "text",
              "value": "제목1"
            }
          ],
          "backgroundColor": "#F0F0F0"
        },
        {
          "colspan": 1,
          "rowspan": 1,
          "value": [
            {
              "type": "text",
              "value": "제목2"
            }
          ],
          "backgroundColor": "#F0F0F0"
        }
      ]
    },
    {
      "height": 30,
      "tdList": [
        {
          "colspan": 1,
          "rowspan": 1,
          "value": [
            {
              "type": "text",
              "value": "내용1"
            }
          ]
        },
        {
          "colspan": 1,
          "rowspan": 1,
          "value": [
            {
              "type": "text",
              "value": "내용2"
            }
          ]
        }
      ]
    }
  ],
  "borderType": "all"
}
```

### 6. 컨트롤 (입력 필드)
```json
{
  "type": "control",
  "controlId": "name-input",
  "control": {
    "type": "text",
    "placeholder": "이름을 입력하세요",
    "value": null,
    "prefix": "[",
    "postfix": "]",
    "underline": true
  }
}
```

### 7. 체크박스
```json
{
  "type": "checkbox",
  "checkbox": {
    "value": false
  },
  "value": "□"
}
```

### 8. 목록
```json
{
  "type": "list",
  "listType": "ul",
  "listStyle": "disc",
  "valueList": [
    {
      "type": "text",
      "value": "첫 번째 항목"
    }
  ]
}
```

### 9. 제목
```json
{
  "type": "title",
  "level": "first",
  "valueList": [
    {
      "type": "text",
      "value": "1. 소개",
      "size": 24,
      "bold": true
    }
  ]
}
```

### 10. 구분선
```json
{
  "type": "separator",
  "value": "",
  "dashArray": [0, 0]
}
```

### 11. 페이지 나누기
```json
{
  "type": "pageBreak",
  "value": ""
}
```

### 12. LaTeX 수식
```json
{
  "type": "latex",
  "value": "x^2 + y^2 = z^2",
  "laTexSVG": "<svg>...</svg>"
}
```

### 13. 복합 문서 예시
```json
{
  "version": "0.9.115",
  "data": {
    "header": [
      {
        "type": "text",
        "value": "문서 제목",
        "size": 20,
        "bold": true
      }
    ],
    "main": [
      {
        "type": "title",
        "level": "first",
        "valueList": [
          {
            "type": "text",
            "value": "1. 서론",
            "size": 18,
            "bold": true
          }
        ]
      },
      {
        "type": "text",
        "value": "\n"
      },
      {
        "type": "text",
        "value": "이것은 본문 내용입니다. "
      },
      {
        "type": "text",
        "value": "강조된 텍스트",
        "bold": true,
        "highlight": "#FFFF00"
      },
      {
        "type": "text",
        "value": "와 일반 텍스트가 섞여 있습니다.\n"
      },
      {
        "type": "table",
        "colgroup": [
          { "width": 200 },
          { "width": 200 }
        ],
        "trList": [
          {
            "height": 40,
            "tdList": [
              {
                "colspan": 2,
                "rowspan": 1,
                "value": [
                  {
                    "type": "text",
                    "value": "병합된 셀",
                    "rowFlex": "center"
                  }
                ],
                "backgroundColor": "#E0E0E0"
              }
            ]
          }
        ]
      }
    ],
    "footer": [
      {
        "type": "text",
        "value": "© 2024 Canvas Editor",
        "size": 12,
        "color": "#888888"
      }
    ]
  },
  "options": {
    "mode": "edit",
    "locale": "koKR",
    "defaultFont": "AppleGothic",
    "defaultSize": 16,
    "pageMode": "paging",
    "paperDirection": "vertical",
    "margins": {
      "top": 50,
      "right": 50,
      "bottom": 50,
      "left": 50
    }
  }
}
```

## 중요 참고사항

1. **필수 필드**: 모든 요소는 `value` 필드가 필수입니다.
2. **타입 안전성**: TypeScript 인터페이스를 준수해야 합니다.
3. **중첩 구조**: 표, 리스트, 하이퍼링크 등은 `valueList`나 `value` 배열로 중첩 요소를 포함할 수 있습니다.
4. **ID 관리**: `id`, `conceptId`, `externalId` 등으로 요소를 식별하고 참조할 수 있습니다.
5. **스타일 상속**: 일부 스타일은 부모 요소에서 자식 요소로 상속됩니다.
6. **줄바꿈**: `\n` 문자로 줄바꿈을 표현합니다.
7. **빈 요소**: 구분선, 페이지 나누기 등은 `value: ""`를 사용합니다.

## API 사용법

```javascript
// JSON 데이터 설정
instance.command.executeSetValue(jsonData)

// JSON 데이터 가져오기
const result = instance.command.getValue()
// result: { version, data, options }

// HTML로 가져오기
const html = instance.command.getHTML()
// html: { header, main, footer }

// 특정 요소 업데이트
instance.command.executeUpdateElementById({
  id: 'element-id',
  properties: {
    bold: true,
    color: '#FF0000'
  }
})
```

## 변환 가이드

### HWPX → Canvas Editor 변환 시 고려사항

1. **텍스트 런(run)** → `type: "text"` 요소
2. **문단(p)** → 텍스트 요소 + `\n`
3. **표(tbl)** → `type: "table"` with `trList`
4. **이미지** → `type: "image"` with base64 data
5. **스타일 매핑**:
   - HWPX `charPr` → Canvas Editor `IElementStyle`
   - HWPX `paraPr` → Canvas Editor `rowFlex`, `rowMargin`
6. **ID 참조**: HWPX의 ID 참조 시스템을 Canvas Editor의 `id`/`conceptId`로 매핑

이 문서는 Canvas Editor JSON 구조의 모든 인터페이스와 속성을 포함하고 있습니다.