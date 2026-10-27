import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BIN = fileURLToPath(new URL('../bin/task.js', import.meta.url));

function workspace() {
  const dir = mkdtempSync(path.join(tmpdir(), 'taskman-cli-'));
  const file = path.join(dir, 'tasks.json');

  const run = (...args) => spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      TASKMAN_FILE: file,
      NO_COLOR: '1',
      FORCE_COLOR: '0',
    },
  });

  return {
    run,
    read() {
      const result = run('list', '--all', '--json');
      return JSON.parse(result.stdout);
    },
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

test('add then list a task', () => {
  const cli = workspace();
  try {
    const add = cli.run('add', 'Buy milk', '-p', 'high', '-t', 'home', '-d', 'today');
    assert.equal(add.status, 0, add.stderr);
    assert.match(add.stdout, /Added #1 Buy milk/);

    const list = cli.run('ls');
    assert.equal(list.status, 0, list.stderr);
    assert.match(list.stdout, /Buy milk/);
    assert.match(list.stdout, /#home/);
    assert.match(list.stdout, /today/);
  } finally {
    cli.cleanup();
  }
});

test('add accepts multi-word titles without quotes via positionals', () => {
  const cli = workspace();
  try {
    assert.equal(cli.run('add', 'Write', 'the', 'README').status, 0);
    assert.equal(cli.read()[0].title, 'Write the README');
  } finally {
    cli.cleanup();
  }
});

test('JSON output is machine readable', () => {
  const cli = workspace();
  try {
    const add = cli.run('add', 'JSON task', '--json');
    const task = JSON.parse(add.stdout);
    assert.equal(task.id, 1);
    assert.equal(task.title, 'JSON task');
    assert.equal(task.priority, 'medium');
    assert.equal(task.done, false);

    const list = cli.run('list', '--json');
    assert.equal(JSON.parse(list.stdout).length, 1);
  } finally {
    cli.cleanup();
  }
});

test('done and undone toggle tasks', () => {
  const cli = workspace();
  try {
    cli.run('add', 'one');
    cli.run('add', 'two');

    const done = cli.run('done', '1');
    assert.equal(done.status, 0, done.stderr);
    assert.match(done.stdout, /Completed #1 one/);

    assert.equal(cli.read().find((task) => task.id === 1).done, true);
    assert.equal(cli.run('list').stdout.includes('one'), false);
    assert.equal(cli.run('list', '--all').stdout.includes('one'), true);

    const undone = cli.run('undone', '1');
    assert.match(undone.stdout, /Reopened #1 one/);
    assert.equal(cli.read().find((task) => task.id === 1).done, false);
  } finally {
    cli.cleanup();
  }
});

test('id ranges and comma lists work', () => {
  const cli = workspace();
  try {
    cli.run('add', 'one');
    cli.run('add', 'two');
    cli.run('add', 'three');

    assert.equal(cli.run('done', '1-2').status, 0);
    assert.equal(cli.read().filter((task) => task.done).length, 2);

    assert.equal(cli.run('done', '3').status, 0);
    assert.equal(cli.run('done', '1,2,3').status, 0);
    assert.match(cli.run('done', '1,2,3').stdout, /Already done/);
  } finally {
    cli.cleanup();
  }
});

test('edit changes fields and can clear them', () => {
  const cli = workspace();
  try {
    cli.run('add', 'Old title', '-p', 'low', '-d', 'tomorrow', '-t', 'home', '-n', 'note');

    const edit = cli.run('edit', '1', 'New title', '-p', 'high');
    assert.equal(edit.status, 0, edit.stderr);
    assert.match(edit.stdout, /Updated #1/);

    let [task] = cli.read();
    assert.equal(task.title, 'New title');
    assert.equal(task.priority, 'high');

    cli.run('edit', '1', '--due', 'none', '--tag', 'none', '--note', 'none');
    [task] = cli.read();
    assert.equal(task.due, null);
    assert.deepEqual(task.tags, []);
    assert.equal(task.notes, '');
  } finally {
    cli.cleanup();
  }
});

test('rm deletes tasks', () => {
  const cli = workspace();
  try {
    cli.run('add', 'one');
    cli.run('add', 'two');

    const rm = cli.run('rm', '1');
    assert.equal(rm.status, 0, rm.stderr);
    assert.match(rm.stdout, /Removed #1 one/);
    assert.deepEqual(cli.read().map((task) => task.id), [2]);
  } finally {
    cli.cleanup();
  }
});

test('show prints details', () => {
  const cli = workspace();
  try {
    cli.run('add', 'Detail task', '-d', '2026-12-01', '-t', 'work', '-n', 'hello');
    const show = cli.run('show', '1');
    assert.equal(show.status, 0, show.stderr);
    assert.match(show.stdout, /Detail task/);
    assert.match(show.stdout, /open/);
    assert.match(show.stdout, /#work/);
    assert.match(show.stdout, /hello/);
  } finally {
    cli.cleanup();
  }
});

test('clear needs a target and guards --all', () => {
  const cli = workspace();
  try {
    cli.run('add', 'one');
    cli.run('add', 'two');
    cli.run('done', '1');

    const noTarget = cli.run('clear');
    assert.equal(noTarget.status, 1);
    assert.match(noTarget.stderr, /--done/);

    const noYes = cli.run('clear', '--all');
    assert.equal(noYes.status, 1);
    assert.match(noYes.stderr, /--yes/);

    const cleared = cli.run('clear', '--done');
    assert.equal(cleared.status, 0, cleared.stderr);
    assert.match(cleared.stdout, /Cleared 1 task/);
    assert.deepEqual(cli.read().map((task) => task.id), [2]);

    assert.equal(cli.run('clear', '--all', '--yes').status, 0);
    assert.deepEqual(cli.read(), []);
  } finally {
    cli.cleanup();
  }
});

test('stats and tags report aggregates', () => {
  const cli = workspace();
  try {
    cli.run('add', 'one', '-t', 'home');
    cli.run('add', 'two', '-t', 'home', '-d', 'yesterday');
    cli.run('done', '1');

    const stats = JSON.parse(cli.run('stats', '--json').stdout);
    assert.equal(stats.total, 2);
    assert.equal(stats.open, 1);
    assert.equal(stats.done, 1);
    assert.equal(stats.overdue, 1);

    const tags = JSON.parse(cli.run('tags', '--all', '--json').stdout);
    assert.deepEqual(tags, [{ tag: 'home', count: 2 }]);
  } finally {
    cli.cleanup();
  }
});

test('lists can be filtered and searched', () => {
  const cli = workspace();
  try {
    cli.run('add', 'alpha', '-p', 'high', '-t', 'work');
    cli.run('add', 'beta', '-p', 'low', '-t', 'home');
    cli.run('add', 'gamma', '-d', 'yesterday');

    assert.deepEqual(
      JSON.parse(cli.run('list', '--json', '-p', 'high').stdout).map((task) => task.title),
      ['alpha'],
    );

    assert.deepEqual(
      JSON.parse(cli.run('list', '--json', '-d', 'overdue').stdout).map((task) => task.title),
      ['gamma'],
    );

    assert.deepEqual(
      JSON.parse(cli.run('list', '--json', '-t', 'home').stdout).map((task) => task.title),
      ['beta'],
    );

    assert.deepEqual(
      JSON.parse(cli.run('list', '--json', '-s', 'bet').stdout).map((task) => task.title),
      ['beta'],
    );
  } finally {
    cli.cleanup();
  }
});

test('errors exit non-zero with a helpful message', () => {
  const cli = workspace();
  try {
    const missing = cli.run('done', '42');
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /No task with id "42"/);

    const badDate = cli.run('add', 'task', '-d', 'whenever');
    assert.equal(badDate.status, 1);
    assert.match(badDate.stderr, /Could not understand date/);

    const unknown = cli.run('frobnicate');
    assert.equal(unknown.status, 1);
    assert.match(unknown.stderr, /Unknown command/);

    const noTitle = cli.run('add');
    assert.equal(noTitle.status, 1);
    assert.match(noTitle.stderr, /Missing task title/);
  } finally {
    cli.cleanup();
  }
});

test('help and version work', () => {
  const cli = workspace();
  try {
    const help = cli.run('help');
    assert.equal(help.status, 0);
    assert.match(help.stdout, /Usage: task <command>/);
    assert.match(help.stdout, /add/);

    const commandHelp = cli.run('help', 'add');
    assert.equal(commandHelp.status, 0);
    assert.match(commandHelp.stdout, /--priority/);

    const version = cli.run('--version');
    assert.equal(version.status, 0);
    assert.match(version.stdout.trim(), /^\d+\.\d+\.\d+$/);
  } finally {
    cli.cleanup();
  }
});
