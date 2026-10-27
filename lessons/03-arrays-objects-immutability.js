// Lesson 03 — Arrays, objects, immutability
// Run: node lessons/03-arrays-objects-immutability.js
import { assert, check, section, summary } from './lib/check.js';

const tasks = [
  { id: 1, title: 'Buy milk', done: false, priority: 'low', tags: ['home'], due: '2026-10-30' },
  { id: 2, title: 'Ship release', done: false, priority: 'high', tags: ['work'], due: null },
  { id: 3, title: 'Read docs', done: true, priority: 'medium', tags: ['work', 'docs'], due: null },
  { id: 4, title: 'Pay bill', done: false, priority: 'high', tags: ['home', 'bills'], due: '2026-10-28' },
];

section('map, filter, find, some, every');

console.log('titles:      ', tasks.map((task) => task.title));
console.log('open ids:    ', tasks.filter((task) => !task.done).map((task) => task.id));
console.log('find id 3:   ', tasks.find((task) => task.id === 3)?.title);
console.log('any high?    ', tasks.some((task) => task.priority === 'high'));
console.log('all tagged?  ', tasks.every((task) => task.tags.length > 0));

section('reduce: counting and grouping');

const openCount = tasks.reduce((count, task) => count + (task.done ? 0 : 1), 0);
console.log('open count:  ', openCount);

const byTag = tasks.reduce((counts, task) => {
  for (const tag of task.tags) counts[tag] = (counts[tag] ?? 0) + 1;
  return counts;
}, {});
console.log('by tag:      ', byTag);

section('Mutation trap: sort changes the original');

const idsBefore = tasks.map((task) => task.id);
const sortedCopy = [...tasks].sort((a, b) => b.id - a.id);
console.log('sorted copy: ', sortedCopy.map((task) => task.id));
console.log('original:    ', tasks.map((task) => task.id), 'unchanged:', String(tasks.map((t) => t.id)) === String(idsBefore));

section('Destructuring and spread');

const { id, title, tags = [] } = tasks[0];
console.log({ id, title, tags });

const { done, ...withoutDone } = tasks[0];
console.log('rest object: ', withoutDone);

const renamed = { ...tasks[0], title: 'Buy oat milk' };
console.log('renamed copy:', renamed.title, '| original:', tasks[0].title);

section('Optional chaining and nullish coalescing');

console.log('task 2 due:  ', tasks[1].due ?? 'no due date');
console.log('missing:     ', tasks[1].missing?.deeply?.nested);
console.log('0 || 10:     ', 0 || 10);
console.log('0 ?? 10:     ', 0 ?? 10);

section('Exercises');

// 1. titles(tasks)
function titles(list) {
  // TODO: map
}

await check('titles returns every title', () => {
  assert.deepEqual(titles(tasks), ['Buy milk', 'Ship release', 'Read docs', 'Pay bill']);
});

// 2. openHighPriority(tasks)
function openHighPriority(list) {
  // TODO: filter on done and priority
}

await check('openHighPriority picks open high-priority tasks', () => {
  assert.deepEqual(openHighPriority(tasks).map((task) => task.id), [2, 4]);
});

// 3. countByTag(tasks) -> { home: 2, work: 2, docs: 1, bills: 1 }
function countByTag(list) {
  // TODO: reduce into an object
}

await check('countByTag counts every tag', () => {
  assert.deepEqual(countByTag(tasks), { home: 2, work: 2, docs: 1, bills: 1 });
});

// 4. renameTask(task, title) -> new object, original untouched
function renameTask(task, newTitle) {
  // TODO: spread
}

await check('renameTask returns a new object', () => {
  const renamed = renameTask(tasks[0], 'Buy oat milk');
  assert.equal(renamed.title, 'Buy oat milk');
  assert.equal(tasks[0].title, 'Buy milk');
  assert.notEqual(renamed, tasks[0]);
});

// 5. sortByDue(tasks) -> new array, earliest first, undated last
function sortByDue(list) {
  // TODO: copy, then sort by due date
}

await check('sortByDue orders dated tasks and keeps undated last', () => {
  const sorted = sortByDue(tasks);
  assert.deepEqual(sorted.map((task) => task.id), [4, 1, 2, 3]);
  assert.deepEqual(tasks.map((task) => task.id), [1, 2, 3, 4], 'original must not change');
});

summary();
