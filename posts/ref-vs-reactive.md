---
title: "ref vs. reactive"
date: "2024.01.30."
tags: ["Vue", "ref", "reactive"]
---

### ref vs. reactive

ref는 프록시 객체를 새롭게 만들고 value 속성에 원본 데이터를 넣는다

따라서 `ref([])` 와 같이 하면 value 속성을 변경하여 배열을 변경할 수 있다

반면, reactive는 객체 자체를 프록시화

배열을 프록시화할 경우 배열에 새로운 값을 대입하면 반응성을 가지지 못한다

pop/push와 같은 메서드를 이용해 배열의 참조를 변경시키지 않고 값만 변경시켜야 함

ref, reactive API로 생성한 데이터들은 템플릿에만 한정되지 않는다. 컴포넌트와 별개로 사용할 수 있는 반응성 데이터 생성 가능

[Vue 3.0 | Cracking Vue.js](https://joshua1988.github.io/vue-camp/vue3.html#composition-api%E1%84%8B%E1%85%B4-%E1%84%8C%E1%85%A1%E1%86%BC%E1%84%8C%E1%85%A5%E1%86%B7)

단, 컴포넌트 옵션 속성이 존재하기 전에 `setup()`이 실행되므로 this로 컴포넌트 접근 불가

→ 대신 **context** 사용

- setup API의 두 번째 인자(context)에 제공되는 옵션들
  - `context.attrs`
  - `context.slots`
  - `context.parent`
  - `context.root`
  - `context.emit`

[Ref, Reactive](https://velog.io/@katanazero86/Ref-Reactive)

보통 ref는 primtive, reactive는 object type에 사용한다고 설명

→ 코드 가독성을 위해 한 가지만 선택해 사용하는 게 좋다는 의견이 다수. `ref.value`가 반응형 데이터임을 명확히 해주어 가독성 및 유지보수에 좋음

ref가 **렌더 컨텍스트에서 속성으로 반환되고 템플릿에서 접근**되면, 자동적으로 내부 값을 풀어내므로 `.value`를 추가하지 않아도 된다

[🔥 (#42) Ref vs. Reactive](https://michaelnthiessen.com/weekly-042-january-05/)

1. 객체를 감쌀 때는 ref를 사용해 해당 객체가 반응형임을 명시적으로 보여준다
2. watch 메서드 사용 시, refs는 자동적으로 감싼 객체를 풀어주어 사용이 용이하다
3. refs를 reactive 객체로 감쌀 수 있는데, 이는 reactive 객체이자 ref 객체로서 해당 객체를 사용할 수 있도록 한다

[🔥 (#49) When ref and reactive are the same](https://michaelnthiessen.com/weekly-049-february-23/)

**ref와 reactive가 동일하게 동작할 때**도 있다.

watchEffect를 사용할 때랑, template에서 조회할 때.

<aside>
⭐ **Proxy**란

[JavaScript Proxy Explained Clearly By Practical Examples](https://www.javascripttutorial.net/es6/javascript-proxy/)

다른 객체를 감싸 기본 연산(속성 조회, 할당, 열거 및 함수 호출 등)을 가로채는 객체

- `get()`
  대상 객체의 속성이 프록시 객체를 통해 접근될 때 발생
- `set()`
  대상 객체의 속성이 설정될 때 발생.
- `apply()`
  함수 호출

</aside>

### Vue 3가 Proxy를 사용하는 방법

[](https://levelup.gitconnected.com/when-vue-meets-proxy-402e9e3c6722)

Vue2에서는 Object.definedProperty()를 사용하여 getter/setter를 통해 프로퍼티를 변경

→ 프로퍼티의 삭제나 추가는 추적이 어려움, 중첩되거나 양이 많은 데이터의 경우 모든 속성의 getter/setter 생성을 필요로 함

→ Vue3에서 Proxy 채택!

Vue의 중요 특성은 변동성 감지, Proxy를 사용함으로써 새로운 프로퍼티 추적이나 개선된 처리를 보여준다

Proxy를 사용함으로써 객체에 대한 모든 호출이나 접근을 가로채어 다룰 수 있게 됨

프로퍼티가 존재하지 않는 경우, 새로운 프로퍼티를 생성하고 알릴 수 있다 → Vue2의 단점 개선

프록시 구현 시 데이터의 모든 속성을 타고 내려갈 필요 없어짐 → 대용량 데이터 처리 성능 향상
