# 사용자 정의 플러그인

::: tip
공식 관리 플러그인 저장소: https://github.com/Hufe921/canvas-editor-plugin
:::

## 플러그인 개발

```javascript
export function myPlugin(editor: Editor, options?: Option) {
  // 1. 메서드 수정, 자세한 내용: src/plugins/copy
  editor.command.updateFunction = () => {}

  // 2. 메서드 추가, 자세한 내용: src/plugins/markdown
  editor.command.addFunction = () => {}

  // 3. 이벤트 리스늤, 단축키, 우클릭 메뉴, 메서드 재정의 등의 조합 처리
}
```

## 플러그인 사용

```javascript
instance.use(myPlugin, options?: Option)
```
