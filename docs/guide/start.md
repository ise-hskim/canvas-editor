# 시작하기

> WYSIWYG(보는 그대로 얻는) 리치 텍스트 에디터입니다.

커서와 텍스트 레이아웃을 완전히 자체 구현한 것의 이점을 누릴 수 있습니다. 렌더링 계층도 SVG로 렌더링할 수 있습니다. 코드 참조: [feature/svg](https://github.com/Hufe921/canvas-editor/tree/feature/svg). 또는 PDF.js를 활용하여 PDF 렌더링을 완성할 수 있습니다. 코드 참조: [feature/pdf](https://github.com/Hufe921/canvas-editor/tree/feature/pdf).

::: warning
공식적으로는 편집기 핵심 계층 npm 패키지만 제공하며, 메뉴바나 기타 외부 도구는 문서를 참조하여 직접 확장하거나 [공식](https://github.com/Hufe921/canvas-editor) 구현을 직접 참조할 수 있습니다. [데모](https://hufe.club/canvas-editor/) 참조.
:::

## 기능

- 리치 텍스트 조작(실행취소, 다시 실행, 글꼴, 글꼴 크기, 두께, 기울임꼴, 밑줄, 취소선, 위/아래 첨자, 정렬 방식, 제목, 목록, ...)
- 요소 삽입(표, 이미지, 링크, 코드 블록, 페이지 구분자, Math 수식, 날짜 선택기, 콘텐츠 블록, ...)
- 인쇄(Canvas를 이미지로 변환, PDF 렌더링 기반)
- 컴트롤(단일 선택, 텍스트, 날짜, 단일 선택 그룹, 체크박스 그룹)
- 우클릭 메뉴(내장, 사용자 정의)
- 단축키(내장, 사용자 정의)
- 드래그 앤 드롭(텍스트, 요소, 컴트롤)
- 페이지 머리글, 페이지 바닥글, 페이지 번호
- 페이지 여백
- 페이지 나누기
- 워터마크
- 주석
- 목차
- [플러그인](https://github.com/Hufe921/canvas-editor-plugin)

## 개발 예정

- 계산 성능
- 컴트롤 규칙
- 표 페이지 나누기
- Vue, React 등 프레임워크 바로 사용 가능 버전

## Step. 1: npm 패키지 다운로드

```sh
npm i @hufe921/canvas-editor --save
```

## Step. 2: 컨테이너 준비

```html
<div class="canvas-editor"></div>
```

## Step. 3: 편집기 인스턴스 생성

- 본문 콘텐츠만 포함

```javascript
import Editor from '@hufe921/canvas-editor'

new Editor(
  document.querySelector('.canvas-editor'),
  [
    {
      value: 'Hello World'
    }
  ],
  {}
)
```

- 본문, 페이지 머리글, 페이지 바닥글 콘텐츠 포함

```javascript
import Editor from '@hufe921/canvas-editor'

new Editor(
  document.querySelector('.canvas-editor'),
  {
    header: [
      {
        value: 'Header',
        rowFlex: RowFlex.CENTER
      }
    ],
    main: [
      {
        value: 'Hello World'
      }
    ],
    footer: [
      {
        value: 'canvas-editor',
        size: 12
      }
    ]
  },
  {}
)
```

## Step. 4: 편집기 설정

자세한 내용은 다음 섹션 참조
