# 08 · Testing and the TypeScript bridge

**Time:** ~45 min · **Run:** `node lessons/08-testing-and-typescript.js`

Tests are how you change code without fear. They are also the cheapest way to
learn a language: a test is a tiny, repeatable experiment.

## `node:test` in 20 lines

Node ships a test runner. No dependency needed:

```js
// test/example.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { truncate } from '../src/format.js';

test('truncate keeps short text', () => {
  assert.equal(truncate('hello', 10), 'hello');
});

test('truncate adds an ellipsis', () => {
  assert.equal(truncate('hello world', 8), 'hello w…');
});
```

Run it:

```sh
node --test test/        # what `npm test` does
node --test test/args.test.js
```

Structure every test the same way:

1. **Arrange** the input.
2. **Act** by calling one thing.
3. **Assert** the result.

One behaviour per test. A failing test name should tell you what broke without
opening the file.

## Table-driven tests

When the same logic is checked with many inputs, loop over a table:

```js
const cases = [
  { input: 'hello', width: 10, expected: 'hello' },
  { input: 'hello world', width: 8, expected: 'hello w…' },
];

for (const { input, width, expected } of cases) {
  test(`truncate(${input}, ${width})`, () => {
    assert.equal(truncate(input, width), expected);
  });
}
```

The task manager's own suite (`test/`) does this for dates and priorities.

## Types in plain JavaScript: JSDoc

You can document and check types in `.js` files, without renaming anything:

```js
/**
 * @typedef {Object} Task
 * @property {number} id
 * @property {string} title
 * @property {boolean} done
 * @property {string[]} [tags]
 */

/**
 * @param {Task} task
 * @returns {string}
 */
function describeTask(task) {
  return `#${task.id} ${task.title}${task.done ? ' (done)' : ''}`;
}
```

VS Code understands this immediately. To check it from the terminal, install
TypeScript and point it at the file:

```sh
npm i -D typescript
npx tsc --noEmit --allowJs --checkJs --strict \
  --module nodenext --moduleResolution nodenext src/parse.js
```

Add `// @ts-check` to the top of a file to have the editor check it even without
a `tsconfig.json`.

## The TS bridge, concretely

| JavaScript | TypeScript |
| --- | --- |
| `const id = 1` | inferred as `number` — no annotation needed |
| `let due = null` | `let due: string \| null = null` |
| `function f(a, b)` | `function f(a: string, b?: number): void` |
| object literals | `interface Task { ... }` |
| `typeof x === 'string'` guard | narrowing of `unknown` / unions |
| `'low' \| 'medium' \| 'high'` comments | literal union types |
| `class Store` | `private`, `readonly`, `implements` |
| `import { x } from './y.js'` | same path, plus `import type` |

A first `tsconfig.json` (strict from day one, always):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "allowJs": true,
    "checkJs": true
  },
  "include": ["src/**/*.js"]
}
```

`strict` bundles `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes` and
friends. Turning it on later is painful, so turn it on now — this is a fresh
project with nothing to break.

## Capstone: type-check `src/parse.js` without rewriting it

This is the exact migration path used in real codebases: **annotate first,
rename later**.

1. Install TypeScript: `npm i -D typescript`
2. Save the `tsconfig.json` above in the project root.
3. Add JSDoc to `src/parse.js`:
   - `parsePriority(value)` — `@param {unknown}`, `@returns {'low'|'medium'|'high'}`
   - `parseTags(values)` — `@param {string|string[]|null|undefined}`, `@returns {string[]}`
   - `parseDue(value, now)` — `@returns {string|null|undefined}`
   - `PRIORITY_ALIASES` needs `@type {Record<string, 'low'|'medium'|'high'>}`
4. Run `npx tsc -p tsconfig.json` and fix each error. Some will be real bugs;
   most will be missing information. Do not silence them with `any`.
5. Run `npm test` — behaviour must not change.
6. Only then, if you want, rename `parse.js` to `parse.ts` and delete the JSDoc
   that became annotations.

When you are done, this is your graduation exercise: do the same for
`src/tasks.js`, then `src/dates.js`. You will have typed most of a real program
without a rewrite.

## Exercises

1. `countOpen(tasks)` — count tasks where `done` is false. Add JSDoc.
2. `isTask(value)` — a runtime shape check returning `boolean` (id positive
   integer, title non-empty string, done boolean).
3. `titleOf(input)` — accept a `string` or a task-like object, return a trimmed
   title, throw otherwise.
4. The file already runs a table of tests against the real `truncate` in
   `src/format.js`; read it and then write two more `check` cases of your own.

<details>
<summary>Solution</summary>

```js
/**
 * @param {{ done: boolean }[]} tasks
 * @returns {number}
 */
function countOpen(tasks) {
  return tasks.reduce((count, task) => count + (task.done ? 0 : 1), 0);
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isTask(value) {
  if (typeof value !== 'object' || value === null) return false;
  const task = /** @type {Record<string, unknown>} */ (value);
  return Number.isInteger(task.id)
    && Number(task.id) > 0
    && typeof task.title === 'string'
    && task.title.trim() !== ''
    && typeof task.done === 'boolean';
}

/**
 * @param {string | { title?: unknown }} input
 * @returns {string}
 */
function titleOf(input) {
  if (typeof input === 'string' && input.trim() !== '') {
    return input.trim();
  }
  if (typeof input === 'object' && input !== null
      && typeof input.title === 'string' && input.title.trim() !== '') {
    return input.title.trim();
  }
  throw new Error('Cannot read a title from that value.');
}
```

</details>

## Where to go next

- Read the whole `src/` folder in this repo and translate one file per evening.
- Rebuild a small feature in TypeScript: `task add` with a typed `Task`.
- Learn `Partial<T>`, `Pick<T, K>` and `Record<K, V>` — they appear in every
  codebase.
- Then generics: `function first<T>(items: T[]): T | undefined`.
- Only after that: `satisfies`, `as const`, and library types.

Back to the [course index](README.md).
