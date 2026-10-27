# JavaScript lessons — with TypeScript next

A hands-on beginner course for JavaScript, written for someone who is about to
learn TypeScript. Every lesson uses the task manager in this repo as its
example, and every lesson ends with a "TS bridge" section: the same idea, typed.

TypeScript is JavaScript plus type annotations. If the JavaScript underneath is
fuzzy, the types just paper over the fog. So the goal here is not "memorise
syntax" — it is to know what the runtime actually does, so that types later
describe reality instead of hiding it.

## How to use this course

1. Read the lesson `.md` file.
2. Run its `.js` file: `node lessons/01-values-and-types.js`
3. Do the exercises at the bottom of the file (look for `TODO`).
4. Run it again until the summary says `0 failed`.
5. Stuck? Each lesson's `.md` has `<details>` solutions.

Requires Node 18+ (you have it). No dependencies, no build step.

## The lessons

| # | Lesson | You will learn | Time |
| --- | --- | --- | --- |
| 01 | [Values, types, equality](01-values-and-types.md) | primitives, `typeof`, `===`, coercion, truthiness | 30 min |
| 02 | [Functions and control flow](02-functions-and-control-flow.md) | parameters, defaults, rest, guard clauses, `switch` | 35 min |
| 03 | [Arrays, objects, immutability](03-arrays-objects-immutability.md) | `map`/`filter`/`reduce`, spread, optional chaining, copies | 45 min |
| 04 | [Scope, closures, modules](04-scope-closures-modules.md) | `let`/`const`, closures, factories, ESM imports | 40 min |
| 05 | [Errors and validation](05-errors-validation.md) | `throw`, `try`/`catch`, custom errors, validating input | 35 min |
| 06 | [Async JavaScript](06-async.md) | promises, `async`/`await`, `Promise.all`, timeouts | 45 min |
| 07 | [Classes and `this`](07-classes-this.md) | class fields, private state, binding, when to avoid classes | 35 min |
| 08 | [Testing and the TypeScript bridge](08-testing-and-typescript.md) | `node:test`, JSDoc types, `tsc --checkJs`, capstone | 45 min |

Roughly one week at one or two lessons a day. Don't rush 03 and 06 — they are
the two that pay off most in real code.

## The JS → TS bridge at a glance

| JavaScript you know | TypeScript concept | Lesson |
| --- | --- | --- |
| `typeof value` / `Array.isArray` | narrowing, `unknown` | 01 |
| `const title = 'x'` | inference, annotations, `readonly` | 01, 03 |
| `function f(a, b = 1)` | parameter and return types, optional `?` | 02 |
| `switch` with a default throw | exhaustive unions, `never` | 02, 05 |
| `{ id: 1, title: 'x' }` | `interface` / `type` | 03 |
| `task.due ?? 'none'` | optional properties, strict null checks | 03 |
| `import { x } from './y.js'` | `import type`, module resolution | 04 |
| `throw new Error()` | `unknown` in `catch`, custom error classes | 05 |
| `async function f()` | `Promise<T>`, `Awaited<T>` | 06 |
| `class Store {}` | `private`, `readonly`, `implements` | 07 |
| `assert.equal` tests | typed test data, `satisfies` | 08 |

## Rules of the road

- Type the code in the editor yourself; don't copy-paste the solutions.
- Break things on purpose. The exercises are throwaway code.
- If output surprises you, `console.log` it. That habit transfers directly to TS.
- Run `npm test` in the project whenever you touch `src/`.

## Capstone

Lesson 08 ends with a real task: take `src/parse.js`, add JSDoc types, and check
it with the TypeScript compiler — without rewriting it in `.ts` yet. That is the
smallest possible step from JS to TS, and it is exactly how large codebases
migrate.
