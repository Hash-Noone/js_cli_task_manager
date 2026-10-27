// Lesson 01 — Values, types, and equality
// Run: node lessons/01-values-and-types.js
import { assert, check, section, summary } from './lib/check.js';

section('typeof tells you the runtime type');

const values = [
  ['string', 'hello'],
  ['number', 42],
  ['boolean', true],
  ['undefined', undefined],
  ['null', null], // 'object' — famous bug
  ['bigint', 10n],
  ['symbol', Symbol('id')],
  ['object', {}],
  ['array', []], // also 'object'
  ['function', function named() {}],
];

for (const [label, value] of values) {
  console.log(`${label.padEnd(10)} → typeof ${typeof value}`);
}

console.log(`\nArray.isArray([])            → ${Array.isArray([])}`);
console.log(`Array.isArray({ length: 0 }) → ${Array.isArray({ length: 0 })}`);

section('Equality: prefer === over ==');

console.log(`1 === 1              → ${1 === 1}`);
console.log(`1 === '1'            → ${1 === '1'}`);
console.log(`1 == '1'             → ${1 == '1'}  (coercion!)`);
console.log(`null == undefined    → ${null == undefined}`);
console.log(`null === undefined   → ${null === undefined}`);
console.log(`NaN === NaN          → ${NaN === NaN}`);
console.log(`Number.isNaN(NaN)    → ${Number.isNaN(NaN)}`);

section('Numbers that bite');

console.log(`Number('')        → ${Number('')}`);
console.log(`Number('  42 ')   → ${Number('  42 ')}`);
console.log(`Number('12px')    → ${Number('12px')}`);
console.log(`Number(null)      → ${Number(null)}`);
console.log(`Number.isFinite('42')  → ${Number.isFinite('42')}`);
console.log(`parseInt('12px')  → ${Number.parseInt('12px', 10)}`);

section('Truthiness: the falsy list is short');

const samples = [
  ['false', false],
  ['0', 0],
  ["''", ''],
  ["'0'", '0'],
  ['null', null],
  ['undefined', undefined],
  ['NaN', NaN],
  ['[]', []],
  ['{}', {}],
];

for (const [label, value] of samples) {
  console.log(`${label.padEnd(10)} → ${Boolean(value)}`);
}

section('Template literals');

const title = 'Buy milk';
const tags = ['home', 'urgent'];
console.log(`#1 ${title} (${tags.length} tags)`);
console.log(`Unquoted: ${title.toUpperCase()}`);

section('Exercises');

// 1. describeType(value) -> 'null' | 'array' | typeof value
function describeType(value) {
  // TODO: check null and arrays before falling back to typeof
}

await check('describeType(null) is "null"', () => assert.equal(describeType(null), 'null'));
await check('describeType([1, 2]) is "array"', () => assert.equal(describeType([1, 2]), 'array'));
await check('describeType("hi") is "string"', () => assert.equal(describeType('hi'), 'string'));
await check('describeType(42) is "number"', () => assert.equal(describeType(42), 'number'));

// 2. toNumber(input) -> finite number, or null
function toNumber(input) {
  // TODO: reject null/undefined, blank strings and junk like '12px'
}

await check('toNumber("42") is 42', () => assert.equal(toNumber('42'), 42));
await check('toNumber(" 3.5 ") is 3.5', () => assert.equal(toNumber(' 3.5 '), 3.5));
await check('toNumber("") is null', () => assert.equal(toNumber(''), null));
await check('toNumber("12px") is null', () => assert.equal(toNumber('12px'), null));
await check('toNumber(null) is null', () => assert.equal(toNumber(null), null));
await check('toNumber("Infinity") is null', () => assert.equal(toNumber('Infinity'), null));

// 3. formatDue(days) -> 'today' | 'tomorrow' | 'yesterday' | 'in Nd' | 'Nd overdue'
function formatDue(days) {
  // TODO: 0, 1, -1 are special; otherwise build a relative label
}

await check("formatDue(0) is 'today'", () => assert.equal(formatDue(0), 'today'));
await check("formatDue(1) is 'tomorrow'", () => assert.equal(formatDue(1), 'tomorrow'));
await check("formatDue(-1) is 'yesterday'", () => assert.equal(formatDue(-1), 'yesterday'));
await check("formatDue(4) is 'in 4d'", () => assert.equal(formatDue(4), 'in 4d'));
await check("formatDue(-3) is '3d overdue'", () => assert.equal(formatDue(-3), '3d overdue'));

summary();
