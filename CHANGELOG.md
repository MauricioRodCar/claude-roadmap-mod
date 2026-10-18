# Changelog

## 0.3.0

- English and Spanish: the sidebar, the command and the steps Claude writes follow the `language` option (`en` by default).
- `/roadmap lang en|es` switches the language; it is also in `/config`.
- English README, with the Spanish one in `README.es.md`.

## 0.2.0

- One tool, `track`, instead of `set_plan` and `update_step`: with `title` it replaces the plan; without it, it patches one or more steps.
- The next to-do step starts by itself: one call per finished step.
- Short keys and statuses (`t`, `s`, `in`, `out`, `d`; `todo`, `doing`, `done`, `blocked`, `skip`).
- Shorter system-prompt guide, added only where the tool is offered (not to subagents without it).
- The tool's reply is reduced to `ok <done>/<total>`.

## 0.1.0

- First release: sidebar with steps, progress percentage, inputs, outputs and details on click.
