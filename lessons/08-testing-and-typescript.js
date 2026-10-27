// Lesson 08 — Testing and the TypeScript bridge
// Run: node lessons/08-testing-and-typescript.js
import { assert, check, section, summary } from './lib/check.js';
// Real code from the project, tested from a lesson:
import { truncate } from '../src/format.js';

section('assert: the four calls you need');

assert.equal(1 + 1, 2);
assert.deepEqual([1, 2], [1, 2]);
assert.notEqual('1', 1);
assert.throws(() => {
  throw new Error('boom');
}, /boom/);
console.log('all demo assertions passed');

section('Table-driven tests against src/format.js');

const truncateCases = [
  ['text that fits is unchanged', 'hello', 10, 'hello'],
  ['text at exactly the width', 'hello', 5, 'hello'],
  ['long text gets an ellipsis', 'hello world', 8, 'hello w…'],
  ['width of one is still useful', 'hello', 1, '…'],
];

for (const [label, text, width, expected] of truncateCases) {
  await check(label, () => assert.equal(truncate(text, width), expected));
}

section('JSDoc types (documentation the editor understands)');

/**
 * @typedef {Object} Task
 * @property {number} id
 * @property {string} title
 * @property {boolean} done
 * @property {string[]} [tags] optional property
 */

/**
 * @param {Task} task
 * @returns {string}
 */
function describeTask(task) {
  const tags = task.tags?.length ? ` #${task.tags.join(' #')}` : '';
  return `#${task.id} ${task.title}${task.done ? ' (done)' : ''}${tags}`;
}

console.log(describeTask({ id: 1, title: 'Buy milk', done: false, tags: ['home'] }));

section('Exercises');

const sampleTasks = [
  { id: 1, title: 'one', done: false },
  { id: 2, title: 'two', done: true },
  { id: 3, title: 'three', done: false },
];

// 1. countOpen(tasks)
function countOpen(tasks) {
  // TODO: count tasks with done === false
}

await check('countOpen counts open tasks', () => {
  assert.equal(countOpen(sampleTasks), 2);
  assert.equal(countOpen([]), 0);
});

// 2. isTask(value)
function isTask(value) {
  // TODO: object, integer id > 0, non-empty title string, boolean done
}

await check('isTask accepts a valid task', () => {
  assert.equal(isTask({ id: 1, title: 'Buy milk', done: false }), true);
});

await check('isTask rejects near misses', () => {
  assert.equal(isTask(null), false);
  assert.equal(isTask('task'), false);
  assert.equal(isTask({ id: 0, title: 'x', done: false }), false);
  assert.equal(isTask({ id: 1, title: '   ', done: false }), false);
  assert.equal(isTask({ id: 1, title: 'x', done: 'no' }), false);
});

// 3. titleOf(input) — string or task-like object
function titleOf(input) {
  // TODO: trim and return, or throw
}

await check('titleOf handles strings', () => {
  assert.equal(titleOf('  Buy milk  '), 'Buy milk');
});

await check('titleOf handles objects', () => {
  assert.equal(titleOf({ title: ' Ship it ' }), 'Ship it');
});

await check('titleOf throws on junk', () => {
  assert.throws(() => titleOf({ title: 42 }), /title/);
  assert.throws(() => titleOf('   '), /title/);
});

// 4. Your turn: add two more `check(...)` calls for `truncate` above.

section('What TypeScript would add here');

const typedExample = `
interface Task {
  id: number;
  title: string;
  done: boolean;
  tags?: string[];
}

function countOpen(tasks: Task[]): number {
  return tasks.filter((task) => !task.done).length;
}
`;
console.log(typedExample);

summary();
