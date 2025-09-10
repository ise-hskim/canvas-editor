# 인스턴스 API

## 사용 방법

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.apiName()
```

## destroy

기능: 에디터 소멸

사용법:

```javascript
instance.destroy()
```

::: warning
에디터 DOM과 관련 이벤트만 소멸하며, 메뉴 막대, 도구 모음, 외부 변수 등은 직접 처리해야 합니다.
:::
