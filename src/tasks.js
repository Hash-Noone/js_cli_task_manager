import { PRIORITIES } from './parse.js';
import { diffDays } from './dates.js';

const PRIORITY_WEIGHT = { high: 0, medium: 1, low: 2 };

export function addTask(db, input = {}) {
  const title = String(input.title ?? '').trim();
  if (!title) throw new Error('Task title is required.');

  const priority = input.priority ?? 'medium';
  if (!PRIORITIES.includes(priority)) {
    throw new Error(`Unknown priority "${priority}".`);
  }

  const task = {
    id: db.nextId,
    title,
    done: false,
    priority,
    tags: input.tags ?? [],
    due: input.due ?? null,
    notes: input.notes ?? '',
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  db.nextId += 1;
  db.tasks.push(task);
  return task;
}

export function resolveRef(db, ref) {
  const text = String(ref ?? '').trim().toLowerCase();

  if (text === 'last') {
    if (db.tasks.length === 0) return null;
    return db.tasks.reduce((newest, task) => (task.id > newest.id ? task : newest));
  }

  if (!/^\d+$/.test(text)) return null;
  const id = Number(text);
  return db.tasks.find((task) => task.id === id) ?? null;
}

export function requireRef(db, ref) {
  const task = resolveRef(db, ref);
  if (!task) throw new Error(`No task with id "${ref}".`);
  return task;
}

export function updateTask(task, patch = {}) {
  const changed = [];

  if (patch.title !== undefined) {
    const title = String(patch.title).trim();
    if (!title) throw new Error('Task title cannot be empty.');
    if (title !== task.title) {
      task.title = title;
      changed.push('title');
    }
  }

  if (patch.priority !== undefined && patch.priority !== task.priority) {
    task.priority = patch.priority;
    changed.push('priority');
  }

  if (patch.due !== undefined && patch.due !== task.due) {
    task.due = patch.due;
    changed.push('due');
  }

  if (patch.tags !== undefined) {
    const tags = patch.tags ?? [];
    if (tags.join('\u0000') !== task.tags.join('\u0000')) {
      task.tags = tags;
      changed.push('tags');
    }
  }

  if (patch.notes !== undefined && patch.notes !== task.notes) {
    task.notes = patch.notes;
    changed.push('notes');
  }

  return changed;
}

export function removeTask(db, id) {
  const index = db.tasks.findIndex((task) => task.id === id);
  if (index === -1) return null;
  return db.tasks.splice(index, 1)[0];
}

export function selectTasks(db, options = {}) {
  const {
    status = 'open',
    tags = [],
    priority,
    due,
    search,
    sort = 'smart',
    reverse = false,
    now = new Date(),
  } = options;

  let tasks = db.tasks.slice();

  if (status === 'open') tasks = tasks.filter((task) => !task.done);
  else if (status === 'done') tasks = tasks.filter((task) => task.done);

  if (tags.length > 0) {
    tasks = tasks.filter((task) => tags.every((tag) => task.tags.includes(tag)));
  }

  if (priority) {
    tasks = tasks.filter((task) => task.priority === priority);
  }

  if (due) {
    tasks = tasks.filter((task) => matchesDue(task, due, now));
  }

  if (search) {
    const needle = search.toLowerCase();
    tasks = tasks.filter((task) => {
      const haystack = `${task.title} ${task.notes} ${task.tags.join(' ')}`.toLowerCase();
      return haystack.includes(needle);
    });
  }

  tasks.sort(comparator(sort, now));
  if (reverse) tasks.reverse();

  return tasks;
}

function matchesDue(task, due, now) {
  if (due === 'none') return !task.due;
  if (!task.due) return false;

  const days = diffDays(task.due, now);
  if (due === 'overdue') return days < 0;
  if (due === 'today') return days === 0;
  if (due === 'week') return days >= 0 && days <= 7;
  return true;
}

function comparator(sort, now) {
  switch (sort) {
    case 'due':
      return (a, b) => compareDue(a, b) || a.id - b.id;
    case 'priority':
      return (a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
        || compareDue(a, b)
        || a.id - b.id;
    case 'created':
      return (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id;
    case 'id':
      return (a, b) => a.id - b.id;
    case 'title':
      return (a, b) => a.title.localeCompare(b.title) || a.id - b.id;
    case 'smart':
    default:
      return (a, b) => Number(a.done) - Number(b.done)
        || dueBucket(a, now) - dueBucket(b, now)
        || PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
        || compareDue(a, b)
        || a.id - b.id;
  }
}

// Overdue, then due today, then upcoming, then undated.
function dueBucket(task, now) {
  if (!task.due) return 3;
  const days = diffDays(task.due, now);
  if (days < 0) return 0;
  if (days === 0) return 1;
  return 2;
}

function compareDue(a, b) {
  if (a.due === b.due) return 0;
  if (!a.due) return 1;
  if (!b.due) return -1;
  return a.due < b.due ? -1 : 1;
}

export function summarize(db, now = new Date()) {
  const total = db.tasks.length;
  const done = db.tasks.filter((task) => task.done).length;
  const open = total - done;

  const openTasks = db.tasks.filter((task) => !task.done);
  let overdue = 0;
  let dueToday = 0;
  let dueWeek = 0;

  for (const task of openTasks) {
    if (!task.due) continue;
    const days = diffDays(task.due, now);
    if (days < 0) overdue += 1;
    else if (days === 0) dueToday += 1;
    if (days >= 0 && days <= 7) dueWeek += 1;
  }

  const byPriority = { high: 0, medium: 0, low: 0 };
  const tagCounts = new Map();

  for (const task of openTasks) {
    byPriority[task.priority] += 1;
    for (const tag of task.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const byTag = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  return {
    total,
    open,
    done,
    overdue,
    dueToday,
    dueWeek,
    completion: total === 0 ? 0 : Math.round((done / total) * 100),
    byPriority,
    byTag,
  };
}
