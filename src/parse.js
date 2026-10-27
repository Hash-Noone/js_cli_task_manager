import { parseDate } from './dates.js';

export const PRIORITIES = ['low', 'medium', 'high'];

const PRIORITY_ALIASES = {
  l: 'low',
  low: 'low',
  m: 'medium',
  med: 'medium',
  medium: 'medium',
  n: 'medium',
  normal: 'medium',
  h: 'high',
  high: 'high',
};

export function parsePriority(value) {
  const key = String(value ?? '').trim().toLowerCase();
  const priority = PRIORITY_ALIASES[key];
  if (!priority) {
    throw new Error(`Unknown priority "${value}". Use low, medium or high.`);
  }
  return priority;
}

export function parseTags(values) {
  const list = Array.isArray(values) ? values : values == null ? [] : [values];
  const tags = [];
  for (const value of list) {
    for (const part of String(value).split(',')) {
      const tag = part.trim().replace(/^#+/, '').toLowerCase();
      if (tag && !tags.includes(tag)) tags.push(tag);
    }
  }
  return tags;
}

export function parseDue(value, now = new Date()) {
  if (value === undefined) return undefined;
  const text = String(value).trim().toLowerCase();
  if (text === '' || text === 'none' || text === 'never' || text === '-') return null;
  return parseDate(text, now);
}
