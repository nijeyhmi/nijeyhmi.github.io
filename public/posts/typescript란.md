---
title: "타입스크립트 기초"
date: "2022.05.25."
tags: ["TS"]
---

## 타입스크립트란

자바스크립트에 타입을 부여한 언어

자바스크립트의 확장된 언어

→ 브라우저에서 실행하려면 파일을 한 번 변환해 주어야 한다(컴파일)

### Why Typescript?

- 에러의 사전 방지
- 코드 가이드 및 자동 완성으로 인한 개발 생산성 향상

## 기본 타입

- `Boolean`
- `Number`
- `String`
- `Object`
- `Array`
- `Tuple`
  배열 길이 고정, 요소 타입 지정
- `Enum`

  상수들의 집합, 인덱스로도 접근 가능

- `Any`
- `Void`
  변수에 undefined와 null만 할당, 리턴값 X
- `Null`
- `Undefined`
- `Never`
  절대 함수의 끝까지 실행되지 않음을 의미

<aside>
⭐ Any는 보통 TypeScript 원칙에 위배된다고 사용하지 않을 것을 권한다. 그럼 Any는 언제 사용하는가?

→ js에서 ts로 **마이그레이션**할 때 사용한다

allowJS를 해놓고 any로 일단 해놓은 다음 점진적으로 바꾼다

</aside>

## 함수

- 함수의 파라미터(매개변수) 타입
  타입스크립트에서는 함수의 인자를 필수값으로 간주
  정의된 매개변수 값만 받을 수 있고 추가로 인자를 받을 수 없음
  → 특성을 살리고 싶다면 `?` 이용
  ```jsx
  function sum(a: number, b?: number): number {
    return a + b;
  }
  sum(10, 20);
  sum(10);
  ```
- 함수의 반환 타입
- 함수의 구조 타입

### this

타입스크립트에서는 자바스크립트의 this가 잘못 사용되었을 때 감지 가능

this가 가리키는 것을 명시하려고 할 때 다음과 같이 사용

```jsx
function fcName(this: type) {
  //...
}
```

콜백으로 함수가 전달되었을 때의 this를 구분해주어야 할 때는 다음과 같이 사용

```jsx
interface UIElement {
  //'this:void' 코드는 함수에 'this' 타입을 선언할 필요가 없다는 의미
  addClickListener(onclick: (this: void, e: Event) => void): void;
}

class Handler {
  info: string;
  onClick(this: void, e: Event) {
    console.log("clicked");
  }
}

let handler = new Handler();
uiElement.addClickListener(handler.onClick);
```

---

## 인터페이스

상호 간에 정의한 약속 혹은 규칙

타입스크립트에서는 다음과 같은 범주에 대해 약속 정의 가능

- 객체의 스펙(속성과 속성 타입)
- 함수의 파라미터
- 함수의 스펙(파라미터, 반환 타입 등)
- 배열과 객체를 접근하는 방식
- 클래스

타입스크립트는 인터페이스를 이용하여 객체를 선언할 때 좀 더 엄밀한 속성 검사를 진행

### 옵션 속성

인터페이스 사용 시 인터페이스에 정의되어 있는 속성을 모두 다 사용할 필요 없다

```jsx
interface CraftBeer {
  name: string;
  hop?: number;
}

let myBeer = {
  name: "Saporo",
};
function brewBeer(beer: CraftBeer) {
  console.log(beer.name); //Saporo
}
brewBeer(myBeer);
```

Beer 인터페이스를 인자의 타입으로 사용해도 hop은 옵션 속성이므로 없어도 가능

→ 인터페이스를 사용할 때 속성을 선택적으로 적용할 수 있다는 것뿐 아니라 인터페이스에 정의되어 있지 않은 속성에 대해 인지시켜줄 수 있다

### `readonly`읽기 전용 속성

인터페이스로 객체를 처음 생성할 때만 값을 할당하고 그 이후에는 변경할 수 없음

`ReadonlyArray<T>` 읽기 전용 배열 → 배열 내용 변경 불가

### 함수 타입

함수의 인자 타입과 리턴 값의 타입 지정

```jsx
interface login {
  (username: string, password: string): boolean;
}

let loginUser: login;
loginUser = function (id: string, pw: string) {
  console.log("로그인했습니다");
  return true;
};
```

### 클래스 타입

클래스가 일정 조건을 만족하도록 타입 규칙 지정

```jsx
interface CraftBeer {
  beerName: string;
  nameBeer(beer: string): void;
}

class myBeer implements CraftBeer {
  beerName: string = "Baby Guinness";
  nameBeer(b: string) {
    this.beerName = b;
  }
  constructor() {}
}
```

### 인터페이스 확장

인터페이스 간 확장이나 여러 인터페이스를 상속 받아 사용하는 것 가능

```jsx
interface Person {
	name: string;
}
interface Developer extends Person {
	skill: string;
}
let fe = {} as Developer;
fe.name = 'josh';
fe.skill = 'Typescript';
```

```jsx
interface Person {
	name: string;
}
interface Drinker {
	drink: string;
}
interface Developer extends Person {
	skill: string;
}
let fe = {} as Developer;
fe.name = 'josh';
fe.skill = 'Typescript';
fe.drink = 'Beer';
```

### 하이브리드 타입

여러 타입을 조합하여 생성 가능 → 함수 타입이면서 객체 타입 정의 가능

```jsx
interface CraftBeer {
	(beer: string): string;
	brand: string;
	brew(): void;
}

function myBeer(): CraftBeer {
	let my = (function(beer: string) {}) as CraftBeer;
	my.brand = 'Beer Kitchen';
	my.brew = function(){}
	return my;
}

let brewedBeer = myBeer();
brewdBeer('My First Beer');
brewedBeer.brand = 'Pangyo Craft';
brewedBeer.brew();
```

---

## Enum

특정 값들의 집합을 의미하는 자료형

- 문자형 enum
- 숫자형 enum

런타임 시 객체로 존재하지만, `keyof` 대신 `keyof typeof` 사용 권고

### 숫자형 enum

```jsx
enum Direction {
	//초기값을 주면 초기값부터 1씩 증가
	Up = 1, //1
	Down, //2
	Left, //3
	Right //4
}

enum Direction {
	//초기값을 주지 않으면 0부터 차례로 1씩 증가
	Up, //0
	Down, //1
	Left, //2
	Right //3
}
```

선언 시 만약 enum 값에 다른 enum 타입의 값을 사용하면 선언하는 enum의 첫 번째 값에 초기화 필요

- 리버스 매핑
  숫자형에만 가능
  enum의 key로 value를 얻을 수 있고, value로 key를 얻는 것 가능
  ```jsx
  enum Enum {
  	A
  }
  let a = Enum.A;
  let keyName = Enum[a];
  ```

### 문자형 enum

숫자형 enum과는 런타임에서의 미세한 차이 존재

enum값 전부 다 특정 문자 또는 다른 enum 값으로 초기화 필요

숫자형과 다르게 자동 값 증가가 없는 대신, 디버깅 시 항상 명확한 값이 나와 읽기 편하다(숫자형은 가끔 값이 불명확하게 나올 때가 있음)

```jsx
enum Direction {
	Up = "UP",
	Down = "DOWN",
	Left = "LEFT",
	Right = "RIGHT"
}
```

### 복합 enum(Heterogeneous Enums)

기술적은 문자와 숫자를 혼합하여 생성 가능하나, 권고 X

---

## 연산자

### `|` Union Type

A이거나 B이다

any를 사용하는 경우 타입스크립트를 빠져나와 변수의 타입에 대한 제한이 없어진다

그러나 유니온 타입을 사용하면 타입스크립트의 이점인 타입에 제한을 두는 것은 그대로 작동한다

```jsx
function getAge(age: number | string) {
  if (typeof age === "number") {
    age.toFixed();
    return age;
  }
  if (typeof age === "string") {
    return age;
  }
  return new TypeError("age must be number or string");
}
```

### `&` Intersection Type

여러 타입을 모두 만족하는 하나의 타입

```jsx
interface Person {
  name: string;
  age: number;
}
interface Developer {
  name: string;
  skill: number;
}
//Person 인터페이스의 타입 정의와 Developer 인터페이스의 타입 정의를 & 연산자를 이용하여 합친 후 Capt라는 타입에 할당
type Capt = Person & Developer;
```

---

## 클래스

### `readonly`

접근만 가능

### Accessor

타입스크립트는 객체의 특정 속성의 접근과 할당에 대해 제어 가능

단, 해당 객체가 클래스로 생성한 객체여야 한다

```jsx
class Developer {
	private name: string;

	get name(): string {
		return this.name;
	}
	set name(newValue: string) {
		if(newValue && newValue.length > 5) {
			throw new Error('이름이 너무 길어요');
		}
		this.name = newValue;
	}
}
const josh = new Developer();
josh.name = 'Josh Bolton';//Error
josh.name = 'Josh';
```

이때, getter만 선언하면 자동으로 readonly로 인식된다

### Abstract Class

특정 클래스의 상속 대상이 되는 클래스

좀 더 상위 레벨에서 속성, 메서드의 모양을 정의

```jsx
abstract class Developer {
	abstract coding(): void;
	drink(): void {
		console.log('drink');
	}
}

class FrontEndDeveloper extends Developer {
	//Developer를 상속 받았으므로 무조건 정의해야 함
	coding(): void {
		console.log('develop web');
	}
	design(): void {
		console.log('design web');
	}
}

const dev = new Developer(); //Error 인터페이스는 인스턴스 생성 불가
const josh = new FreontEndDeveloper();
josh.coding();
josh.drink();
josh.design();
```

---

## 제네릭

타입을 마치 함수의 파라미터처럼 사용하는 것

타입스크립트에서 함수 호출 시 넘긴 타입에 대해 추정하여 해당 타입을 부여

---

## 타입 추론

타입스크립트가 코드를 해석해 나가는 동작

변수를 선언하거나 초기화할 때, 변수, 속성, 인자의 기본 값, 함수의 반환 값 등을 설정할 때 타입 추론 발생

타입스크립트는 **값의 형태**에 기반한 타입 체크를 지향한다

- `Duck Typing`
  객체의 변수 및 메서드의 집합이 객체의 타입을 결정하는 것을 의미
  사람이 오리처럼 행동하면 오리로 봐도 무방하다
  타입을 미리 정하는 게 아니라 실행이 되었을 때 해당 메서드들을 확인하여 타입을 정한다
- `Structual Subtyping`
  객체의 실제 구조나 정의에 따라 타입을 결정하는 것을 의미
  서로 다른 두 타입 간의 호환성은 오로지 타입 내부의 구조에 의해 결정된다
  타입이 계층구조로부터 자유로움
  [Structural Subtyping](https://medium.com/@seungha_kim_IT/structural-subtyping-346af4dffe77)

---

## 타입 호환

타입스크립트 코드에서 특정 타입이 다른 타입에 잘 맞는지를 의미

```jsx
interface Ironman {
  name: string;
}
class Avengers {
  name: string;
}

let i: Ironman;
i = new Avengers();
```

→ 구조적 타이핑(Structual Subtyping) 때문

타입스크립트가 추론한 i의 타입은 {name: string;}

Ironman 인터페이스에서 name 속성을 갖고 있으므로 i, Avengers 인스턴스는 Ironman 타입에 호환될 수 있다

### Soundness

컴파일 시점에 타입을 추론할 수 없는 특정 타입에 대해서 일단 안전하다고 보는 특성

### enum 타입 호환 주의사항

enum 타입은 number 타입과 호환되지만, enum 타입끼리는 호환되지 않는다

### class 타입 호환 주의사항

클래스 타입은 클래스 타입끼리 비교할 때 static member와 constructor를 제외하고 속성만 비교

### Generics

제네릭 타입 간의 호환 여부는 타입 인자 <T>가 속성에 할당되었는지를 기준으로 한다

---

## 타입 별칭

특정 타입이나 인터페이스를 참조할 수 있는 타입 변수

새로운 타입 값을 하나 생성하는 것이 아니라 정의한 타입에 대해 나중에 쉽게 참고할 수 있게 이름을 부여하는 것

### type vs. interface

[Documentation - Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)

타입의 확장 가능/불가능 여부

인터페이스는 확장이 가능한데 반해 타입 별칭은 확장이 불가능하다 → 버전이 업그레이드되면서 수정되었다. 이제는 둘 다 확장 가능

인터페이스는 객체 및 메서드 객체에서, type은 함수, 복잡한 type 등에서 사용

[Types vs. interfaces in TypeScript - LogRocket Blog](https://blog.logrocket.com/types-vs-interfaces-in-typescript/)

type은 primitive type에도 사용이 가능하다. 새로 정의하는 것이 아니라 별칭을 부여하는 것이기 때문

반면, 인터페이스는 객체로만 선언이 가능하다.

둘 다 extends, implements 사용이 가능하지만, union type은 사용이 불가능

Type으로 만들어진 정적 타입에 extends, implements 키워드가 사용 가능한 사실은 공식 문서에 명시되어 있지 않다고 함
