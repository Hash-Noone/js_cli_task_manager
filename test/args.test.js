import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, UsageError } from '../src/args.js';

const options = {
  valueFlags: ['priority', 'tag', 'note'],
  booleanFlags: ['all', 'json'],
  shortFlags: { p: 'priority', t: 'tag' },
  repeatable: ['tag'],
};

test('collects positionals and flags', () => {
  const { flags, positionals } = parseArgs(
    ['buy', 'milk', '-p', 'high', '--all'],
    options,
  );
  assert.deepEqual(positionals, ['buy', 'milk']);
  assert.deepEqual(flags, { priority: 'high', all: true });
});

test('supports --flag=value', () => {
  const { flags } = parseArgs(['--priority=low', '--tag=home,work'], options);
  assert.equal(flags.priority, 'low');
  assert.deepEqual(flags.tag, ['home,work']);
});

test('repeatable flags accumulate', () => {
  const { flags } = parseArgs(['-t', 'home', '--tag', 'work'], options);
  assert.deepEqual(flags.tag, ['home', 'work']);
});

test('non repeatable flags keep the last value', () => {
  const { flags } = parseArgs(['-p', 'low', '-p', 'high'], options);
  assert.equal(flags.priority, 'high');
});

test('-- stops flag parsing', () => {
  const { flags, positionals } = parseArgs(['add', '--', '--weird', '-p'], options);
  assert.deepEqual(positionals, ['add', '--weird', '-p']);
  assert.deepEqual(flags, {});
});

test('unknown options throw', () => {
  assert.throws(() => parseArgs(['--nope'], options), UsageError);
  assert.throws(() => parseArgs(['-z'], options), UsageError);
});

test('missing values throw', () => {
  assert.throws(() => parseArgs(['--tag'], options), /needs a value/);
  assert.throws(() => parseArgs(['-p'], options), /needs a value/);
});
