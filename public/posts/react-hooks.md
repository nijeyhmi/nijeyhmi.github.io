# React Hooks란?

React 16.8에서 도입된 Hooks는 클래스형 컴포넌트 없이 상태와 생명주기 메서드를 사용할 수 있도록 도와주는 기능입니다.

## 주요 React Hooks

### 1. useState

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>현재 카운트: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```
