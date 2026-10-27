# 04 · Scope, closures, modules

**Time:** ~40 min · **Run:** `node lessons/04-scope-closures-modules.js`

Two ideas that unlock a lot of JavaScript: where variables live, and what a
function remembers after it is created. Then we split code into files.

## Scope: `let`, `const`, and blocks

```js
if (true) {
  let inside = 'visible here';
  const alsoInside = 'here too';
}
// inside, alsoInside are gone out here
```

- `let` — can be reassigned, lives in its block.
- `const` — cannot be reassigned, lives in its block. Note: **const objects can
  still be mutated**, `const` only locks the binding.
- `var` — function-scoped, hoisted, mostly a historical accident. Don't use it.

A variable used before its `let`/`const` line in the same scope throws a
`ReferenceError` ("temporal dead zone"). That is a guard rail, not a bug.

## Closures

A function remembers the scope it was created in, even after that scope returns:

```js
function makeCounter() {
  let count = 0;        // private state
  return () => {
    count += 1;
    return count;
  };
}

const next = makeCounter();
next(); // 1
next(); // 2
```

Nothing outside can touch `count`. This is encapsulation without classes — and
it is how a lot of modern JavaScript is written.

Closures are also how factories make configured functions:

```js
function makeGreeting(greeting) {
  return (name) => `${greeting}, ${name}!`;
}

const hi = makeGreeting('Hi');
hi('Gamp'); // 'Hi, Gamp!'
```

## `once`: a closure you will actually use

```js
function once(fn) {
  let called = false;
  let result;

  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}
```

Useful for expensive setup (open a connection, load config) that should happen
exactly one time.

## Modules (ESM)

This project uses ES modules: `"type": "module"` in `package.json`.

```js
// src/parse.js
export function parseTags(values) { ... }
export const PRIORITIES = ['low', 'medium', 'high'];

// src/cli.js
import { parseTags, PRIORITIES } from './parse.js';
```

Rules worth remembering:

- Use **relative paths with the `.js` extension** (`'./parse.js'`). Node does not
  guess extensions in ESM.
- `export default` is one unnamed export; prefer **named exports** — they are
  easier to find, rename and tree-shake.
- One file = one job. Look at this repo: `store.js` persists, `tasks.js` models,
  `cli.js` talks to the user.

## TS bridge

- `import type { Task } from './types.js'` imports only the type and is erased at
  runtime. Keep runtime values and types separate in your head.
- TS needs to know where `.js` imports come from. With bundlers you often write
  extensionless imports; with plain Node ESM you keep `.js`. Either way, the
  import path you learned here is the path TS resolves.
- Closures and factories type themselves surprisingly well:
  `function makeCounter(): () => number`.
- `const` + object literal infers narrow types, which is why the task manager
  stores tasks as plain objects and copies them (`{ ...task }`) rather than
  mutating.

## Exercises

1. `makeCounter(start = 0)` → a function returning `start + 1`, `start + 2`, …
2. `makeIdGenerator(start = 1)` → a function returning the next id each call.
3. `makeTagFilter(tag)` → a predicate that accepts tasks containing that tag.
4. `once(fn)` → `fn` runs at most once; later calls return the first result.

<details>
<summary>Solution</summary>

```js
function makeCounter(start = 0) {
  let count = start;
  return () => {
    count += 1;
    return count;
  };
}

function makeIdGenerator(start = 1) {
  let next = start;
  return () => {
    const id = next;
    next += 1;
    return id;
  };
}

function makeTagFilter(tag) {
  return (task) => task.tags.includes(tag);
}

function once(fn) {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}
```

</details>

Next: [05 · Errors and validation](05-errors-validation.md)
