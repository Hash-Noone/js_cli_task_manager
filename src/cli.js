import { readFileSync } from 'node:fs';
import {
  addTask,
  removeTask,
  requireRef,
  selectTasks,
  summarize,
  updateTask,
} from './tasks.js';
import { load, save } from './store.js';
import { parseArgs, UsageError } from './args.js';
import { parseDue, parsePriority, parseTags } from './parse.js';
import { color } from './colors.js';
import { describeDue } from './dates.js';
import { renderStats, renderTaskDetail, renderTaskList } from './format.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const SORTS = ['smart', 'due', 'priority', 'created', 'id', 'title'];
const DUE_FILTERS = ['overdue', 'today', 'week', 'none'];

const commands = {
  add: {
    description: 'Add a task',
    aliases: ['a', 'new'],
    usage: 'task add <title> [options]',
    valueFlags: ['priority', 'due', 'tag', 'note'],
    booleanFlags: ['json'],
    repeatable: ['tag'],
    shortFlags: { p: 'priority', d: 'due', t: 'tag', n: 'note' },
    options: [
      ['-p, --priority <level>', 'low, medium or high (default: medium)'],
      ['-d, --due <date>', 'today, tomorrow, fri, +3d, 2026-11-05'],
      ['-t, --tag <tag>', 'comma separated, repeatable'],
      ['-n, --note <text>', 'free-form note'],
    ],
    example: 'task add "Ship the release" -p high -d fri -t work',
    run: cmdAdd,
  },

  list: {
    description: 'List tasks',
    aliases: ['ls', 'l'],
    usage: 'task list [options]',
    valueFlags: ['tag', 'priority', 'due', 'sort', 'search'],
    booleanFlags: ['all', 'done', 'open', 'json', 'reverse'],
    repeatable: ['tag'],
    shortFlags: { t: 'tag', p: 'priority', d: 'due', s: 'search' },
    options: [
      ['-a, --all', 'include completed tasks'],
      ['--done', 'only completed tasks'],
      ['--open', 'only open tasks (default)'],
      ['-t, --tag <tag>', 'filter by tag, repeatable'],
      ['-p, --priority <level>', 'filter by priority'],
      ['-d, --due <filter>', `overdue, today, week or none`],
      ['-s, --search <text>', 'search titles, notes and tags'],
      ['--sort <key>', `smart, due, priority, created, id or title (default: smart)`],
      ['--reverse', 'reverse the order'],
    ],
    example: 'task ls -d today --sort priority',
    run: cmdList,
  },

  done: {
    description: 'Mark tasks as done',
    aliases: ['do', 'complete', 'check'],
    usage: 'task done <id...> [options]',
    valueFlags: [],
    booleanFlags: ['json'],
    shortFlags: {},
    options: [],
    example: 'task done 3 4',
    run: (ctx) => cmdSetDone(ctx, true),
  },

  undone: {
    description: 'Reopen completed tasks',
    aliases: ['undo', 'uncheck', 'reopen'],
    usage: 'task undone <id...> [options]',
    valueFlags: [],
    booleanFlags: ['json'],
    shortFlags: {},
    options: [],
    example: 'task undone 3',
    run: (ctx) => cmdSetDone(ctx, false),
  },

  edit: {
    description: 'Change a task',
    aliases: ['e', 'update'],
    usage: 'task edit <id> [title] [options]',
    valueFlags: ['title', 'priority', 'due', 'tag', 'note'],
    booleanFlags: ['json'],
    repeatable: ['tag'],
    shortFlags: { p: 'priority', d: 'due', t: 'tag', n: 'note' },
    options: [
      ['--title <text>', 'replace the title'],
      ['-p, --priority <level>', 'low, medium or high'],
      ['-d, --due <date>', 'a date, or "none" to clear'],
      ['-t, --tag <tag>', 'replace tags (or "none" to clear)'],
      ['-n, --note <text>', 'replace the note'],
    ],
    example: 'task edit 3 -d tomorrow -p high',
    run: cmdEdit,
  },

  rm: {
    description: 'Delete tasks',
    aliases: ['remove', 'del', 'delete'],
    usage: 'task rm <id...> [options]',
    valueFlags: [],
    booleanFlags: ['json'],
    shortFlags: {},
    options: [],
    example: 'task rm 3 4',
    run: cmdRm,
  },

  show: {
    description: 'Show task details',
    aliases: ['view', 'get'],
    usage: 'task show <id...> [options]',
    valueFlags: [],
    booleanFlags: ['json'],
    shortFlags: {},
    options: [],
    example: 'task show 3',
    run: cmdShow,
  },

  clear: {
    description: 'Delete completed tasks',
    aliases: ['clean'],
    usage: 'task clear --done | --all --yes',
    valueFlags: [],
    booleanFlags: ['done', 'all', 'yes', 'json'],
    shortFlags: { d: 'done', y: 'yes' },
    options: [
      ['-d, --done', 'remove every completed task'],
      ['--all', 'remove every task (requires --yes)'],
      ['-y, --yes', 'skip the safety check for --all'],
    ],
    example: 'task clear --done',
    run: cmdClear,
  },

  stats: {
    description: 'Show a summary',
    aliases: ['stat'],
    usage: 'task stats [options]',
    valueFlags: [],
    booleanFlags: ['json'],
    shortFlags: {},
    options: [],
    example: 'task stats',
    run: cmdStats,
  },

  tags: {
    description: 'List tags with counts',
    aliases: [],
    usage: 'task tags [options]',
    valueFlags: [],
    booleanFlags: ['all', 'json'],
    shortFlags: {},
    options: [
      ['-a, --all', 'include completed tasks'],
    ],
    example: 'task tags',
    run: cmdTags,
  },
};

const COMMAND_ORDER = [
  'add', 'list', 'done', 'undone', 'edit', 'rm', 'show', 'clear', 'stats', 'tags',
];

const aliases = new Map();
for (const [name, command] of Object.entries(commands)) {
  for (const alias of command.aliases) aliases.set(alias, name);
}

export function main(argv) {
  try {
    return run(argv);
  } catch (error) {
    process.stderr.write(`${color.red('error')} ${error.message}\n`);
    if (error.hint) process.stderr.write(`${color.dim(error.hint)}\n`);
    return 1;
  }
}

function run(argv) {
  if (argv.length === 0) {
    printHelp();
    return 0;
  }

  const [first, ...rest] = argv;

  if (first === '--help' || first === '-h') {
    printHelp(rest[0]);
    return 0;
  }

  if (first === '--version' || first === '-v' || first === 'version') {
    console.log(pkg.version);
    return 0;
  }

  if (first === 'help') {
    printHelp(rest[0]);
    return 0;
  }

  const name = resolveCommand(first);
  if (!name) {
    throw new UsageError(
      `Unknown command "${first}".`,
      'Run "task help" to see available commands.',
    );
  }

  const command = commands[name];
  const { flags, positionals } = parseArgs(rest, {
    valueFlags: command.valueFlags,
    booleanFlags: [...command.booleanFlags, 'help', 'json'],
    shortFlags: { ...command.shortFlags, h: 'help' },
    repeatable: command.repeatable,
  });

  if (flags.help) {
    printCommandHelp(name);
    return 0;
  }

  const db = load();
  command.run({ db, flags, positionals, now: new Date() });
  return 0;
}

function resolveCommand(name) {
  if (Object.hasOwn(commands, name)) return name;
  return aliases.get(name) ?? null;
}

function printHelp(topic) {
  if (topic) {
    const name = resolveCommand(topic);
    if (!name) throw new UsageError(`Unknown command "${topic}".`);
    printCommandHelp(name);
    return;
  }

  const width = Math.max(...COMMAND_ORDER.map((name) => name.length));
  const lines = [
    `${color.bold('task')} ${color.dim('· a small task manager for your terminal')}`,
    '',
    `${color.dim('Usage:')} task <command> [options]`,
    '',
    color.dim('Commands:'),
  ];

  for (const name of COMMAND_ORDER) {
    const command = commands[name];
    const extra = command.aliases.length > 0
      ? color.dim(` (${command.aliases.join(', ')})`)
      : '';
    lines.push(`  ${color.cyan(name.padEnd(width))}  ${command.description}${extra}`);
  }

  lines.push(
    '',
    color.dim('Examples:'),
    '  task add "Ship the release" -p high -d fri -t work',
    '  task ls -d today',
    '  task done 3 4',
    '',
    color.dim('Run "task help <command>" for command details.'),
  );

  console.log(lines.join('\n'));
}

function printCommandHelp(name) {
  const command = commands[name];
  const options = [...command.options];

  if (command.booleanFlags.includes('json')) {
    options.push(['--json', 'print machine-readable JSON']);
  }
  options.push(['-h, --help', 'show this help']);

  const width = Math.max(...options.map(([flag]) => flag.length));
  const lines = [
    `${color.bold(`task ${name}`)} ${color.dim(`· ${command.description}`)}`,
    '',
    color.dim('Usage:'),
    `  ${command.usage}`,
  ];

  if (options.length > 0) {
    lines.push('', color.dim('Options:'));
    for (const [flag, description] of options) {
      lines.push(`  ${color.cyan(flag.padEnd(width))}  ${description}`);
    }
  }

  if (command.example) {
    lines.push('', color.dim('Example:'), `  ${command.example}`);
  }

  console.log(lines.join('\n'));
}

function cmdAdd({ db, flags, positionals, now }) {
  const title = positionals.join(' ').trim();
  if (!title) {
    throw new UsageError(
      'Missing task title.',
      'Usage: task add "Buy milk" -d tomorrow -t home',
    );
  }

  const task = addTask(db, {
    title,
    priority: parsePriority(flags.priority ?? 'medium'),
    tags: parseTags(flags.tag),
    due: parseDue(flags.due, now) ?? null,
    notes: typeof flags.note === 'string' ? flags.note : '',
  });

  save(db);

  if (flags.json) return printJson(task);

  let line = `${color.green('✔')} Added ${color.bold(`#${task.id}`)} ${task.title}`;
  if (task.due) line += color.dim(` · due ${describeDue(task.due, now)}`);
  console.log(line);
}

function cmdList({ db, flags, now }) {
  if (flags.done && flags.open) {
    throw new UsageError('Use either --done or --open, not both.');
  }

  const status = flags.all ? 'all' : flags.done ? 'done' : 'open';
  const sort = String(flags.sort ?? 'smart').toLowerCase();
  if (!SORTS.includes(sort)) {
    throw new UsageError(`Unknown sort "${flags.sort}". Use: ${SORTS.join(', ')}.`);
  }

  let due;
  if (flags.due !== undefined) {
    due = String(flags.due).toLowerCase();
    if (!DUE_FILTERS.includes(due)) {
      throw new UsageError(`Unknown due filter "${flags.due}". Use: ${DUE_FILTERS.join(', ')}.`);
    }
  }

  const tasks = selectTasks(db, {
    status,
    tags: parseTags(flags.tag),
    priority: flags.priority === undefined ? undefined : parsePriority(flags.priority),
    due,
    search: typeof flags.search === 'string' ? flags.search : undefined,
    sort,
    reverse: Boolean(flags.reverse),
    now,
  });

  if (flags.json) return printJson(tasks);

  if (tasks.length === 0) {
    if (db.tasks.length === 0) {
      console.log(`${color.dim('No tasks yet.')} Try: task add "Buy milk" -d tomorrow`);
    } else {
      console.log(color.dim('No tasks match those filters.'));
    }
    return;
  }

  console.log(renderTaskList(tasks, { now }));
}

function cmdSetDone({ db, flags, positionals }, done) {
  const refs = parseRefs(positionals);
  const verb = done ? 'done' : 'undone';

  if (refs.length === 0) {
    throw new UsageError(
      'Missing task id.',
      `Usage: task ${verb} 3`,
    );
  }

  const tasks = refs.map((ref) => requireRef(db, ref));
  const changed = tasks.filter((task) => task.done !== done);

  if (changed.length === 0) {
    if (flags.json) return printJson([]);
    console.log(color.dim(done ? 'Already done.' : 'Already open.'));
    return;
  }

  for (const task of changed) {
    task.done = done;
    task.completedAt = done ? new Date().toISOString() : null;
  }

  save(db);
  if (flags.json) return printJson(changed);

  const list = changed
    .map((task) => `${color.bold(`#${task.id}`)} ${task.title}`)
    .join(', ');
  console.log(`${color.green('✔')} ${done ? 'Completed' : 'Reopened'} ${list}`);
}

function cmdEdit({ db, flags, positionals, now }) {
  const [first, ...rest] = positionals;
  if (!first) {
    throw new UsageError(
      'Missing task id.',
      'Usage: task edit 3 --due tomorrow',
    );
  }

  const task = requireRef(db, first);
  const patch = {};

  if (rest.length > 0) patch.title = rest.join(' ');
  if (typeof flags.title === 'string') patch.title = flags.title;
  if (flags.priority !== undefined) patch.priority = parsePriority(flags.priority);
  if (flags.due !== undefined) patch.due = parseDue(flags.due, now);
  if (flags.tag !== undefined) {
    const raw = Array.isArray(flags.tag) ? flags.tag : [flags.tag];
    const cleared = raw.length === 1 && String(raw[0]).toLowerCase() === 'none';
    patch.tags = cleared ? [] : parseTags(raw);
  }
  if (flags.note !== undefined) {
    patch.notes = String(flags.note).toLowerCase() === 'none' ? '' : String(flags.note);
  }

  if (Object.keys(patch).length === 0) {
    throw new UsageError(
      'Nothing to change.',
      'Usage: task edit 3 --due tomorrow --priority high',
    );
  }

  const changed = updateTask(task, patch);
  if (changed.length === 0) {
    if (flags.json) return printJson(task);
    console.log(color.dim('Nothing changed.'));
    return;
  }

  save(db);
  if (flags.json) return printJson(task);

  console.log(`${color.green('✔')} Updated ${color.bold(`#${task.id}`)} (${changed.join(', ')})`);
}

function cmdRm({ db, flags, positionals }) {
  const refs = parseRefs(positionals);
  if (refs.length === 0) {
    throw new UsageError('Missing task id.', 'Usage: task rm 3 4');
  }

  const seen = new Set();
  const tasks = [];
  for (const ref of refs) {
    const task = requireRef(db, ref);
    if (seen.has(task.id)) continue;
    seen.add(task.id);
    tasks.push(task);
  }

  for (const task of tasks) removeTask(db, task.id);
  save(db);

  if (flags.json) return printJson(tasks);

  const list = tasks
    .map((task) => `${color.bold(`#${task.id}`)} ${task.title}`)
    .join(', ');
  console.log(`${color.green('✔')} Removed ${list}`);
}

function cmdShow({ db, flags, positionals, now }) {
  const refs = parseRefs(positionals);
  if (refs.length === 0) {
    throw new UsageError('Missing task id.', 'Usage: task show 3');
  }

  const tasks = refs.map((ref) => requireRef(db, ref));
  if (flags.json) return printJson(tasks.length === 1 ? tasks[0] : tasks);
  console.log(tasks.map((task) => renderTaskDetail(task, { now })).join('\n\n'));
}

function cmdClear({ db, flags }) {
  if (!flags.done && !flags.all) {
    throw new UsageError(
      'Say what to clear: --done, or --all --yes.',
      'Usage: task clear --done',
    );
  }

  if (flags.all && !flags.yes) {
    throw new UsageError(
      'Refusing to delete every task without --yes.',
      'Run "task clear --all --yes" if you really mean it.',
    );
  }

  const targets = flags.all ? db.tasks.slice() : db.tasks.filter((task) => task.done);
  if (targets.length === 0) {
    if (flags.json) return printJson({ removed: 0 });
    console.log(color.dim('Nothing to clear.'));
    return;
  }

  const doomed = new Set(targets);
  db.tasks = db.tasks.filter((task) => !doomed.has(task));
  save(db);

  if (flags.json) return printJson({ removed: targets.length });

  const noun = targets.length === 1 ? 'task' : 'tasks';
  const suffix = flags.all ? '' : ' (completed)';
  console.log(`${color.green('✔')} Cleared ${targets.length} ${noun}${suffix}.`);
}

function cmdStats({ db, flags, now }) {
  const stats = summarize(db, now);
  if (flags.json) return printJson(stats);
  console.log(renderStats(stats));
}

function cmdTags({ db, flags }) {
  const scope = flags.all ? db.tasks : db.tasks.filter((task) => !task.done);
  const counts = new Map();

  for (const task of scope) {
    for (const tag of task.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  if (counts.size === 0) {
    console.log(color.dim('No tags yet. Add one with: task add "Buy milk" -t home'));
    return;
  }

  const sorted = [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  if (flags.json) return printJson(sorted);

  const width = Math.max(...sorted.map(({ tag }) => tag.length)) + 1;
  for (const { tag, count } of sorted) {
    const noun = count === 1 ? 'task' : 'tasks';
    console.log(`${color.cyan(`#${tag}`.padEnd(width))} ${count} ${color.dim(noun)}`);
  }
}

function parseRefs(values) {
  const refs = [];
  for (const value of values) {
    for (const token of String(value).split(',')) {
      const text = token.trim();
      if (!text) continue;

      const range = /^(\d+)\s*-\s*(\d+)$/.exec(text);
      if (range) {
        const start = Number(range[1]);
        const end = Number(range[2]);
        const step = start <= end ? 1 : -1;
        for (let id = start; step > 0 ? id <= end : id >= end; id += step) {
          refs.push(String(id));
        }
      } else {
        refs.push(text);
      }
    }
  }
  return refs;
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}
