---
title: "Vue 3 핵심 문법"
date: "2024.01.30."
tags: ["Vue"]
---

## Vue3 핵심 문법

### Single File Component

Vue의 컴포넌트를 하나의 파일로 나타내는 것을 의미

하나의 파일이 하나의 컴포넌트를 나타내므로 관리가 쉽고 코드가 간결해진다.

- `template`
  컴포넌트가 렌더링되어야 하는 HTML 코드 부분. 선언적 렌더링 혹은 템플릿 문법을 이용해 반응형 컴포넌트 생성 가능
- `script`
  템플릿에서 사용한 반응성을 가지는 변수 등을 조작 가능
  자바스크립트나 타입스크립트 등을 이용해 스크립트 코드 작성
    <aside>
    ⭐ Vue 3에서 components 옵션을 이용해 컴포넌트를 지정하지 않아도 되는 이유
    
    `<script setup>` 이라는 Vue의 신규 기능 덕분. 내부적으로 <template>을 render() 함수로 변경하기 때문에 명시적으로 변수나 컴포넌트를 노출시킬 필요가 없다.
    
    setup() 함수를 직접 구현하는 경우 기존 Options API와 마찬가지로 components 옵션으로 컴포넌트를 지정해줘야 한다.
    
    </aside>

- `style`
  컴포넌트 혹은 전체 프로젝트에서 사용할 CSS 코드 삽입 가능
    <aside>
    ⭐ `<style scoped>`
    
    정의한 CSS가 component 내에서만 적용되게 한다
    
    </aside>

### setup

Vue 3는 컴포지션 API를 이용해 컴포넌트를 만들 수 있는데, 이 컴포지션 API는 setup 함수 내에서 사용이 가능하다.

setup 함수 내에 자바스크립트로 코드를 작성하고, 객체 형식으로 반환한다.

```jsx
setup() {
	const data = 1;
	return { data };
}
```

### 선언적 렌더링

Vue는 선언적 렌더링을 지원한다 == 변수를 선언하고 값을 넣으면 자동으로 DOM에 업데이트가 된다

- v-html 디렉티브를 이용한 HTML 표현
  HTML 엘리먼트의 innerHTML 값에 변수값을 전달하기 때문에 문자열이 HTML 마크업 언어로 표현되도록 함
  innerHTML에 바로 값을 집어 넣기 때문에 변수는 반드시 HTML 평문이어야 하며, Vue의 문법을 사용해도 컴파일 되지 않음
- v-pre 디렉티브를 이용한 컴파일 무시
  해당 엘리먼트를 포함한 모든 자식 엘리먼트들의 값을 컴파일하지 않는다
  수염표기법으로 변수를 표기하더라도 있는 그대로 출력됨

### 데이터 결합을 통한 사용자 입력 처리

템플릿 내에서 v-bind 디렉티브 혹은 v-model 디렉티브를 이용할 경우 컴포넌트에서 선언한 변수와 HTML 태그의 속성을 결합할 수 있음

주의할 것은 v-bind 디렉티브는 단방향 결합을 지원하고, v-model 디렉티브를 양방향 결합을 지원한다는 것

- v-model 디렉티브 수식어
  v-model 디렉티브는 변수의 값을 변경할 수 있는 수식어가 존재한다
  유용하지만 Vue 3의 세부 버전에 따라 수식어가 작동되기도 하고 안되기도 하므로 가능하면 내부 구현을 통해 처리하거나 사용자 수식어를 생성해 처리하는 것이 좋음

  - `.lazy` changed 이벤트와 동기화되어 값 변경
  - `.number` 넘어오는 값을 자동으로 숫자로 타입 변경
  - `.trim` 값의 좌우 여백을 잘라냄
    <aside>
    ⭐ 사용자 수식어를 만드는 방법

    v-model 디렉티브로 연결되는 변수명을 컴포넌트의 props에 정의하고, 변수명 뒤에 Modifiers라는 글자를 붙여 props에 추가적으로 선언

    </aside>

### 이벤트 리스너를 이용한 사용자 입력 처리

HTML 태그가 발생시키는 이벤트를 캡쳐하여 지정된 스크립트를 수행하거나 함수를 호출하기 위해 v-on 디렉티브를 이용

- 이벤트 수식어
  Vue의 v-on 디렉티브는 이벤트 함수 호출을 이벤트 핸들러 메서드에서 하지 않고 이벤트를 받는 태그에서 할 수 있는 수식어를 제공한다
  이벤트 핸들러 메서드 내에서는 추가적으로 필요한 코드만 작성할 수 있으므로 훨씬 가독성이 높고 재사용 가능한 코드를 만드는데 좋다
  연결해서 사용 가능
  - `.stop` 이벤트 전파를 방지 == stopPropagation()
  - `.prevent` 브라우저의 기본 동작을 금지 == preventDefault()
  - `.capture` 이벤트리스너의 capture(이벤트가 자식 엘리먼트로 전달되기 전 호출) 옵션 활성화
  - `.self` 이벤트가 자식 엘리먼트가 아닌 현재 엘리먼트에서 발생했을 때만 핸들러 호출
  - `.once` 최대 한 번의 클릭만 허용
    .once.prevent와 같이 사용하면 처음 클릭 시 태그의 본연 기능을 방지하고 원하는 기능 수행 가능
  - `.passive` 이벤트리스너의 passive 옵션(true일 경우 preventDefault() 호출 X) 활성화
  - `.exact` 정확히 해당 키만 눌렀을 때 핸들러 호출
  - `.left` 마우스의 왼쪽 버튼이 눌렸을 때 핸들러 호출
  - `.right` 마우스의 오른쪽 버튼이 눌렸을 때 핸들러 호출
  - `.middle` 마우스의 가운데 버튼이 눌렸을 때 핸들러 호출
- 키 수식어
  일반적으로 keyup 이벤트에 대해 수식어를 붙여 키보드 입력을 수정

### 템플릿 내 조건문(v-if)

v-if 디렉티브를 사용한 조건문으로 일반적으로 스크립트 문법을 따른다

주의할 것은 이미 디렉티브가 쌍따옴표를 통해 스크립트를 구성하므로 문자열을 표시할 때는 반드시 홑따옴표를 이용해야 한다는 것

`v-show`

v-if 디렉티브와 비슷한 역할을 한다

v-if는 조건이 변경되면 조건 내 DOM 엘리먼트를 처음부터 다시 그리는 반면, v-show는 일단 모든 조건의 DOM 엘리먼트를 그린 후 조건에 맞지 않는 엘리먼트는 hide 처리한다

v-if는 빠르게 애플리케이션의 그림을 그려주지만 조건이 변경될 때마다 다시 해당 엘리먼트를 그려야하는 반면, v-show는 처음에는 조금 늦게 그릴지 몰라도 조건이 자주 변경될 때는 매우 빠른 전환이 이뤄진다

→ **조건이 자주 안바뀔 경우 v-if가 유리하며 조건이 자주 바뀐다면 v-show가 유리하다**

### 템플릿 내 반복문(v-for)

간단한 배열이나 객체의 표현에 사용

v-for 디렉티브를 사용할 때면 언제나 key 속성을 같이 적어주는 것이 좋음

→ 템플릿이 가상 DOM 렌더함수로 변환될 때 같은 태그를 재활용하기 때문

### Computed 속성

실시간으로 원하는 대로 데이터 변경

내부 반응성 변수의 값이 변하지 않는다면 그 결과를 캐시에서 바로 꺼내 사용, DOM 업데이트 자체를 진행하지 않는다

(함수는 호출이 되면 반드시 새롭게 계산을 진행하고 DOM을 업데이트한다)

```jsx
setup() {
	const small_items_c = computed(() => {
		return arr.filter((i) => i.id < 3)
	})
	const big_items_c = computed(() => {
		return arr.filter((i) => i.id >= 3)
	})

	return {
		small_items_c,
		big_items_c
	}
}
```

### Watch와 WatchEffect

데이터의 변화를 감지하여 사용자가 지정한 콜백함수를 호출할 수 있게 해주는 기능

- watch
  개발자가 코드로 지정한 변수값의 변화를 감시하여 콜백함수로 하여금 부가적인 작업을 할 수 있도록 해준다
    <aside>
    ⭐ 지정된 특정한 변수의 감시와 더불어 값이 변경되기 이전 값을 참조할 수 있음!
    
    → watch는 변수가 할당되기 전의 null값에서 초기값으로 넘어가는 과정을 데이터의 변경으로 판단하지 않지만, 같은 컴포넌트를 다시 불러올 때(reload) props의 처음 값이 중요할 때가 있다
    
    이때 **immediate 속성을 true**로 하면 처음 값 조회가 가능
    
    </aside>
    
    여러 변수를 동시에 감시하기 위해서는 watch의 처음 인자를 배열로 주면 된다. 배열의 값들이 변화가 일어나면 배열의 순서대로 변화된 값을 콜백함수에 배열로 전달한다.
    
    <aside>
    ⭐ 감시하고자 하는 대상이 객체나 리스트일 때
    
    → deep 옵션을 true로 설정
    
    </aside>

- watchEffect
  Vue 3에서 새롭게 소개한 기능으로 매우 강력한 감시능력을 제공
  초기 변경값부터 감시를 시작
  기본적으로 어떤 값이 변경되었는지 알려주지 않고, 어떤 값이 변경되었는지 모르므로 과거값도 알 수 없음
  불필요한 변수를 모두 감시하지 않기 위해 모든 변수의 대입값을 감시한 후에는 콜백함수에서 참조되는 변수만 감시
  생성 시 **반환함수**를 받아 감시의 중단을 위해 활용 가능
  - `flush` 사용하지 않으면 ‘pre’가 기본값이며, ‘pre’와 ‘post’ 중 하나를 선택 가능
    - pre : DOM이 업데이트하기 전에 콜백함수를 호출하라는 뜻
    - post : DOM이 업데이트된 후 콜백함수를 호출해 달라는 뜻

### 컴포넌트 생성

하나의 커다란 애플리케이션을 작은 요소로 분해해 은닉화를 하고 재사용성을 가지게 해주는 Vue의 매우 중요한 요소 중 하나

하나의 애플리케이션은 createApp 함수를 이용해 생성된 Vue 애플리케이션 인스턴스를 참조해야 한다

```jsx
import { createApp } from "vue";
const app = createApp({
  /* 인스턴스 옵션들 */
});
```

이 애플리케이션 인스턴스는 몇 개의 메서드를 제공하며, 이 메서드를 이용하여 정의한 것들은 애플리케이션의 모든 컴포넌트가 사용할 수 있는 전역의 범위로 선언된다

<aside>
⭐ **전역 범위로 선언할 수 있게 해주는 애플리케이션 인스턴스 메서드**

- `component`
  컴포넌트의 이름과 함수 혹은 객체로 이루어진 컴포넌트 정의를 인자로 받아 컴포넌트를 생성한다
- `config`
  [Application API | Vue.js](https://vuejs.org/api/application.html#app-config)
  애플리케이션의 전역 설정을 담당하는 객체로 mount 메서드가 불리기 전에 설정을 해야 한다
  - errorHandler : 컴포넌트를 그리거나 감시할 때 에러가 발생하면 호출
  - warnHandler : Vue에서 경고를 발생시킬 때 호출
  - globalProperties : 키와 값을 설정
  - isCustomElement : 특정한 조건을 설정하여 Vue에서 생성되지 않은 컴포넌트를 명시
  - optionMergeStrategies : 사용자 정의 속성이 있고, 부모 컴포넌트와 자식 컴포넌트가 해당 속성을 정의했을 때 두 값을 어떻게 처리할지 함수로 정의 가능
  - performance : devtool의 performance/timeline 패널에 성능 관련 정보 추적할 수 있게 해줌
- `directive`
  전역 사용자 디렉티브를 설정할 수 있다
- `mixin`
  전역에서 사용할 수 있는 mixin을 설정한다
- `mount`
  최상위 컴포넌트를 특정 DOM 엘리먼트에 장착한다
- `provide`
  모든 자식 컴포넌트가 inject할 수 있는 값을 provide한다
- `unmount`
  특정 DOM 엘리먼트 내 애플리케이션 인스턴스를 탈착한다
- `use`
  Vue 플러그인 객체를 사용할 수 있게 해준다

</aside>

- Props
  컴포넌트에 데이터를 넘겨줄 수 있는 사용자 지정 속성
  컴포넌트 생성 시에 props 옵션을 이용해 어느 이름의 props 데이터를 받을지 결정한다
  일반적으로 props라는 옵션에 Props로 넘어오는 속성의 키 값들을 배열로 지정하면 사용에 문제 X
  그러나 어떤 컴포넌트는 특정한 Props를 반드시 필요로 할 수도 있고, 정해진 데이터 타입에 맞게 들어왔는지 확인히 필요할 수 도 있다 → 옵션의 값을 배열 대신 객체로 변경하고 각 Props 데이터의 상세 내용을 지정!
  - `type` 데이터 타입을 정의한다
  - `default` 해당 Props가 들어오지 않을 경우 사용할 기본값을 가지며, 데이터 타입이 Object일 경우 반드시 팩토리 함수를 이용해 값을 반환해야 함
  - `required` true로 설정되고 Props가 안 들어오면 콘솔에 경고, default가 설정되어 있으면 default값이 쓰여 경고를 내보내지 않음
  - `validator` 잘못 들어온 인자를 개발자 코드로 직접 검사해 콘솔창에 경고를 낼 수 있음
- Non-Prop 속성
  props나 emits 옵션에 정의되지 않은 컴포넌트의 속성(Class, Style, id속성 등)
  스크립트 코드에서 $attrs를 이용해 접근 가능
  Vue 3의 setup 컴포지션 함수에서 Non-Prop 속성에 접근하기 위해서는 setup 함수의 두 번째 매개변수인 context를 이용해야 한다
  ```jsx
  setup(props, context) {
  	const title = context.attrs.title
  }
  ```
  Non-Props 속성은 템플릿 내 루트 노드에 상속된다.
  - `inheritAttrs` false일 경우 자식 노드에서 Non-Prop 속성($attr)을 상속하지 않는다

### 사용자 이벤트 생성

이벤트를 정의하기 위해서는 컴포넌트의 emits 옵션에 이벤트명을 지정하면 된다

가능하면 케밥형식의 소문자만 사용한다

단순히 이벤트명의 배열로 만들어도 되지만, Props를 정의할 때와 마찬가지로 객체형식을 이용해 이벤트 전달값이 올바른지 판단할 수 있다.

- v-model 디렉티브와 이벤트 결합
  기본적으로 v-model 디렉티브에 연동된 변수는 컴포넌트의 Props에 연동이 된다
  이렇게 전달된 변수의 값은 컴포넌트 안에서 업데이트되어 변수를 전달한 부모 컴포넌트와 동기화 가능
  Vue 3는 하나의 v-model 뿐만 아니라 **여러 개의 v-model 디렉티브를 지원**하므로 props에 v-model 디렉티브를 위한 변수를 여러 개 설정하고 emits에도 동일하게 설정하면 여러 개의 값을 양방향으로 결합할 수 있다
  ```jsx
  props: {msg: String, type: String}
  $emit('update:msg', $event.target.value)
  $emit('update:type', $event.target.value)
  ```

### Slots

시작태그와 종료태그 사이에 들어가는 값

```jsx
<Component>
	Slot_value
</Component>

//Component 컴포넌트
<button><slot></slot></button>
```

```jsx
<button>Slot_value</button>
```

슬롯을 생성할 때 미리 지정된 값을 넣는 것도 가능(아무런 값이 입력되지 않았을 때 사용되는 기본값이 된다)

여러 개의 슬롯 정의도 가능, 이 경우 하나의 기본 슬롯을 제외하고 나머지는 항상 name 속성 제공 필요

- `v-slot` name 속성을 가지는 slot에 데이터를 삽입할 때 사용, `<template>` 태그를 이용해 사용한다
  ```jsx
  <Component>
    <template v-slot:header>Header</template>
    <template v-slot:default>Default</template>
  </Component>
  ```
- 데이터 전달
  - `Slot Props` 하나의 컴포넌트에서 발생된 데이터를 Slot에 결합시키고 싶을 경우, 해당 컴포넌트에 작성한 <slot> 태그에 Non-Prop을 정의하면 된다.

### Provide/Inject

컴포넌트 간 데이터 전달

- `Provide` 부모 컴포넌트에서 자식 컴포넌트들과 공유할 데이터를 정의할 때 사용
- `Inject` 부모가 넣은 데이터를 접근할 때 사용

기본적으로 반응성을 가지진 않지만, ref/reactive/computed 등과 같은 함수를 이용해 반응성을 가지는 변수는 Provide할 경우 Inject된 값 역시 반응성을 갖게 된다

### 사용자 디렉티브

directive 함수를 이용해 디렉티브명을 적고 엘리먼트가 DOM에 마운트됐을 때의 액션을 작성하면 사용자가 정의한 디렉티브를 사용할 수 있다

```jsx
app.directive("focus", {
  mounted(el) {
    el.focus();
  },
});
//el : 디렉티브가 사용된 특정 HTML 엘리먼트
//사용시에는 v- 라는 접두사를 붙여 Vue의 디렉티브임을 알려줘야 한다
```

mounted와 updated 모두 적용되게 하고 싶을 경우 훅 이름을 지정하지 않은 무기명 함수를 선언

```jsx
app.directive("focus", (el) => {
  el.focus();
});
```

디렉티브는 속성 및 값을 전달받을 수 있다

- `v-디렉티브:속성 = “값”`
- `v-디렉티브 = “값”`
- `v-디렉티브`

속성과 값을 가진 변수는 훅 함수의 두 번째 매개변수에 키-값 형태로 들어온다

일반적으로 두 번째 매개변수의 이름을 binding이라고 한다

**binding 함수가 갖고 있는 속성**

- `instance` 디렉티브가 사용된 컴포넌트 인스턴스를 나타낸다
- `value` 디렉티브로 전달된 값
- `oldValue` beforeUpdate 혹은 updated 훅 함수 사용 시 이전 값을 나타낸다
- `arg` 속성값을 나타낸다
- `modifiers` 수식어가 사용됐다면 수식어를 나타낸다
- `dir` 디렉티브 객체를 반환한다

훅 함수는 el과 binding 외 vnode와 prevNode 인자를 제공

- `vnode` Vue가 생성해내는 el 엘리먼트의 가상노드
- `prevNode` update 혹은 beforeUpdate 훅 함수에서만 사용 가능한, 변경되기 직전의 가상노드

### Mixins

컴포넌트의 옵션과 동일한 옵션들을 모두 정의할 수 있다

→ Mixins를 호출하는 컴포넌트와 충돌

<aside>
⭐ Mixins는 컴포넌트보다 먼저 호출된다

</aside>

컴포넌트의 변수나 함수의 이름이 Mixins와 충돌하는 문제를 제거하기 위해 Mixins의 변수나 함수명은 가능하면 특정한 규칙을 갖는 게 좋다
