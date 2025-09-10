# 사용자 정의 단축키

## 사용 방법

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.register.shortcutList([
    {
      key: KeyMap;
      ctrl?: boolean;
      meta?: boolean;
      mod?: boolean; // Windows: Ctrl || Mac: Command
      shift?: boolean;
      alt?: boolean;
      isGlobal?: boolean;
      callback?: (command: Command) => any;
      disable?: boolean;
    }
  ])
```
