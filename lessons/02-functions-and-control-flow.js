// Lesson 02 — Functions and control flow
// Run: node lessons/02-functions-and-control-flow.js
import { assert, check, section, summary } from './lib/check.js';

section('Three ways to write a function');

function add(a, b) {
  return a + b;
}

const multiply = function (a, b) {
  return a * b;
};

const subtract = (a, b) => a - b;

console.log(`add(2, 3)        → ${add(2, 3)}`);
console.log(`multiply(2, 3)   → ${multiply(2, 3)}`);
console.log(`subtract(2, 3)   → ${subtract(2, 3)}`);

// Hoisting: declarations work before their line, const arrows do not.
console.log(`hoisted(1)       → ${hoisted(1)}`);
function hoisted(n) {
  return n + 1;
}

section('Defaults and rest parameters');

function greet(name = 'stranger', greeting = 'Hello') {
  return `${greeting}, ${name}!`;
}

console.log(greet());
console.log(greet('Gamp'));
console.log(greet(undefined, 'Hi'));
console.log(greet(null)); // null is not undefined — no default!

function total(...numbers) {
  return numbers.reduce((sum, n) => sum + n, 0);
}
console.log(`total(1, 2, 3)   → ${total(1, 2, 3)}`);

function addTask({ title, priority = 'medium' }) {
  return { title, priority };
}
console.log(addTask({ title: 'Buy milk' }));

section('Guard clauses and switch');

function priorityWeight(priority) {
  if (priority === 'high') return 3;
  if (priority === 'medium') return 2;
  if (priority === 'low') return 1;
  throw new Error(`Unknown priority: ${priority}`);
}

for (const priority of ['high', 'medium', 'low']) {
  console.log(`${priority.padEnd(7)} → ${priorityWeight(priority)}`);
}

try {
  priorityWeight('urgent');
} catch (error) {
  console.log(`guard clause caught: ${error.message}`);
}

function switchWeight(priority) {
  switch (priority) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      throw new Error(`Unknown priority: ${priority}`);
  }
}
console.log(`switchWeight('low') → ${switchWeight('low')}`);

section('Functions as values');

function applyTwice(fn, value) {
  return fn(fn(value));
}
console.log(`applyTwice(double, 3) → ${applyTwice((n) => n * 2, 3)}`);
console.log(['buy milk', 'ship it'].map((text) => text.toUpperCase()));

section('Exercises');

// 1. clamp(value, min, max)
function clamp(value, min, max) {
  // TODO
}

await check('clamp(5, 1, 10) is 5', () => assert.equal(clamp(5, 1, 10), 5));
await check('clamp(-5, 1, 10) is 1', () => assert.equal(clamp(-5, 1, 10), 1));
await check('clamp(50, 1, 10) is 10', () => assert.equal(clamp(50, 1, 10), 10));

// 2. priorityWeight(priority) — throw on unknown values
function weight(priority) {
  // TODO: use if/else or switch
}

await check("weight('high') is 3", () => assert.equal(weight('high'), 3));
await check("weight('medium') is 2", () => assert.equal(weight('medium'), 2));
await check("weight('low') is 1", () => assert.equal(weight('low'), 1));
await check('weight("urgent") throws', () => assert.throws(() => weight('urgent'), /Unknown priority/));

// 3. applyTwice(fn, value)
function twice(fn, value) {
  // TODO
}

await check('twice(n => n + 1, 1) is 3', () => assert.equal(twice((n) => n + 1, 1), 3));
await check('twice(s => s + "!", "hi") is "hi!!"', () => assert.equal(twice((s) => `${s}!`, 'hi'), 'hi!!'));

// 4. formatCount(count, word) — mind the plural
function formatCount(count, word) {
  // TODO: 1 task, 2 tasks, 0 tasks
}

await check('formatCount(1, "task") is "1 task"', () => assert.equal(formatCount(1, 'task'), '1 task'));
await check('formatCount(2, "task") is "2 tasks"', () => assert.equal(formatCount(2, 'task'), '2 tasks'));
await check('formatCount(0, "task") is "0 tasks"', () => assert.equal(formatCount(0, 'task'), '0 tasks'));

summary();
