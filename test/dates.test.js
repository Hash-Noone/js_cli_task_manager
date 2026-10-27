import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  describeDue,
  diffDays,
  parseDate,
  startOfDay,
  toISODate,
} from '../src/dates.js';

const now = new Date(2026, 9, 27, 15, 30, 0);
const iso = (offset) => toISODate(addDays(startOfDay(now), offset));

test('parses day words', () => {
  assert.equal(parseDate('today', now), iso(0));
  assert.equal(parseDate('Tonight', now), iso(0));
  assert.equal(parseDate('tomorrow', now), iso(1));
  assert.equal(parseDate('yesterday', now), iso(-1));
});

test('parses explicit offsets', () => {
  assert.equal(parseDate('+3d', now), iso(3));
  assert.equal(parseDate('-2w', now), iso(-14));
  assert.equal(parseDate('in 5 days', now), iso(5));
  assert.equal(parseDate('in 1 month', now), '2026-11-27');
});

test('parses ISO dates and rejects impossible ones', () => {
  assert.equal(parseDate('2026-11-05', now), '2026-11-05');
  assert.equal(parseDate('2027-1-2', now), '2027-01-02');
  assert.throws(() => parseDate('2026-02-30', now), /not a real date/);
  assert.throws(() => parseDate('2026-13-01', now), /not a real date/);
});

test('parses month/day forms', () => {
  assert.equal(parseDate('11/5', now), '2026-11-05');
  assert.equal(parseDate('11-5', now), '2026-11-05');
  assert.equal(parseDate('5/11/2027', now), '2027-05-11');
  assert.throws(() => parseDate('2/30', now), /not a real date/);
});

test('resolves weekdays to the upcoming occurrence', () => {
  const fridayDelta = (5 - now.getDay() + 7) % 7;
  assert.equal(parseDate('friday', now), iso(fridayDelta));
  assert.equal(parseDate('fri', now), iso(fridayDelta));
  assert.equal(parseDate('next friday', now), iso(fridayDelta + 7));
});

test('rejects nonsense', () => {
  assert.throws(() => parseDate('someday', now), /Could not understand/);
  assert.throws(() => parseDate('', now), /cannot be empty/);
});

test('describeDue produces readable labels', () => {
  assert.equal(describeDue(iso(0), now), 'today');
  assert.equal(describeDue(iso(1), now), 'tomorrow');
  assert.equal(describeDue(iso(-1), now), 'yesterday');
  assert.equal(describeDue(iso(-3), now), '3d overdue');
  assert.equal(describeDue(iso(4), now), 'in 4d');
  assert.equal(describeDue('2026-12-24', now), 'Dec 24');
  assert.equal(describeDue('2028-01-02', now), 'Jan 2, 2028');
});

test('diffDays is calendar based', () => {
  assert.equal(diffDays(iso(5), now), 5);
  assert.equal(diffDays(iso(-5), now), -5);
});
