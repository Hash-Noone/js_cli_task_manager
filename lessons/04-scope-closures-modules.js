// Lesson 04 — Scope, closures, modules
// Run: node lessons/04-scope-closures-modules.js
import { assert, check, section, summary } from './lib/check.js';
// Importing from the real project: no side effects, just functions.
import { parsePriority, parseTags } from '../src/parse.js';

section('Block scope');

{
  const message = 'inside the block';
  console.log(message);
}
// console.log(message); // would throw ReferenceError

let outside = 'before';
{
  let outside = 'shadowed inside';
  console.log(outside);
}
console.log(outside);

try {
  console.log(temporal); // declared below in this block
  const temporal = 'too late';
} catch (error) {
  console.log(`TDZ: ${error.name}: ${error.message}`);
}

section('Closures');

function makeCounter() {
  let count = 0;
  return () => {
    count += 1;
    return count;
  };
}

const next = makeCounter();
console.log(next(), next(), next());

function makeGreeting(greeting) {
  return (name) => `${greeting}, ${name}!`;
}

const hi = makeGreeting('Hi');
console.log(hi('Gamp'));

section('once: a useful closure');

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

let calls = 0;
const init = once(() => {
  calls += 1;
  return 'ready';
});
console.log(init(), init(), `fn ran ${calls} time(s)`);

section('Modules: using the project code');

console.log(parseTags(['#Home, work', 'home', 'URGENT']));
console.log(parsePriority('H'));
try {
  parsePriority('whenever');
} catch (error) {
  console.log(`parsePriority threw: ${error.message}`);
}

section('Exercises');

// 1. makeCounter(start = 0) -> () => number
function makeCounterFrom(start = 0) {
  // TODO: keep private state in a closure
}

await check('counter starts at start + 1', () => {
  const counter = makeCounterFrom(10);
  assert.equal(counter(), 11);
  assert.equal(counter(), 12);
});

await check('two counters are independent', () => {
  const a = makeCounterFrom();
  const b = makeCounterFrom();
  a();
  a();
  assert.equal(a(), 3);
  assert.equal(b(), 1);
});

// 2. makeIdGenerator(start = 1) -> () => number
function makeIdGenerator(start = 1) {
  // TODO
}

await check('id generator increments', () => {
  const nextId = makeIdGenerator(7);
  assert.equal(nextId(), 7);
  assert.equal(nextId(), 8);
  assert.equal(nextId(), 9);
});

// 3. makeTagFilter(tag) -> (task) => boolean
function makeTagFilter(tag) {
  // TODO: return a function that checks task.tags
}

await check('tag filter remembers its tag', () => {
  const isWork = makeTagFilter('work');
  assert.equal(isWork({ tags: ['work', 'urgent'] }), true);
  assert.equal(isWork({ tags: ['home'] }), false);
  assert.equal(isWork({ tags: [] }), false);
});

// 4. once(fn)
function onceOnly(fn) {
  // TODO
}

await check('once runs the function only once', () => {
  let count = 0;
  const run = onceOnly(() => {
    count += 1;
    return 'done';
  });
  assert.equal(run(), 'done');
  assert.equal(run(), 'done');
  assert.equal(count, 1);
});

summary();
