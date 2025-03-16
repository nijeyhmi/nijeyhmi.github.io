---
title: "SFC CSS"
date: "2024.01.30."
tags: ["Vue", "SFC", "CSS"]
---

[SFC CSS Features | Vue.js](https://vuejs.org/api/sfc-css-features.html?ck_subscriber_id=1762872175&utm_source=convertkit&utm_medium=email&utm_campaign=%F0%9F%94%A5+%28%2390%29+Destructuring+in+a+v-for%20-%209582658#sfc-css-features)

## Deep Selectors

style scoped에서 지정한 CSS 값을 자식 컴포넌트까지 전달하고 싶을 경우 사용

```css
<style scoped>
.a :deep(.b) {
	/* ... */
}
</style>
```

## Slotted Selectors

기본값으로 scoped styles는 slot 내에 렌더링되는 컨텐츠에 영향을 끼치지 않는다.

slot 컨텐츠를 명시적으로 타겟팅하기 위해서 사용

```css
<style scoped>
	:slotted(div) {
		color: red;
	}
</style>
```

## Global Selectors

하나의 선택자만 전역적으로 CSS를 적용하고 싶을 때 사용

```css
<style scoped>
	:global(.red) {
		color: red;
	}
</style>
```

## CSS Modules

`<style module>` 태그는 CSS Module로 컴파일되며, CSS 클래스를 `$style` 키 값을 가진 객체로 만들어 컴포넌트 template 태그 내에서 사용할 수 있도록 한다

```css
<template>
  <p :class="$style.red">This should be red</p>
</template>

<style module>
.red {
  color: red;
}
</style>
```

module 어트리뷰트에 값을 지정하면 커스텀 키 값을 지정할 수 있다

```css
<template>
  <p :class="classes.red">red</p>
</template>

<style module="classes">
.red {
  color: red;
}
</style>
```

### Composition API

useCssModule 메서드를 사용

```css
import { useCssModule } from 'vue'

// inside setup() scope...
// default, returns classes for <style module>
useCssModule()

// named, returns classes for <style module="classes">
useCssModule('classes')
```

## v-bind() in CSS

vue의 data 값을 style 태그 내에서 사용 가능

```css
<template>
  <div class="text">hello</div>
</template>

<script>
export default {
  data() {
    return {
      color: 'red'
    }
  }
}
</script>

<style>
.text {
  color: v-bind(color);
}
</style>

//script setup
<script setup>
const theme = {
  color: 'red'
}
</script>

<template>
  <p>hello</p>
</template>

<style scoped>
p {
  color: v-bind('theme.color');
}
</style>
```
