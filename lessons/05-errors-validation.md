# 05 · Errors and validation

**Time:** ~35 min · **Run:** `node lessons/05-errors-validation.js`

Errors are not an afterthought — they are part of a function's contract. A good
function either does its job or says clearly why it cannot.

## Throwing and catching

```js
function parsePriority(value) {
  if (!['low', 'medium', 'high'].includes(value)) {
    throw new Error(`Unknown priority: ${value}`);
  }
  return value;
}

try {
  parsePriority('urgent');
} catch (error) {
  console.log(error.message); // 'Unknown priority: urgent'
} finally {
  // runs whether or not something threw — cleanup goes here
}
```

Rules of thumb:

- Throw for **programming mistakes and impossible states** (unknown priority,
  missing id).
- Return a value for **expected outcomes** (a search that finds nothing).
- Never swallow an error silently. If you catch and cannot handle it, rethrow.

## Custom error types

```js
class ValidationError extends Error {
  constructor(message) {
    super(message);       // sets this.message and the stack
    this.name = 'ValidationError';
  }
}
```

Now callers can distinguish failures:

```js
if (error instanceof ValidationError) { ... }
```

## Validate at the boundary

The dangerous data is the data you did not create: CLI arguments, JSON files,
HTTP responses. Check it once, at the edge, and trust it inside:

```js
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
```

The task manager does exactly this before writing anything to disk.

## `JSON.parse` always needs a guard

```js
JSON.parse('{"ok":true}'); // fine
JSON.parse('{oops}');      // throws SyntaxError
```

Since a corrupted task file should produce a helpful message instead of a stack
trace, wrap it:

```js
function safeJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
```

This "result object" style is an alternative to exceptions: the caller must
inspect `ok`, so failures cannot be ignored by accident.

## TS bridge

- `catch (error)` gives you `unknown` under `strict` (TS 4.4+). You must narrow it
  before reading `.message`: `if (error instanceof Error) ...`.
- Custom error classes are ordinary classes in TS; extend `Error` the same way.
- A function that always throws returns `never`. That is why TS accepts
  `default: throw ...` in an exhaustive `switch` — the branch never continues.
- Result objects become discriminated unions:

  ```ts
  type Result<T> = { ok: true; value: T } | { ok: false; error: string };
  ```

  Then `if (result.ok)` narrows to the success shape automatically.
- Validating at the edge is what `zod` or `io-ts` automate. Learn the manual
  version first — you will recognise it everywhere.

## Exercises

1. `parsePriority(input)` → `'low' | 'medium' | 'high'`, accepting `l/m/h`
   aliases (case-insensitive), otherwise throw a `ValidationError` whose message
   matches `/Unknown priority/`.
2. `safeJson(text)` → `{ ok: true, value }` or `{ ok: false, error }`.
3. `requireId(value)` → a positive integer, else throw `ValidationError`
   (`/positive integer/`).

<details>
<summary>Solution</summary>

```js
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function parsePriority(input) {
  const key = String(input ?? '').trim().toLowerCase();
  const aliases = { l: 'low', low: 'low', m: 'medium', medium: 'medium', h: 'high', high: 'high' };
  const priority = aliases[key];
  if (!priority) throw new ValidationError(`Unknown priority: ${input}`);
  return priority;
}

function safeJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function requireId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError(`Id must be a positive integer, got "${value}".`);
  }
  return id;
}
```

</details>

Next: [06 · Async JavaScript](06-async.md)
