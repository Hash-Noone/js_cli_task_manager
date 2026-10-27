import process from 'node:process';
import { color } from './colors.js';
import { describeDue, diffDays } from './dates.js';

export function truncate(text, width) {
  if (width <= 0) return '';
  if (text.length <= width) return text;
  if (width === 1) return '…';
  return `${text.slice(0, width - 1).replace(/\s+$/, '')}…`;
}

export function formatTimestamp(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function renderTaskList(tasks, { now = new Date(), columns } = {}) {
  const width = Math.max(40, columns || process.stdout.columns || 80);

  const rows = tasks.map((task) => ({
    task,
    mark: task.done ? '✔' : '○',
    id: String(task.id),
    title: task.title,
    tags: task.tags.map((tag) => `#${tag}`).join(' '),
    due: task.due ? describeDue(task.due, now) : '',
    priority: task.priority === 'medium' ? 'med' : task.priority,
  }));

  const widest = (values) => values.reduce((max, value) => Math.max(max, value.length), 1);

  const idWidth = widest(rows.map((row) => row.id));
  const tagsWidth = Math.min(22, widest(rows.map((row) => row.tags)));
  const dueWidth = Math.min(12, widest(rows.map((row) => row.due)));
  const priorityWidth = widest(rows.map((row) => row.priority));
  const fixed = 1 + idWidth + tagsWidth + dueWidth + priorityWidth + 10;
  const titleWidth = Math.min(60, Math.max(16, width - fixed));

  return rows.map((row) => {
    const cells = [
      { text: row.mark, width: 1, tone: row.task.done ? color.green : color.dim },
      { text: row.id, width: idWidth, align: 'right', tone: color.dim },
      {
        text: truncate(row.title, titleWidth),
        width: titleWidth,
        tone: row.task.done ? color.dim : color.plain,
      },
      { text: truncate(row.tags, tagsWidth), width: tagsWidth, tone: color.cyan },
      { text: truncate(row.due, dueWidth), width: dueWidth, tone: dueTone(row.task, now) },
      {
        text: row.priority,
        width: 0,
        align: 'right',
        tone: row.task.priority === 'high'
          ? color.red
          : row.task.priority === 'low' ? color.dim : color.plain,
      },
    ];

    return cells.map((cell) => {
      let text = cell.text;
      if (cell.width > 0) {
        text = cell.align === 'right'
          ? text.padStart(cell.width)
          : text.padEnd(cell.width);
      }
      return cell.tone(text);
    }).join('  ');
  }).join('\n');
}

function dueTone(task, now) {
  if (!task.due) return color.plain;
  if (task.done) return color.dim;
  const days = diffDays(task.due, now);
  if (days < 0) return color.red;
  if (days <= 1) return color.yellow;
  return color.plain;
}

export function renderTaskDetail(task, { now = new Date() } = {}) {
  const lines = [];
  lines.push(`${color.dim(`#${task.id}`)}  ${color.bold(task.title)}`);
  lines.push(color.dim('─'.repeat(Math.min(64, Math.max(24, task.title.length + 10)))));

  const status = task.done
    ? color.green('done')
    : color.yellow('open');

  const due = task.due
    ? `${task.due} ${color.dim(`(${describeDue(task.due, now)})`)}`
    : color.dim('—');

  const rows = [
    ['Status', status],
    ['Priority', task.priority === 'high'
      ? color.red(task.priority)
      : task.priority === 'low' ? color.dim(task.priority) : task.priority],
    ['Due', due],
    ['Tags', task.tags.length
      ? task.tags.map((tag) => color.cyan(`#${tag}`)).join(' ')
      : color.dim('—')],
    ['Created', formatTimestamp(task.createdAt)],
  ];

  if (task.done) rows.push(['Completed', formatTimestamp(task.completedAt)]);

  for (const [label, value] of rows) {
    lines.push(`${color.dim(label.padEnd(10))} ${value}`);
  }

  if (task.notes) {
    lines.push('');
    lines.push(color.dim('Notes'));
    for (const line of task.notes.split('\n')) lines.push(`  ${line}`);
  }

  return lines.join('\n');
}

export function renderStats(stats) {
  if (stats.total === 0) {
    return color.dim('No tasks yet. Add one: task add "Buy milk"');
  }

  const row = (label, value) => `${color.dim(label.padEnd(9))} ${value}`;
  const lines = [];

  lines.push(row(
    'Tasks',
    `${stats.total} total · ${stats.open} open · ${stats.done} done · ${stats.completion}% complete`,
  ));

  const dueParts = [
    stats.overdue > 0 ? color.red(`${stats.overdue} overdue`) : `${stats.overdue} overdue`,
    `${stats.dueToday} today`,
    `${stats.dueWeek} in the next 7 days`,
  ];
  lines.push(row('Due', dueParts.join(' · ')));

  lines.push(row(
    'Priority',
    `high ${stats.byPriority.high} · medium ${stats.byPriority.medium} · low ${stats.byPriority.low}`,
  ));

  if (stats.byTag.length > 0) {
    const tags = stats.byTag
      .slice(0, 8)
      .map(({ tag, count }) => `${color.cyan(`#${tag}`)} ${count}`)
      .join(' · ');
    lines.push(row('Tags', tags));
  }

  return lines.join('\n');
}
