const ANSI = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

const noColor = 'NO_COLOR' in process.env;
const forceColor = process.env.FORCE_COLOR != null && process.env.FORCE_COLOR !== '0';
const enabled = !noColor && (forceColor || (process.stdout.isTTY === true && process.env.TERM !== 'dumb'));

const wrap = (open, close) => (value) => {
  if (!enabled) return String(value);
  return `\u001b[${open}m${value}\u001b[${close}m`;
};

export function stripAnsi(value) {
  return String(value).replace(ANSI, '');
}

export const color = {
  plain: (value) => String(value),
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  italic: wrap(3, 23),
  underline: wrap(4, 24),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39),
};

export const colorsEnabled = enabled;
