# 사용자 정의 우클릭 메뉴

## 사용 방법

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.register.contextMenuList([
    {
      key?: string;
      isDivider?: boolean;
      icon?: string;
      name?: string; // %s를 사용하여 선택 영역 텍스트를 나타냅니다. 예제: 검색: %s
      shortCut?: string;
      disable?: boolean;
      when?: (payload: IContextMenuContext) => boolean;
      callback?: (command: Command, context: IContextMenuContext) => any;
      childMenus?: IRegisterContextMenu[];
    }
  ])
```

## getContextMenuList

기능: 등록된 우클릭 메뉴 목록 가져오기

사용법:

```javascript
const contextMenuList = await instance.register.getContextMenuList()
```

참고:

```javascript
// 내부 우클릭 메뉴 수정 예제
contextmenuList.forEach(menu => {
  // 메뉴 key를 통해 메뉴 항목을 찾아 속성 수정
  if (menu.key === INTERNAL_CONTEXT_MENU_KEY.GLOBAL.PASTE) {
    menu.when = () => false
  }
})
```
