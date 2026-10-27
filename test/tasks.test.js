import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { emptyDb, load, save } from '../src/store.js';
import {
  addTask,
  removeTask,
  requireRef,
  resolveRef,
  selectTasks,
  summarize,
  updateTask,
} from '../src/tasks.js';

const now = new Date(2026, 9, 27, 9, 0, 0);

function fixture() {
  const db = emptyDb();
  addTask(db, {
    title: 'low soon',
    priority: 'low',
    due: '2026-10-28',
    tags: ['home'],
  });
  addTask(db, {
    title: 'high later',
    priority: 'high',
    due: '2026-11-05',
    tags: ['work', 'urgent'],
    notes: 'needs review',
  });
  addTask(db, { title: 'med no due' });
  addTask(db, {
    title: 'overdue item',
    priority: 'medium',
    due: '2026-10-20',
    tags: ['work'],
  });
  const done = addTask(db, { title: 'done high', priority: 'high' });
  done.done = true;
  done.completedAt = '2026-10-26T10:00:00.000Z';
  return db;
}

test('store round trip keeps tasks and nextId', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'taskman-store-'));
  const file = path.join(dir, 'tasks.json');

  try {
    const db = fixture();
    save(db, file);

    const loaded = load(file);
    assert.equal(loaded.tasks.length, db.tasks.length);
    assert.equal(loaded.nextId, db.nextId);
    assert.deepEqual(loaded.tasks[1], db.tasks[1]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('load returns an empty database when the file does not exist', () => {
  const db = load('/nonexistent/definitely/tasks.json');
  assert.deepEqual(db, emptyDb());
});

test('resolveRef handles ids, missing ids and last', () => {
  const db = fixture();
  assert.equal(resolveRef(db, '2').title, 'high later');
  assert.equal(resolveRef(db, 'last').id, 5);
  assert.equal(resolveRef(db, '999'), null);
  assert.equal(resolveRef(db, 'nope'), null);
  assert.throws(() => requireRef(db, '999'), /No task with id/);
});

test('default listing hides completed tasks and sorts smartly', () => {
  const db = fixture();
  const tasks = selectTasks(db, { now });
  assert.deepEqual(tasks.map((task) => task.title), [
    'overdue item',
    'high later',
    'low soon',
    'med no due',
  ]);
});

test('filters by tag, priority, due and search', () => {
  const db = fixture();

  assert.deepEqual(
    selectTasks(db, { tags: ['work'], now }).map((task) => task.title),
    ['overdue item', 'high later'],
  );

  assert.deepEqual(
    selectTasks(db, { tags: ['work', 'urgent'], now }).map((task) => task.title),
    ['high later'],
  );

  assert.deepEqual(
    selectTasks(db, { priority: 'low', now }).map((task) => task.title),
    ['low soon'],
  );

  assert.deepEqual(
    selectTasks(db, { due: 'overdue', now }).map((task) => task.title),
    ['overdue item'],
  );

  assert.deepEqual(
    selectTasks(db, { due: 'week', now }).map((task) => task.title),
    ['low soon'],
  );

  assert.deepEqual(
    selectTasks(db, { due: 'none', now }).map((task) => task.title),
    ['med no due'],
  );

  assert.deepEqual(
    selectTasks(db, { search: 'review', now }).map((task) => task.title),
    ['high later'],
  );
});

test('filters completed tasks and supports explicit sorts', () => {
  const db = fixture();
  assert.deepEqual(
    selectTasks(db, { status: 'done', now }).map((task) => task.title),
    ['done high'],
  );

  assert.deepEqual(
    selectTasks(db, { status: 'all', sort: 'id', now }).map((task) => task.id),
    [1, 2, 3, 4, 5],
  );

  assert.deepEqual(
    selectTasks(db, { status: 'all', sort: 'due', now }).map((task) => task.title),
    ['overdue item', 'low soon', 'high later', 'med no due', 'done high'],
  );

  assert.deepEqual(
    selectTasks(db, { sort: 'id', reverse: true, now }).map((task) => task.id),
    [4, 3, 2, 1],
  );
});

test('updateTask reports what changed', () => {
  const db = fixture();
  const task = requireRef(db, '3');

  assert.deepEqual(updateTask(task, { due: '2026-10-30' }), ['due']);
  assert.deepEqual(updateTask(task, { due: '2026-10-30' }), []);
  assert.deepEqual(
    updateTask(task, { priority: 'high', tags: ['a', 'b'] }),
    ['priority', 'tags'],
  );
  assert.throws(() => updateTask(task, { title: '  ' }), /cannot be empty/);
});

test('removeTask deletes by id', () => {
  const db = fixture();
  const removed = removeTask(db, 2);
  assert.equal(removed.title, 'high later');
  assert.equal(db.tasks.length, 4);
  assert.equal(removeTask(db, 2), null);
});

test('summarize counts open work', () => {
  const db = fixture();
  const stats = summarize(db, now);

  assert.equal(stats.total, 5);
  assert.equal(stats.open, 4);
  assert.equal(stats.done, 1);
  assert.equal(stats.completion, 20);
  assert.equal(stats.overdue, 1);
  assert.equal(stats.dueToday, 0);
  assert.equal(stats.dueWeek, 1);
  assert.deepEqual(stats.byPriority, { high: 1, medium: 2, low: 1 });
  assert.deepEqual(stats.byTag, [
    { tag: 'work', count: 2 },
    { tag: 'home', count: 1 },
    { tag: 'urgent', count: 1 },
  ]);
});
