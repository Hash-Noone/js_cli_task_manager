import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PRIORITIES } from './parse.js';

export function resolveFile(file) {
  if (file) return path.resolve(file);
  if (process.env.TASKMAN_FILE) return path.resolve(process.env.TASKMAN_FILE);
  return path.join(os.homedir(), '.taskman', 'tasks.json');
}

export function emptyDb() {
  return { version: 1, nextId: 1, tasks: [] };
}

export function load(file) {
  const target = resolveFile(file);
  let raw;
  try {
    raw = fs.readFileSync(target, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return emptyDb();
    throw error;
  }

  if (!raw.trim()) return emptyDb();

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Task file is not valid JSON: ${target}`);
  }

  if (!data || typeof data !== 'object' || !Array.isArray(data.tasks)) {
    throw new Error(`Task file has an unexpected shape: ${target}`);
  }

  const tasks = data.tasks
    .map((task) => normalizeTask(task))
    .filter(Boolean);

  const highestId = tasks.reduce((max, task) => Math.max(max, task.id), 0);
  const storedNext = Number.isInteger(data.nextId) && data.nextId > 0 ? data.nextId : 1;

  return {
    version: 1,
    nextId: Math.max(storedNext, highestId + 1),
    tasks,
  };
}

export function save(db, file) {
  const target = resolveFile(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });

  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(db, null, 2)}\n`);
  fs.renameSync(temporary, target);
}

function normalizeTask(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = Number(raw.id);
  if (!Number.isInteger(id) || id <= 0) return null;

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;

  return {
    id,
    title,
    done: Boolean(raw.done),
    priority: PRIORITIES.includes(raw.priority) ? raw.priority : 'medium',
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    due: typeof raw.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.due) ? raw.due : null,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : null,
  };
}
