const DAY_MS = 24 * 60 * 60 * 1000;

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const WEEKDAY_NAMES = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

export function startOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromISODate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return toISODate(date) === iso ? date : null;
}

export function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMonths(date, months) {
  const copy = new Date(date);
  const day = copy.getDate();
  copy.setDate(1);
  copy.setMonth(copy.getMonth() + months);
  const daysInTarget = new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate();
  copy.setDate(Math.min(day, daysInTarget));
  return copy;
}

export function diffDays(target, now = new Date()) {
  const date = typeof target === 'string' ? fromISODate(target) : startOfDay(target);
  if (!date) throw new Error(`Invalid date: ${target}`);
  return Math.round((date.getTime() - startOfDay(now).getTime()) / DAY_MS);
}

const UNIT_DAYS = {
  d: 1, day: 1, days: 1,
  w: 7, week: 7, weeks: 7,
};

const UNIT_MONTHS = {
  m: 1, mo: 1, month: 1, months: 1,
};

export function parseDate(input, now = new Date()) {
  const text = String(input ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!text) throw new Error('Date cannot be empty.');

  const base = startOfDay(now);

  if (text === 'today' || text === 'tonight' || text === 'td') return toISODate(base);
  if (text === 'tomorrow' || text === 'tmr' || text === 'tmrw') return toISODate(addDays(base, 1));
  if (text === 'yesterday') return toISODate(addDays(base, -1));

  const offset = /^(?:in\s+)?([+-]?\d+)\s*([a-z]+)$/.exec(text);
  if (offset) {
    const amount = Number(offset[1]);
    const unit = offset[2];
    if (unit in UNIT_DAYS) return toISODate(addDays(base, amount * UNIT_DAYS[unit]));
    if (unit in UNIT_MONTHS) return toISODate(addMonths(base, amount * UNIT_MONTHS[unit]));
  }

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (iso) {
    return toISODate(validated(Number(iso[1]), Number(iso[2]), Number(iso[3]), input));
  }

  const monthDay = /^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/.exec(text);
  if (monthDay) {
    let year = monthDay[3] ? Number(monthDay[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    return toISODate(validated(year, Number(monthDay[1]), Number(monthDay[2]), input));
  }

  let rest = text;
  let modifier = null;
  const prefix = /^(next|this)\s+/.exec(text);
  if (prefix) {
    modifier = prefix[1];
    rest = text.slice(prefix[0].length);
  }
  const weekday = WEEKDAY_NAMES.find(
    (name) => name === rest || (rest.length >= 3 && name.startsWith(rest)),
  );
  if (weekday) {
    const target = WEEKDAY_NAMES.indexOf(weekday);
    let delta = (target - base.getDay() + 7) % 7;
    if (modifier === 'next') delta += 7;
    return toISODate(addDays(base, delta));
  }

  throw new Error(
    `Could not understand date "${input}". Try: today, tomorrow, fri, +3d, 2026-11-05`,
  );
}

function validated(year, month, day, original) {
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    throw new Error(`"${original}" is not a real date.`);
  }
  return date;
}

export function describeDue(iso, now = new Date()) {
  const days = diffDays(iso, now);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days < 0) return `${-days}d overdue`;
  if (days <= 6) return `in ${days}d`;

  const date = fromISODate(iso);
  const label = `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
  return date.getFullYear() === now.getFullYear()
    ? label
    : `${label}, ${date.getFullYear()}`;
}
