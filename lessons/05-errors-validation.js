// Lesson 05 — Errors and validation
// Run: node lessons/05-errors-validation.js
import { assert, check, section, summary } from './lib/check.js';

section('throw, try, catch, finally');

function parsePriority(value) {
  if (!['low', 'medium', 'high'].includes(value)) {
    throw new Error(`Unknown priority: ${value}`);
  }
  return value;
}

console.log(parsePriority('high'));

try {
  parsePriority('urgent');
} catch (error) {
  console.log(`caught: ${error.name}: ${error.message}`);
} finally {
  console.log('finally always runs');
}

section('Custom error classes');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

try {
  throw new ValidationError('Title cannot be empty.');
} catch (error) {
  console.log(error instanceof ValidationError, error.name, error.message);
}

section('Validating at the boundary');

function normalizeTitle(input) {
  if (typeof input !== 'string') {
    throw new ValidationError('Title must be a string.');
  }
  const title = input.trim();
  if (title === '') {
    throw new ValidationError('Title cannot be empty.');
  }
  return title;
}

for (const input of ['  Buy milk  ', '   ', 42]) {
  try {
    console.log(`normalizeTitle(${JSON.stringify(input)}) =`, JSON.stringify(normalizeTitle(input)));
  } catch (error) {
    console.log(`normalizeTitle(${JSON.stringify(input)}) threw ${error.name}: ${error.message}`);
  }
}

section('JSON.parse needs a guard');

try {
  JSON.parse('{oops}');
} catch (error) {
  console.log(`${error.name}: ${error.message}`);
}

function safeJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

console.log(safeJson('{"id":1}'));
console.log(safeJson('{oops}'));

section('Exercises');

// 1. parsePriority stricter version: l/m/h aliases, ValidationError otherwise
function priority(input) {
  // TODO: normalise, map aliases, throw new ValidationError(...)
}

await check("priority('H') is 'high'", () => assert.equal(priority('H'), 'high'));
await check("priority(' medium ') is 'medium'", () => assert.equal(priority(' medium '), 'medium'));
await check("priority('l') is 'low'", () => assert.equal(priority('l'), 'low'));
await check('priority("urgent") throws ValidationError', () => {
  assert.throws(() => priority('urgent'), (error) => {
    assert.equal(error.name, 'ValidationError');
    assert.match(error.message, /Unknown priority/);
    return true;
  });
});

// 2. safeJson(text)
function safeJsonParse(text) {
  // TODO: return { ok: true, value } or { ok: false, error }
}

await check('safeJsonParse parses valid JSON', () => {
  assert.deepEqual(safeJsonParse('{"id":1}'), { ok: true, value: { id: 1 } });
});

await check('safeJsonParse reports invalid JSON', () => {
  const result = safeJsonParse('{oops}');
  assert.equal(result.ok, false);
  assert.equal(typeof result.error, 'string');
});

// 3. requireId(value) -> positive integer or ValidationError
function requireId(value) {
  // TODO: Number(value), integer check, > 0
}

await check('requireId("7") is 7', () => assert.equal(requireId('7'), 7));
await check('requireId("2.5") throws', () => assert.throws(() => requireId('2.5'), /positive integer/));
await check('requireId("-1") throws', () => assert.throws(() => requireId('-1'), /positive integer/));
await check('requireId("abc") throws', () => assert.throws(() => requireId('abc'), /positive integer/));

summary();
