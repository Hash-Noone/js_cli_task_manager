export class UsageError extends Error {
  constructor(message, hint) {
    super(message);
    this.name = 'UsageError';
    this.hint = hint;
  }
}

export function parseArgs(argv, options = {}) {
  const {
    valueFlags = [],
    booleanFlags = [],
    shortFlags = {},
    repeatable = [],
  } = options;

  const knownLong = new Set([...valueFlags, ...booleanFlags]);
  const flags = {};
  const positionals = [];

  const assign = (name, value) => {
    if (repeatable.includes(name)) {
      if (!Array.isArray(flags[name])) flags[name] = [];
      flags[name].push(value);
    } else {
      flags[name] = value;
    }
  };

  const readValue = (name, index) => {
    if (index + 1 >= argv.length) {
      throw new UsageError(`Option --${name} needs a value.`);
    }
    return argv[index + 1];
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }

    if (token.startsWith('--')) {
      const body = token.slice(2);
      const equals = body.indexOf('=');
      const name = equals === -1 ? body : body.slice(0, equals);

      if (!knownLong.has(name)) {
        throw new UsageError(`Unknown option --${name}.`);
      }

      let value;
      if (equals !== -1) {
        value = body.slice(equals + 1);
      } else if (valueFlags.includes(name)) {
        value = readValue(name, i);
        i += 1;
      } else {
        value = true;
      }

      assign(name, value);
      continue;
    }

    if (/^-[A-Za-z]$/.test(token)) {
      const letter = token.slice(1);
      const name = shortFlags[letter];
      if (!name) throw new UsageError(`Unknown option ${token}.`);

      let value;
      if (valueFlags.includes(name)) {
        value = readValue(name, i);
        i += 1;
      } else {
        value = true;
      }

      assign(name, value);
      continue;
    }

    positionals.push(token);
  }

  return { flags, positionals };
}
