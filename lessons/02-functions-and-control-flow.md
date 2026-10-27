# 02 · Functions and control flow

**Time:** ~35 min · **Run:** `node lessons/02-functions-and-control-flow.js`

Functions are the unit of everything in JavaScript — and in TypeScript, function
signatures are where types earn their keep.

## Three ways to write one

```js
function add(a, b) { return a + b; }        // declaration
const mul = function (a, b) { return a * b; }; // expression
const sub = (a, b) => a - b;                 // arrow
```

Differences that matter:

- **Declarations are hoisted.** You can call `add` before the line where it is
  defined. `const` arrows are not — calling early throws.
- **Arrows have no own `this`.** Important in lesson 07.
- **Arrows with no braces return the expression**: `(a, b) => a - b`. With
  braces you must write `return` yourself. This bites everyone once.

## Parameters

```js
function greet(name = 'stranger', greeting = 'Hello') {
  return `${greeting}, ${name}!`;
}

greet();                    // 'Hello, stranger!'
greet('Gamp');              // 'Hello, Gamp!'
greet(undefined, 'Hi');     // 'Hi, stranger!'
```

Default values only apply when the argument is `undefined` — not when it is
`null`.

**Rest parameters** collect the leftovers into an array:

```js
function total(...numbers) {
  return numbers.reduce((sum, n) => sum + n, 0);
}

total(1, 2, 3); // 6
```

**Destructuring parameters** pull fields out of an object at the call boundary:

```js
function addTask({ title, priority = 'medium' }) {
  return { title, priority };
}

addTask({ title: 'Buy milk' });
```

## Control flow: return early

Deep `if` nesting is hard to read. Guard clauses put the exceptional cases first
and leave the happy path unindented:

```js
function priorityWeight(priority) {
  if (priority === 'high') return 3;
  if (priority === 'medium') return 2;
  if (priority === 'low') return 1;
  throw new Error(`Unknown priority: ${priority}`);
}
```

That last line matters: a function should either return a real value or throw.
Returning `undefined` silently is how bugs hide.

`switch` is the same idea when you compare one value against many:

```js
switch (priority) {
  case 'high': return 3;
  case 'medium': return 2;
  case 'low': return 1;
  default: throw new Error(`Unknown priority: ${priority}`);
}
```

## Functions as values

Functions can be passed around and returned:

```js
function applyTwice(fn, value) {
  return fn(fn(value));
}

applyTwice((n) => n * 2, 3); // 12
```

This is the seed of `map`, `filter` and `reduce` in the next lesson.

## TS bridge

```ts
function greet(name: string = 'stranger'): string {
  return `Hello, ${name}!`;
}

function priorityWeight(priority: 'low' | 'medium' | 'high'): number { ... }

const sub = (a: number, b: number): number => a - b;
```

- Types go **after** the parameter name, and after the parentheses for the
  return type.
- A union like `'low' | 'medium' | 'high'` replaces a stringly-typed `priority`
  and makes the `default` branch impossible to forget (TS errors if you miss a
  case when the union is the only input).
- A function that only throws has return type `never`. A function that returns
  nothing has `void`.
- `strict` mode also checks that every code path returns a value.

## Exercises

1. `clamp(value, min, max)` — keep a number inside a range.
2. `priorityWeight(priority)` — `'high'` → 3, `'medium'` → 2, `'low'` → 1,
   anything else throws.
3. `applyTwice(fn, value)`.
4. `formatCount(count, word)` — `1 task`, `2 tasks`, `0 tasks`.

<details>
<summary>Solution</summary>

```js
function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function priorityWeight(priority) {
  switch (priority) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: throw new Error(`Unknown priority: ${priority}`);
  }
}

function applyTwice(fn, value) {
  return fn(fn(value));
}

function formatCount(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}
```

</details>

Next: [03 · Arrays, objects, immutability](03-arrays-objects-immutability.md)
