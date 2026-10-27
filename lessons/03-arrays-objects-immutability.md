# 03 · Arrays, objects, immutability

**Time:** ~45 min · **Run:** `node lessons/03-arrays-objects-immutability.js`

A task manager is mostly arrays of objects. This lesson is the workhorse: how to
transform data without mutating it, because mutation is where the bugs live.

## Array methods you will use daily

```js
const tasks = [
  { id: 1, title: 'Buy milk', done: false, priority: 'low', tags: ['home'] },
  { id: 2, title: 'Ship release', done: false, priority: 'high', tags: ['work'] },
  { id: 3, title: 'Read docs', done: true, priority: 'medium', tags: ['work', 'docs'] },
];
```

| Method | Returns | Use for |
| --- | --- | --- |
| `map(fn)` | new array, same length | transforming each item |
| `filter(fn)` | new array, fewer items | selecting |
| `find(fn)` | first match or `undefined` | lookup by id |
| `some(fn)` | boolean | "any match?" |
| `every(fn)` | boolean | "all match?" |
| `reduce(fn, initial)` | one accumulated value | totals, grouping |
| `sort(fn)` | **mutates** | ordering (copy first!) |

```js
tasks.map((task) => task.title);                 // ['Buy milk', ...]
tasks.filter((task) => !task.done);              // open tasks
tasks.find((task) => task.id === 2);             // the release task
tasks.some((task) => task.priority === 'high');  // true
tasks.every((task) => task.tags.length > 0);     // false
```

`reduce` is the one worth practising deliberately:

```js
const openCount = tasks.reduce((count, task) => count + (task.done ? 0 : 1), 0);
```

## Copy, don't mutate

`sort`, `reverse`, `push`, `splice` change the original array. When a function
receives an array and calls `sort` on it, it quietly reorders the caller's data:

```js
const sorted = [...tasks].sort((a, b) => a.id - b.id); // copy first
```

Spreading makes a **shallow** copy. Nested objects are still shared:

```js
const copy = { ...task, done: true }; // new object, same tags array
```

For the task manager this is fine — copy the object and replace the top-level
field. If you mutate `copy.tags.push('x')`, the original sees it too.

## Objects: destructuring and spread

```js
const { id, title, tags = [] } = task;   // pull fields out, with a default
const { title: name } = task;            // rename while destructuring
const { done, ...rest } = task;          // rest = everything except done
```

Functions that return new objects are easy to test:

```js
function renameTask(task, title) {
  return { ...task, title };
}
```

## Optional chaining and nullish coalescing

```js
task.due?.toString()      // undefined instead of throwing when due is null
task.due ?? 'no due date' // fallback only for null/undefined
```

`??` and `||` differ: `||` also falls back on `0`, `''` and `false`.
`count || 10` turns 0 into 10; `count ?? 10` keeps 0.

## TS bridge

```ts
interface Task {
  id: number;
  title: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  due?: string | null;
}

const tasks: Task[] = [...];
```

- `interface` describes the shape of an object. `type` can do it too; use whichever
  reads better (`type` for unions, `interface` for objects is a common habit).
- `due?: string | null` marks a property that may be missing **and** may be null.
  With strict mode, forgetting that `due` can be undefined is a compile error
  instead of `undefined is not a function` at runtime.
- `readonly tags: readonly string[]` is the type-level version of "don't mutate
  my array". `[...tasks].sort(...)` satisfies it; `tasks.sort(...)` does not.
- `tasks.map((task) => task.title)` infers `string[]`, no annotation needed.

## Exercises

1. `titles(tasks)` → array of titles.
2. `openHighPriority(tasks)` → open tasks with priority `'high'`.
3. `countByTag(tasks)` → `{ home: 1, work: 2, docs: 1 }`.
4. `renameTask(task, title)` → a new object; original untouched.
5. `sortByDue(tasks)` → new array, earliest due first, undated last, original
   order preserved when both are undated.

<details>
<summary>Solution</summary>

```js
function titles(tasks) {
  return tasks.map((task) => task.title);
}

function openHighPriority(tasks) {
  return tasks.filter((task) => !task.done && task.priority === 'high');
}

function countByTag(tasks) {
  return tasks.reduce((counts, task) => {
    for (const tag of task.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
    return counts;
  }, {});
}

function renameTask(task, title) {
  return { ...task, title };
}

function sortByDue(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.due === b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due < b.due ? -1 : 1;
  });
}
```

</details>

Next: [04 · Scope, closures, modules](04-scope-closures-modules.md)
