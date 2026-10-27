# 01 · Values, types, and equality

**Time:** ~30 min · **Run:** `node lessons/01-values-and-types.js`

Every value in JavaScript has a type. The catch: the language almost never tells
you which one you have. Juggling types in your head is lesson one, because
TypeScript will later ask you to write those types down.

## The primitives

| Type | Examples | Notes |
| --- | --- | --- |
| `string` | `'hi'`, `"hi"`, `` `hi ${name}` `` | text |
| `number` | `42`, `3.14`, `-1`, `NaN`, `Infinity` | one type for integers and floats |
| `boolean` | `true`, `false` | |
| `null` | `null` | "intentionally empty", set by you |
| `undefined` | `undefined` | "not set yet", often from JS itself |
| `bigint` | `10n` | huge integers, rare |
| `symbol` | `Symbol('id')` | unique keys, rare |

Everything else is an **object**: arrays, functions, dates, plain `{}` objects.
A `Task` in this project is an object:

```js
const task = { id: 1, title: 'Buy milk', done: false, tags: ['home'] };
```

## `typeof` and its two famous quirks

```js
typeof 'hi'      // 'string'
typeof 42        // 'number'
typeof null      // 'object'   ← bug kept for backwards compatibility
typeof []        // 'object'   ← arrays are objects
Array.isArray([]) // true      ← the right way to detect arrays
```

So: use `Array.isArray` for arrays, and `value === null` for null.

## Equality: prefer `===`

```js
1 === 1          // true
1 === '1'        // false
1 == '1'         // true   ← converts types, avoid
null == undefined  // true  ← the one useful ==
null === undefined // false
NaN === NaN      // false  ← use Number.isNaN(NaN)
```

`==` performs type coercion using rules almost nobody remembers. `===` compares
type and value. Use `===` unless you are deliberately checking "null or
undefined" with `value == null` — a common idiom.

## Numbers that bite

```js
Number('')        // 0      ← empty string becomes zero
Number('  42 ')   // 42
Number('12px')    // NaN    ← no trailing garbage allowed
Number.isFinite(NaN)      // false
Number.isFinite('42')     // false  ← does not coerce strings
Number.parseInt('12px')   // 12     ← does allow trailing garbage
```

For user input, the safe pattern is: reject empty strings yourself, then use
`Number(...)` and check `Number.isFinite(result)`.

## Truthiness

Every value is either truthy or falsy. The falsy list is short — memorise it:

```js
false, 0, -0, 0n, '', null, undefined, NaN
```

Everything else is truthy, including `'0'`, `[]` and `{}`. That last one is a
classic source of bugs.

## Template literals

```js
const title = 'Buy milk';
const tags = ['home', 'urgent'];
`#1 ${title} (${tags.length} tags)`   // '#1 Buy milk (2 tags)'
```

Also use them instead of `+` when mixing text and values.

## TS bridge

In TypeScript the same values get written down:

```ts
const title: string = 'Buy milk';
let due: string | null = null;      // union: string OR null
const done: boolean = false;
```

- `typeof` checks become **type narrowing**: inside `if (typeof value === 'string')`,
  TS knows `value` is a string.
- Values from outside your program (JSON, CLI args) should be typed `unknown`,
  not `any`. `unknown` forces you to check before using it. That is the same
  discipline as `Number.isFinite` above.
- With `strictNullChecks` (on in every sane config), `null` and `undefined` are
  not silently allowed where a `string` is expected. Lesson 01 is why that is a
  feature, not a nuisance.

## Exercises

Open `lessons/01-values-and-types.js` and fill in the `TODO`s:

1. `describeType(value)` → `'null'`, `'array'`, or `typeof value`.
2. `toNumber(input)` → a finite `number`, or `null` for junk.
3. `formatDue(days)` → `'today'`, `'tomorrow'`, `'yesterday'`, `'in 3d'`, `'2d overdue'`.

<details>
<summary>Solution</summary>

```js
function describeType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function toNumber(input) {
  if (input === null || input === undefined) return null;
  if (typeof input === 'string' && input.trim() === '') return null;
  const value = Number(input);
  return Number.isFinite(value) ? value : null;
}

function formatDue(days) {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days < 0 ? `${-days}d overdue` : `in ${days}d`;
}
```

</details>

Next: [02 · Functions and control flow](02-functions-and-control-flow.md)
