# Roadmap: a mod for Claude Code

**English** · [Español](README.es.md)

A sidebar where Claude breaks down the task you asked for and tracks its progress, instead of narrating every step in the chat.

- **Steps with a status:** ○ to do, ◐ in progress, ● done, ✕ blocked, – skipped.
- **Progress percentage** with a progress bar and "N/M steps".
- **Inputs and outputs** of each step, summarised in a few words.
- **Details on click:** click a step to see what was done, decisions, commands and files, in markdown.
- **English and Spanish**, for both the sidebar and the steps Claude writes.

## Install

At the prompt of a Claude Code session in a terminal:

```
/plugin install roadmap --marketplace MauricioRodCar/claude-roadmap-mod
```

Answer `y` to add the marketplace, then pick a scope (the user scope is listed first).

From a shell:

```bash
claude plugin install roadmap --marketplace MauricioRodCar/claude-roadmap-mod
```

In the desktop app, where `/plugin` doesn't run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `MauricioRodCar/claude-roadmap-mod`, then **Add plugin**.

## Usage

Ask Claude for a task with several steps. Before starting, Claude posts the plan to the sidebar, and it updates the sidebar each time a step is finished.

| Command | What it does |
| --- | --- |
| `/roadmap` | Opens the sidebar if you closed it |
| `/roadmap clear` | Empties the roadmap |
| `/roadmap lang en` | Switches to English |
| `/roadmap lang es` | Switches to Spanish |

### Language

The default is English. You can change it in two ways:

- With `/roadmap lang en` or `/roadmap lang es`.
- In `/config`, under the **Language** option of the `roadmap` plugin.

Both write the same setting (`pluginConfigs.roadmap.options.language` in `settings.json`). The mod reloads in the new language, and Claude writes new steps in that language.

## How it works

The mod registers one tool, `mcp__roadmap__track`. Claude calls it with the plan, or with changes to its steps:

```json
{
  "title": "Add login",
  "steps": [
    { "id": "1", "t": "Read the code", "in": ["src/"], "out": ["auth map"] },
    { "id": "2", "t": "Write the form" }
  ]
}
```

- **With `title`:** replaces the plan.
- **Without `title`:** patches one or more steps by `id`. A new `id` is added at the end.
- **Automatic advance:** when no step is in progress, the first to-do step starts. One call per finished step is enough.
- **Keys:** `t` is the title, `s` the status (`todo`, `doing`, `done`, `blocked`, `skip`), `in` and `out` the inputs and outputs, `d` the markdown details.

It also adds a short guide to the system prompt that tells Claude when and how to use the sidebar. The guide is added only where the tool is available.

### Built to use few tokens

- One tool, with short keys.
- The tool's reply is just `ok 2/5`.
- The sidebar is drawn by the client and costs no tokens.

## Development

```
.claude-plugin/plugin.json       manifest (including the language option)
.claude-plugin/marketplace.json  this repository's marketplace
hooks/hooks.json                 points to the hooks module
hooks/register.tsx               tool, guide, command, translations and sidebar
types/index.d.ts                 state contract ($.state)
tests/roadmap.test.ts            tests, run in both languages
```

To try it from a local copy:

```bash
claude --plugin-dir ./claude-roadmap-mod
```

To validate it and run the tests:

```bash
claude plugin validate .
```

```bash
claude plugin test .
```

Claude Code writes the types to `.claude-plugin/types/` when it loads the mod (that folder is in `.gitignore`). With them in place, `tsc -p .` type-checks the mod.

To add a language, add an entry to `STRINGS` in `hooks/register.tsx` and its code to `options` in `plugin.json`.

> The Claude Code mods API is in early access and may change between releases.

## License

[MIT](LICENSE)
