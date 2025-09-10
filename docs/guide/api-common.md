# 공통 API

## splitText

기능: 문자 분할

사용법:

```javascript
import { splitText } from '@hufe921/canvas-editor'

splitText(text: string): string[]
```

## createDomFromElementList

기능: elementList를 기반으로 DOM 트리 생성

사용법:

```javascript
import { createDomFromElementList } from '@hufe921/canvas-editor'

createDomFromElementList(elementList: IElement[], options?: IEditorOption): HTMLDivElement
```

## getElementListByHTML

기능: HTML을 기반으로 elementList 생성

사용법:

```javascript
import { getElementListByHTML } from '@hufe921/canvas-editor'

getElementListByHTML(htmlText: string, options: IGetElementListByHTMLOption): IElement[]
```

## getTextFromElementList

기능: elementList를 기반으로 텍스트 생성

사용법:

```javascript
import { getTextFromElementList } from '@hufe921/canvas-editor'

getTextFromElementList(elementList: IElement[]): string
```
