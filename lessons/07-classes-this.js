// Lesson 07 — Classes and this
// Run: node lessons/07-classes-this.js
import { assert, check, section, summary } from './lib/check.js';

section('A class with private state');

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

const store = new TaskStore();
store.add('Buy milk');
store.add('Ship release');
store.complete(1);
console.log('open: ', store.open.map((task) => task.title));
console.log('all ids: ', store.open.map((task) => task.id));

try {
  store.complete(99);
} catch (error) {
  console.log(`complete(99): ${error.message}`);
}

section('this is decided at call time');

const detached = store.add;
try {
  detached('Detached task');
} catch (error) {
  console.log(`detached call: ${error.name}: ${error.message}`);
}

const bound = store.add.bind(store);
console.log('bound call works:', bound('Bound task').title);

class Counter {
  count = 0;
  increment = () => {
    this.count += 1;
  };
}

const counter = new Counter();
const increment = counter.increment; // arrow field keeps `this`
increment();
increment();
console.log('arrow field count:', counter.count);

section('Inheritance in one screen');

class UrgentTask extends TaskStore {
  add(title) {
    const task = super.add(title);
    task.priority = 'high';
    return task;
  }
}

const urgent = new UrgentTask();
console.log(urgent.add('Fix outage'));
console.log('instanceof TaskStore:', urgent instanceof TaskStore);

section('Exercises');

// 1. Store class
class Store {
  // TODO: #tasks, #nextId, constructor, add, complete, get open
}

await check('add returns sequential ids', () => {
  const s = new Store();
  assert.equal(s.add('one').id, 1);
  assert.equal(s.add('two').id, 2);
});

await check('constructor continues after the highest id', () => {
  const s = new Store([{ id: 4, title: 'old', done: true }]);
  assert.equal(s.add('new').id, 5);
});

await check('complete marks a task done', () => {
  const s = new Store();
  s.add('one');
  const task = s.complete(1);
  assert.equal(task.done, true);
  assert.equal(s.open.length, 0);
});

await check('complete throws for unknown ids', () => {
  const s = new Store();
  assert.throws(() => s.complete(42), /No task/);
});

await check('open only returns open tasks', () => {
  const s = new Store();
  s.add('one');
  s.add('two');
  s.complete(1);
  assert.deepEqual(s.open.map((task) => task.title), ['two']);
});

// 2. bindGreet(greeter)
class Greeter {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return `Hello, ${this.name}!`;
  }
}

function bindGreet(greeter) {
  // TODO: return a function that preserves the receiver
}

await check('bindGreet survives detachment', () => {
  const greet = bindGreet(new Greeter('Gamp'));
  assert.equal(greet(), 'Hello, Gamp!');
});

// 3. Countdown with #value
class Countdown {
  // TODO: #value, constructor(start), tick(), get remaining
}

await check('Countdown ticks down and stops at zero', () => {
  const countdown = new Countdown(2);
  assert.equal(countdown.remaining, 2);
  assert.equal(countdown.tick(), 1);
  assert.equal(countdown.tick(), 0);
  assert.equal(countdown.tick(), 0);
  assert.equal(countdown.remaining, 0);
});

summary();
