# 06 · Async JavaScript

**Time:** ~45 min · **Run:** `node lessons/06-async.js`

JavaScript runs your code on a single thread. Waiting — for a timer, a file, a
network response — does not block that thread; it is parked and resumed later.
Promises and `async`/`await` are the modern way to work with that.

## Why callbacks became promises

Old style, easy to nest and easy to lose errors:

```js
setTimeout(() => {
  setTimeout(() => {
    console.log('two levels deep, and it gets worse');
  }, 100);
}, 100);
```

A promise represents a **future value**:

```js
const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

await wait(100);
console.log('100ms later');
```

`new Promise((resolve, reject) => ...)` is the low-level constructor. In day-to-day
code you mostly *consume* promises, not build them.

## async / await

```js
async function loadTitle(id) {
  const response = await fetch(`/api/tasks/${id}`); // pauses here
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const task = await response.json();
  return task.title;
}

try {
  console.log(await loadTitle(1));
} catch (error) {
  console.log(`failed: ${error.message}`);
}
```

- `async` makes a function return a promise automatically.
- `await` pauses *this function*, not the program.
- A rejected promise becomes an exception at `await`, so `try`/`catch` works.

## Sequential vs parallel

```js
// sequential: ~200ms
const a = await slow(1);
const b = await slow(2);

// parallel: ~100ms
const [a2, b2] = await Promise.all([slow(1), slow(2)]);
```

If the tasks are independent, start them together. `Promise.all` fails fast on
the first rejection; `Promise.allSettled` waits for all and tells you each outcome:

```js
const results = await Promise.allSettled([ok(), fails()]);
// [{ status: 'fulfilled', value }, { status: 'rejected', reason }]
```

## Timeouts

`Promise.race` resolves or rejects with whichever promise settles first:

```js
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
```

Always clear the timer, or your process may stay alive after the work is done.

## The three mistakes beginners make

1. **Forgetting to `await`.** You get a `Promise { <pending> }` instead of a value.
2. **`await` inside `map` without `Promise.all`.** It works but runs sequentially:
   `await Promise.all(items.map(async (item) => ...))` is usually what you mean.
3. **Not handling rejection.** An unhandled rejection can crash modern Node.

## TS bridge

```ts
async function loadTitle(id: number): Promise<string> {
  const response = await fetch(`/api/tasks/${id}`);
  return (await response.json()).title;
}

function wait(ms: number): Promise<void> { ... }

type Loaded = Awaited<ReturnType<typeof loadTitle>>; // string
```

- An `async` function's return type is `Promise<...>`, never the bare value.
- `Promise<void>` is the type for "finishes, nothing to return".
- TS checks that you handled a possibly-`null` value **before** awaiting it, and
  that `try`/`catch` variables are `unknown`.
- In `Promise.all([...])`, the tuple of results is inferred positionally, so the
  order of results matches the array — same as at runtime.

## Exercises

1. `delayValue(ms, value)` → promise that resolves with `value` after `ms`.
2. `doubleAll(values)` → doubles each value using `delayValue`, in parallel,
   preserving order.
3. `withTimeout(promise, ms)` → resolves as usual, or rejects with
   `Error('Timeout')`.
4. `settleCount(promises)` → `{ fulfilled, rejected }` using `Promise.allSettled`.

<details>
<summary>Solution</summary>

```js
function delayValue(ms, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function doubleAll(values) {
  const doubled = values.map((value) => delayValue(50, value * 2));
  return Promise.all(doubled);
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function settleCount(promises) {
  const results = await Promise.allSettled(promises);
  return {
    fulfilled: results.filter((result) => result.status === 'fulfilled').length,
    rejected: results.filter((result) => result.status === 'rejected').length,
  };
}
```

</details>

Next: [07 · Classes and `this`](07-classes-this.md)
