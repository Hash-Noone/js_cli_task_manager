// Lesson 06 — Async JavaScript
// Run: node lessons/06-async.js
import { assert, check, section, summary } from './lib/check.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

section('Promises and await');

console.log('before');
await delay(50);
console.log('after ~50ms');

function delayValue(ms, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

console.log(await delayValue(20, 'resolved value'));

section('Sequential vs parallel');

async function slowDouble(value, ms = 100) {
  await delay(ms);
  return value * 2;
}

let start = Date.now();
const sequential = [await slowDouble(1), await slowDouble(2)];
console.log(`sequential: ${sequential.join(', ')} in ~${Date.now() - start}ms`);

start = Date.now();
const parallel = await Promise.all([slowDouble(1), slowDouble(2)]);
console.log(`parallel:   ${parallel.join(', ')} in ~${Date.now() - start}ms`);

section('Errors and allSettled');

async function mayFail(shouldFail) {
  await delay(10);
  if (shouldFail) throw new Error('nope');
  return 'ok';
}

try {
  await Promise.all([mayFail(false), mayFail(true)]);
} catch (error) {
  console.log(`Promise.all failed fast: ${error.message}`);
}

const settled = await Promise.allSettled([mayFail(false), mayFail(true)]);
console.log(settled.map((result) => result.status));

section('Exercises');

// 1. delayValueRediscovered(ms, value)
function delayed(ms, value) {
  // TODO: return a promise that resolves with value after ms
}

await check('delayed resolves with the value', async () => {
  assert.equal(await delayed(10, 'hello'), 'hello');
});

await check('delayed actually waits', async () => {
  const started = Date.now();
  await delayed(40, null);
  assert.ok(Date.now() - started >= 30, 'resolved too early');
});

// 2. doubleAll(values) — use delayValue and Promise.all
function doubleAll(values) {
  // TODO: map to promises, then Promise.all
}

await check('doubleAll preserves order', async () => {
  assert.deepEqual(await doubleAll([1, 2, 3]), [2, 4, 6]);
});

await check('doubleAll runs in parallel', async () => {
  const started = Date.now();
  const result = await doubleAll([1, 2, 3]); // each delay is 50ms
  const elapsed = Date.now() - started;
  assert.deepEqual(result, [2, 4, 6]);
  assert.ok(elapsed < 120, `looks sequential (${elapsed}ms)`);
});

// 3. withTimeout(promise, ms)
function timeout(promise, ms) {
  // TODO: Promise.race with a rejecting timer; clear the timer afterwards
}

await check('withTimeout passes fast results through', async () => {
  assert.equal(await timeout(delayed(10, 'fast'), 100), 'fast');
});

await check('withTimeout rejects slow promises', async () => {
  await assert.rejects(timeout(delayed(100, 'slow'), 20), /Timeout/);
});

// 4. settleCount(promises) -> { fulfilled, rejected }
async function settleCount(promises) {
  // TODO: Promise.allSettled, then count statuses
}

await check('settleCount reports both outcomes', async () => {
  const rejected = Promise.reject(new Error('b'));
  rejected.catch(() => {}); // avoid an unhandled rejection while the stub is unsolved
  const counts = await settleCount([
    Promise.resolve('a'),
    rejected,
    Promise.resolve('c'),
  ]);
  assert.deepEqual(counts, { fulfilled: 2, rejected: 1 });
});

summary();
