import assert from 'node:assert/strict';

let passed = 0;
let failed = 0;

/** Print a labelled section in the lesson output. */
export function section(title) {
  const line = '─'.repeat(Math.max(4, 58 - title.length));
  console.log(`\n── ${title} ${line}`);
}

/**
 * Run one exercise check. Works with sync and async functions, so lesson 6
 * can `await check(...)`.
 */
export async function check(label, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${label}`);
  } catch (error) {
    failed += 1;
    console.log(`  ✗ ${label}`);
    console.log(`    ${String(error.message).split('\n')[0]}`);
  }
}

/** Print the final score. Failing exercises make the process exit non-zero. */
export function summary() {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('Fix the ✗ exercises and run this file again.');
    process.exitCode = 1;
  } else {
    console.log('All done. On to the next lesson!');
  }
}

export { assert };
