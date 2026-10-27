# taskman

A small, dependency-free task manager for the terminal. Plain Node.js (18+), no build
step, no npm dependencies — tasks live in a single JSON file.

```
$ task add "Ship the release" -p high -d fri -t work
✔ Added #1 Ship the release · due in 3d

$ task add "Buy oat milk" -d tomorrow -t home
✔ Added #2 Buy oat milk · due tomorrow

$ task ls
○  1  Ship the release      #work  in 3d      high
○  2  Buy oat milk          #home  tomorrow   med
```

## Install

```sh
npm link          # installs the `task` command globally
npm test          # run the test suite
```

Or run it without installing:

```sh
node bin/task.js add "Buy milk"
```

## Commands

| Command | Aliases | Description |
| --- | --- | --- |
| `add <title>` | `a`, `new` | Add a task |
| `list` | `ls`, `l` | List tasks |
| `done <id...>` | `do`, `complete`, `check` | Mark tasks as done |
| `undone <id...>` | `undo`, `uncheck`, `reopen` | Reopen completed tasks |
| `edit <id>` | `e`, `update` | Change a task |
| `rm <id...>` | `remove`, `del`, `delete` | Delete tasks |
| `show <id...>` | `view`, `get` | Show task details |
| `clear` | `clean` | Delete completed tasks |
| `stats` | `stat` | Print a summary |
| `tags` | | List tags with counts |
| `help [command]` | | Show help |

Ids accept ranges and comma lists: `task done 1-3,last`.

## Adding tasks

```sh
task add "Pay the electricity bill" -p high -d -2d -t home -t bills -n "Account 1234"
```

| Option | Meaning |
| --- | --- |
| `-p, --priority <level>` | `low`, `medium` (default) or `high` — also `l`, `m`, `h` |
| `-d, --due <date>` | Due date; see the formats below |
| `-t, --tag <tag>` | Comma separated, repeatable |
| `-n, --note <text>` | Free-form note shown in `task show` |
| `--json` | Print the created task as JSON |

## Due dates

| Input | Result |
| --- | --- |
| `today`, `tomorrow`, `yesterday` | The obvious day |
| `fri`, `monday`, `next friday` | Upcoming weekday / that weekday next week |
| `+3d`, `-2w`, `in 5 days` | Offset from today (`d`, `w`, `m` units) |
| `2026-11-05` | Exact date |
| `11/5`, `5/11/2027` | Month/day, optionally with a year |
| `none` (in `edit`) | Clear the due date |

Dates are stored as `YYYY-MM-DD` and compared in local time.

## Listing and filtering

```sh
task ls                        # open tasks, smart order
task ls --all                  # include completed
task ls --done                 # only completed
task ls -d today               # due today: overdue | today | week | none
task ls -p high                # by priority
task ls -t work -t urgent      # tasks with every listed tag
task ls -s "invoice"           # search titles, notes and tags
task ls --sort due --reverse   # smart | due | priority | created | id | title
```

Smart order puts overdue tasks first, then tasks due today, then upcoming, then
undated — with higher priority first inside each group. Completed tasks always sink
to the bottom.

## Editing and finishing

```sh
task done 2
task undone 2
task edit 2 "Ship the release v0.2" -p high -d +2w
task edit 2 --due none --tag none --note none   # clear fields
task rm 5
task clear --done                               # remove completed tasks
task clear --all --yes                          # remove everything
```

## Stats and tags

```sh
task stats
# Tasks     5 total · 4 open · 1 done · 20% complete
# Due       1 overdue · 1 today · 2 in the next 7 days
# Priority  high 2 · medium 2 · low 0
# Tags      #home 2 · #bills 1 · #work 1

task tags
task tags --all
```

## Scripting with JSON

`add`, `list`, `done`, `undone`, `edit`, `rm`, `show`, `clear`, `stats` and `tags`
accept `--json`:

```sh
task add "Automated task" --json | jq .id
task ls --json | jq -r '.[] | "\(.id)\t\(.title)"'
task stats --json | jq .overdue
```

## Storage

Tasks are stored in `~/.taskman/tasks.json` by default. Override the location with
an environment variable:

```sh
export TASKMAN_FILE="$HOME/notes/tasks.json"
```

Writes are atomic (temporary file + rename), so an interrupted command will not
corrupt your tasks. The file is human-readable if you ever want to edit it by hand.

Colour is enabled only when stdout is a TTY. Set `NO_COLOR=1` to disable it.

## Exit codes

- `0` — success
- `1` — usage error, unknown task id, unreadable task file

## Project layout

```
bin/task.js     entry point
src/cli.js      command definitions, dispatch, help
src/args.js     small flag parser
src/tasks.js    task model: add, update, filter, sort, stats
src/store.js    JSON persistence
src/dates.js    date parsing and human-friendly labels
src/parse.js    priority/tag/due value parsing
src/format.js   table and detail rendering
test/           node:test suite
```

Run the tests with `npm test`.

## Learn JavaScript

`lessons/` contains an 8-part beginner course that prepares you for TypeScript,
using this task manager as the running example — primitives, functions, arrays,
closures, errors, async, classes, then testing and the TS bridge. Start at
[lessons/README.md](lessons/README.md) and run the lessons with plain Node:

```sh
node lessons/01-values-and-types.js
```
