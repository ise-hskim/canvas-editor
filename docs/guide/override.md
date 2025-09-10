# 메서드 재정의

## 사용 방법

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)

instance.override.overrideFunction = () => unknown | IOverrideResult
```

```typescript
interface IOverrideResult {
  preventDefault?: boolean // 내부 기본 메서드 실행 차단. 기본값은 차단
}
```

## paste

기능: 붙여넣기 메서드 재정의

사용법:

```javascript
instance.override.paste = (evt?: ClipboardEvent) => unknown | IOverrideResult
```

## copy

기능: 복사 메서드 재정의

사용법:

```javascript
instance.override.copy = () => unknown | IOverrideResult
```

## drop

기능: 드래그 앤 드롭 메서드 재정의

사용법:

```javascript
instance.override.drop = (evt: DragEvent) => unknown | IOverrideResult
```
