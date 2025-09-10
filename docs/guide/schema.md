# 데이터 구조

```typescript
interface IElement {
  // 기본
  id?: string;
  type?: {
    TEXT = 'text',
    IMAGE = 'image',
    TABLE = 'table',
    HYPERLINK = 'hyperlink',
    SUPERSCRIPT = 'superscript',
    SUBSCRIPT = 'subscript',
    SEPARATOR = 'separator',
    PAGE_BREAK = 'pageBreak',
    CONTROL = 'control',
    CHECKBOX = 'checkbox',
    RADIO = 'radio',
    LATEX = 'latex',
    TAB = 'tab',
    DATE = 'date',
    BLOCK = 'block'
  };
  value: string;
  valueList?: IElement[]; // 복합 요소(하이퍼링크, 제목, 목록 등) 사용
  extension?: unknown;
  externalId?: string;
  hide?: boolean;
  // 스타일
  font?: string;
  size?: number;
  width?: number;
  height?: number;
  bold?: boolean;
  color?: string;
  highlight?: string;
  italic?: boolean;
  underline?: boolean;
  strikeout?: boolean;
  rowFlex?: {
    LEFT = 'left',
    CENTER = 'center',
    RIGHT = 'right',
    ALIGNMENT = 'alignment',
    JUSTIFY = 'justify'
  };
  rowMargin?: number;
  letterSpacing?: number;
  textDecoration?: {
    style?: TextDecorationStyle;
  };
  // 그룹 정보 - 주석 등 다른 그룹 사용 시나리오에 사용 가능
  groupIds?: string[];
  // 표
  conceptId?: string;
  colgroup?: {
    width: number;
  }[];
  trList?: {
    height: number;
    pagingRepeat?: boolean;
    extension?: unknown;
    externalId?: string;
    tdList: {
      colspan: number;
      rowspan: number;
      conceptId?: string;
      verticalAlign?: VerticalAlign;
      backgroundColor?: string;
      borderTypes?: TdBorder[];
      slashTypes?: TdSlash[];
      value: IElement[];
      extension?: unknown;
      externalId?: string;
      disabled?: boolean;
      deletable?: boolean;
    }[];
  }[];
  borderType?: TableBorder;
  borderColor?: string;
  borderWidth?: number;
  borderExternalWidth?: number;
  tableToolDisabled?: boolean;
  // 하이퍼링크
  url?: string;
  // 상하 첫자
  actualSize?: number;
  // 구분선
  dashArray?: number[];
  // 컨트롤
  control?: {
    type: {
      TEXT = 'text',
      SELECT = 'select',
      CHECKBOX = 'checkbox',
      RADIO = 'radio'
      DATE = 'date',
      NUMBER = 'number'
    };
    value: IElement[] | null;
    placeholder?: string;
    conceptId?: string;
    prefix?: string;
    postfix?: string;
    preText?: string;
    postText?: string;
    minWidth?: number;
    underline?: boolean;
    border?: boolean;
    extension?: unknown;
    indentation?: ControlIndentation;
    rowFlex?: RowFlex
    deletable?: boolean;
    disabled?: boolean;
    pasteDisabled?: boolean;
    hide?: boolean;
    code: string | null;
    min?: number;
    max?: number;
    flexDirection: FlexDirection;
    valueSets: {
      value: string;
      code: string;
    }[];
    isMultiSelect?: boolean;
    multiSelectDelimiter?: string;
    dateFormat?: string;
    font?: string;
    size?: number;
    bold?: boolean;
    color?: string;
    highlight?: string;
    italic?: boolean;
    strikeout?: boolean;
    selectExclusiveOptions?: {
      inputAble?: boolean;
    }
  };
  controlComponent?: {
    PREFIX = 'prefix',
    POSTFIX = 'postfix',
    PLACEHOLDER = 'placeholder',
    VALUE = 'value',
    CHECKBOX = 'checkbox',
    RADIO = 'radio'
  };
  // 체크박스
  checkbox?: {
    value: boolean | null;
  };
  // 라디오 버튼
  radio?: {
    value: boolean | null;
  };
  // LaTeX
  laTexSVG?: string;
  // 날짜
  dateFormat?: string;
  // 이미지
  imgDisplay?: {
    INLINE = 'inline',
    BLOCK = 'block'
  }
  imgFloatPosition?: {
    x: number;
    y: number;
    pageNo?: number;
  }
  imgToolDisabled?: boolean;
  // 콘텐츠 블록
  block?: {
    type: {
      IFRAME = 'iframe',
      VIDEO = 'video'
    };
    iframeBlock?: {
      src?: string;
      srcdoc?: string;
    };
    videoBlock?: {
      src: string;
    };
  };
  // 제목
  level?: TitleLevel;
  title?: {
    conceptId?: string;
    deletable?: boolean;
    disabled?: boolean;
  };
  // 목록
  listType?: ListType;
  listStyle?: ListStyle;
  listWrap?: boolean;
  // 영역
  areaId?: string;
  area?: {
    extension?: unknown;
    top?: number;
    hide?: boolean;
    borderColor?: string;
    backgroundColor?: string;
    mode?: AreaMode;
    deletable?: boolean;
    placeholder?: IPlaceholder;
  };
}
```
