# 07 · Classes and `this`

**Time:** ~35 min · **Run:** `node lessons/07-classes-this.js`

Classes in JavaScript are a friendlier syntax over prototypes. You need to read
them because you will meet them in libraries; you do not need to use them for
everything. The task manager deliberately uses plain objects and functions — but
a store with private state is a reasonable class.

## A class with private state

```js
class TaskStore {
  #tasks = [];
  #nextId = 1;

  constructor(initial = []) {
    this.#tasks = [...initial];
    this.#nextId = Math.max(0, ...initial.map((task) => task.id)) + 1;
  }

  add(title) {
    const task = { id: this.#nextId, title, done: false };
    this.#nextId += 1;
    this.#tasks.push(task);
    return task;
  }

  complete(id) {
    const task = this.#tasks.find((item) => item.id === id);
    if (!task) throw new Error(`No task with id ${id}`);
    task.done = true;
    return task;
  }

  get open() {
    return this.#tasks.filter((task) => !task.done);
  }
}
```

- Fields declared in the class body (`#tasks = []`) are initialised per instance.
- `#name` is truly private — not accessible outside the class, unlike the old
  `_name` convention.
- `get open()` is a getter: read it as `store.open`, not `store.open()`.

## `this` is decided at call time

```js
const store = new TaskStore();
const add = store.add;   // the function, detached from the object
add('x');                // TypeError: cannot read properties of undefined
```

When called as `store.add(...)`, `this` is `store`. Assign the function to a
variable and call it plainly, and `this` becomes `undefined` in strict mode
(ES modules are always strict).

Fixes, in order of preference:

1. Call it as a method: `store.add('x')`.
2. Bind it: `const add = store.add.bind(store)`.
3. Use an arrow-function field, which captures `this` from the constructor:

   ```js
   class Counter {
     count = 0;
     increment = () => { this.count += 1; };
   }
   ```

## Inheritance (know it, use it sparingly)

```js
class UrgentTask extends Task {
  constructor(title) {
    super(title);
    this.priority = 'high';
  }
}
```

`super(...)` runs the parent constructor. `instanceof` walks the chain. Prefer
composition — passing an object in — until inheritance genuinely removes
duplication.

## TS bridge

```ts
class TaskStore {
  private tasks: Task[] = [];
  readonly createdAt: Date = new Date();

  constructor(initial: Task[] = []) { ... }

  add(title: string): Task { ... }
  complete(id: number): Task { ... }
  get open(): Task[] { ... }
}
```

- TS `private` is a compile-time promise; `#private` is enforced by the runtime.
  Use `#` when you want real privacy, `private` when you want the type checker to
  keep teammates out.
- `readonly` prevents reassignment after construction (it does not deep-freeze).
- Parameter properties shorten boilerplate:

  ```ts
  class Store {
    constructor(private tasks: Task[] = []) {}
  }
  ```
- `implements SomeInterface` forces a class to match a contract. That is how you
  would type several storage backends (file, memory, API) behind one shape.
- Under `strict`, `this` in a detached method is a type error — the compiler
  catches the bug from this lesson before you run it.

## Exercises

1. `Store`:
   - `constructor(initial = [])` copies the array and continues ids after the
     highest existing id.
   - `add(title)` returns the new task (`{ id, title, done: false }`).
   - `complete(id)` marks it done, returns the task, throws `/No task/` if missing.
   - `get open()` returns only open tasks.
2. `bindGreet(greeter)` → a function that calls `greeter.greet()` correctly even
   when invoked on its own.
3. `Countdown` with a private `#value`, `tick()` decrementing it, and a
   `get remaining()`.

<details>
<summary>Solution</summary>

```js
class Store {
  #tasks;
  #nextId;

  constructor(initial = []) {
    this.#tasks = [...initial];
    this.#nextId = Math.max(0, ...initial.map((task) => task.id)) + 1;
  }

  add(title) {
    const task = { id: this.#nextId, title, done: false };
    this.#nextId += 1;
    this.#tasks.push(task);
    return task;
  }

  complete(id) {
    const task = this.#tasks.find((item) => item.id === id);
    if (!task) throw new Error(`No task with id ${id}`);
    task.done = true;
    return task;
  }

  get open() {
    return this.#tasks.filter((task) => !task.done);
  }
}

function bindGreet(greeter) {
  return greeter.greet.bind(greeter);
}

class Countdown {
  #value;

  constructor(start) {
    this.#value = start;
  }

  tick() {
    if (this.#value > 0) this.#value -= 1;
    return this.#value;
  }

  get remaining() {
    return this.#value;
  }
}
```

</details>

Next: [08 · Testing and the TypeScript bridge](08-testing-and-typescript.md)
