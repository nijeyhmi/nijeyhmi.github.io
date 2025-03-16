---
title: "Vue Lifecycle"
date: "2024.01.30."
tags: ["Vue", "lifecycle"]
---

1. Creation
2. Mounting
3. Updating
4. Destruction

## Vue2

- 라이프 사이클 속성 : 인스턴스의 상태에 따라 호출할 수 있는 속성들
- 라이프 사이클 훅 : 각 라이프 사이클 속성에서 실행되는 커스텀 로직(개발자가 임의로 작성한 추가 로직)

인스턴스의 생성 → 인스턴스 화면 부착 → 부착된 인스턴스 내용 갱신 → 인스턴스 제거

- `beforeCreate`
  인스턴스가 생성되고 나서 가장 처음으로 실행되는 단계
  data 속성과 methods 속성이 아직 인스턴스에 정의되어 있지 않다.
  따라서 DOM과 같은 화면 요소에도 접근 불가능
- `created`
  data 속성과 methods 속성이 정의된 이후
  DOM 요소 접근은 불가(아직 인스턴스가 화면에 부착되지 않음)
- `beforeMount`
  template 속성에 지정한 마크업 언어를 render() 함수로 변환한 후 el속성에 지정한 화면 요소(돔)에 인스턴스를 부착하기 전 호출
    <aside>
    💡 render()
    
    자바스크립트로 화면의 돔을 그리는 함수
    
    </aside>

- `mounted`
  el속성에서 지정한 화면 요소에 인스턴스가 부착되고 나면 호출
  template 속성에 정의한 화면 요소(돔)에 접근 가능 → 화면 요소 제어 로직 수행에 용이함
  단, 돔에 인스턴스가 부착되자마자 바로 호출되므로 최종 HTML 코드로 변환되는 시점과 다를 수 있음
- `beforeUpdate`
  관찰하고 있는 데이터가 변경되면 가상 돔으로 화면을 다시 그리기 전에 호출
  변경 예정인 새 데이터에 접근할 수 있어 변경 예정 데이터의 값과 관련된 로직을 미리 넣을 수 있음
  값 변경 로직을 넣더라도 화면이 다시 그려지지는 않는다(인스턴스는 이미 부착되었고, 화면에 치환되는 중이므로)
- `updated`
  데이터 변경 후 가상 돔으로 다시 화면을 그리고나면 실행되는 단계
  데이터 변경으로 인한 화면 요소 변경까지 완료된 시점이므로 데이터 변경 후 화면 요소 제어와 관련된 로직을 추가하기 좋음
  데이터 값 변경 시 무한루프에 빠질 수 있다 → computed나 watch 사용
  데이터 값 갱신 로직은 beforeUpdate에, 변경 데이터의 화면 요소(돔)와 관련된 로직은 updated에!
- `beforeDestroy`
  뷰 인스턴스가 파괴되기 직전에 호출
  아직 인스턴스에 접근 가능하므로 뷰 인스턴스의 데이터를 삭제하기 좋다
- `destroyed`
  뷰 인스턴스가 파괴되고 나서 호출되는 단계
  뷰 인스턴스에 정의한 모든 속성이 제거되고 하위에 선언한 인스턴스들 또한 모두 파괴

데이터가 변경되지 않는 경우

![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/64d42e63-0038-475a-81d9-5acd20aeeb0b/Untitled.png)

데이터가 변경되는 경우

![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/b94ce1ac-f662-4f66-97cf-88d97c1dafaf/Untitled.png)

## Vue3

컴포넌트를 생성하여 DOM 노드 트리에 마운트하고, 불필요한 엘리먼트를 제거하는 일련의 과정

컴포지션 API로 setup 함수 내에서 생명주기 훅을 사용하기 위해서는 컴포지션 함수를 이용해야 한다.

```jsx
setup() {
	onUpdated(() => {
		//Update Action
	})
}
```

- `beforeCreate`
  **컴포넌트를 생성하기 전**에 호출
  컴포지션 API의 setup 함수 자체가 beforeCreate를 대체한다.
  컴포넌트가 생성되기 전에 호출이 되므로 생성한 data는 물론, 해당 data를 관찰할 수 있는 watch와 같은 함수들이 동작하지 않음
- `created`
  **컴포넌트가 생성**되면 호출
  컴포지션 API의 setup 함수가 created 대체
  컴포넌트의 옵션에 접근이 가능하므로 data 옵션에 선언한 데이터들을 초기화할 때 주로 사용
- `beforeMount(onBeforeMount)`
  **Vue의 가상 노드가 render 함수를 호출하기 직전(실제 DOM을 구성하기 직전)**에 호출
  beforeMount 사이클이 지나고나면 Vue는 Virtual DOM에 가상으로 Rendering할 DOM을 미리 구성한다. → onRenderTracked라는 생명주기 훅을 통해 관찰 가능
- `mounted(onMounted)`
  **실제로 컴포넌트의 구성요소들이 DOM 엘리먼트로 마운트된 후** 호출
  이 때부터 **실제 엘리먼트 참조 가능**
    <aside>
    ⭐ 실제 엘리먼트가 참조 가능하다는 것은?
    
    mounted 사이클 이전까지는 ref와 같은 함수를 통해 엘리먼트의 참조변수를 만들어도 초기화한 값만 들어있고 실제 엘리먼트를 참조할 수 X
    
    mounted부터는 해당 변수를 통해 실제 엘리먼트에 접근할 수 있게 되는 것!
    
    </aside>
    
    실제 엘리먼트에 동적으로 변화를 줘야 할 경우 처리하기 좋음
    
    onRenderTriggered 라는 생명주기 훅이 이후 호출 → 실제 엘리먼트를 참조한다는 것은 Virtual DOM이 실제 DOM에 반영 되었음을 의미하기 때문!

- `beforeUpdate(onBeforeUpdated)`
  **데이터가 변경되었지만 아직 DOM에 반영되지 않았을 때** 호출
  이미 DOM을 구성하는 요소가 있는데, Virtual DOM이 수정되고 이 수정사항이 DOM에 반영되기 직전에 호출되는 것
  아직 변경사항이 DOM에 반영되지 않았으므로, 실제 엘리먼트를 참조하는 변수로부터 아무것도 얻을 수 없음
- `updated(onUpdated)`
  **데이터가 변경되어 DOM이 변경 완료된 시점**에 호출
  이 순간부터 DOM이 업데이트되었다고 보고, 해당 DOM에 참조된 변수를 이용해 다양한 역할 수행 가능
  단, 현재 컴포넌트만 수정이 되었음을 보장하는 것으로 해당 엘리먼트의 자식 노드들이 업데이트가 완료되었다고 보장하지는 않는다
    <aside>
    ⭐ 자식 컴포넌트까지 모두 수정된 것을 기다리고 싶다면?
    
    nextTick을 이용해 완료되길 기다려야 한다
    
    ```jsx
    updated() {
    	this.$nextTick(function() {
    		//모든 자식이 업데이트되었다.
    	})
    }
    ```
    
    </aside>

- `beforeUnmount(onBeforeUnmount)`
  **컴포넌트가 탈착되기 직전**에 호출
  아직 모든 기능을 사용할 수 있는 상태이므로, 명시적으로 컴포넌트가 Unmount되기 전에 해줘야 할 것들을 작성
- `unmounted(onUnmounted)`
  **컴포넌트가 탈착되고 나서** 호출
  이 순간부터 모든 디렉티브와 이벤트가 사용이 불가능해진다
- `activated(onActivated)`
  keep-alive 태그는 컴포넌트가 다시 렌더링되는 것을 방지하고, 상태를 유지하기 위해 쓰인다
  일반적으로 v-is 디렉티브와 함께 쓰여 해당 디렉티브가 컴포넌트를 변경할 때 기존 컴포넌트의 상태가 사라지지 않게 하기 위해 사용
  이러한 **keep-alive 태그로 컴포넌트의 상태가 보존되기 시작하면** onActivated 생명주기 훅 함수 호출
- `deactivated(onDeactivated)`
  **keep-alive로 상태가 유지되고 컴포넌트가 효력을 상실**하면 호출
- `renderTracked(onRenderTracked)`
  **Virtual DOM이 변경될 때마다** 관찰을 목적으로 호출
  이 함수를 통해 DebuggerEvent 객체를 살펴보면 어떠한 이유로 Virtual DOM이 변경이 되는지 확인 가능
    <aside>
    ⭐ DebuggetEvent
    
    target이란 속성을 통해서 Virtual DOM을 변경시키는 것을 추적할 수 있다
    
    </aside>

- `renderTriggered(onRenderTriggered)`
  **Virtual DOM이 DOM으로 반영이 되어야 할 때** 호출
  onMounted, onActivated, onUpdated와 같이 실제 DOM이 변경되기 직전에 호출됨을 확인 가능
  어떤 이유로 렌더링이 호출되었는지 파악하기 위해서는 DebuggerEvent를 살펴보면 된다
- `errorCaptured(onErrorCaptured)`
  자손 컴포넌트에 에러가 발생하면 어느 컴포넌트에서 어떤 에러가 발생했는지 알려준다
  실제 동작 중에 이러한 에러가 발생하면 안되기에 일반적으로 개발 중 에러를 캡쳐하기 위해 사용
