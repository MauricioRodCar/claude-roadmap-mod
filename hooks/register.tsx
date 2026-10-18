import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Roadmap, Step, StepStatus } from '../types'

const PANE = 'roadmap'
const TITLE = 'Roadmap'
const TOOL = 'mcp__roadmap__track'
const plan = atom({ plugin: 'roadmap', key: 'plan' } as const, null)
const expanded = atom({ plugin: 'roadmap', key: 'expanded' } as const, [])

const STRINGS = {
  en: {
    name: 'English',
    task: 'Task',
    step: (n: number) => `Step ${n}`,
    empty: 'No task in progress',
    hint: 'When you ask for a multi-step task, its breakdown shows up here.',
    steps: 'steps',
    input: 'Input',
    output: 'Output',
    noDetails: '_No details yet._',
    command: 'Open the roadmap sidebar ("clear" empties it, "lang en|es" sets the language)',
    hintArgs: '[clear | lang en|es]',
    opened: 'Roadmap opened.',
    cleared: 'Roadmap cleared.',
    language: (name: string) => `Roadmap language: ${name}.`,
    badLanguage: 'Use /roadmap lang en or /roadmap lang es.',
    denied: (why: string) => `Could not change the language: ${why}`,
  },
  es: {
    name: 'Español',
    task: 'Tarea',
    step: (n: number) => `Paso ${n}`,
    empty: 'Sin tarea en curso',
    hint: 'Cuando me pidas una tarea de varios pasos, su desglose aparecerá aquí.',
    steps: 'pasos',
    input: 'Entrada',
    output: 'Salida',
    noDetails: '_Sin detalles todavía._',
    command: 'Abre la barra lateral del roadmap ("clear" la vacía, "lang en|es" cambia el idioma)',
    hintArgs: '[clear | lang en|es]',
    opened: 'Roadmap abierto.',
    cleared: 'Roadmap vacío.',
    language: (name: string) => `Idioma del roadmap: ${name}.`,
    badLanguage: 'Usa /roadmap lang en o /roadmap lang es.',
    denied: (why: string) => `No pude cambiar el idioma: ${why}`,
  },
}

export type Language = keyof typeof STRINGS
type Words = (typeof STRINGS)[Language]

export function language(value: unknown): Language {
  return value === 'es' ? 'es' : 'en'
}

const STATUSES: readonly StepStatus[] = ['todo', 'doing', 'done', 'blocked', 'skip']

const ICON: Record<StepStatus, string> = {
  todo: '○',
  doing: '◐',
  done: '●',
  blocked: '✕',
  skip: '–',
}

const COLOR: Record<StepStatus, string> = {
  todo: 'inactive',
  doing: 'claude',
  done: 'success',
  blocked: 'error',
  skip: 'subtle',
}

// Sent with every request, so every word here is paid each turn: keep it terse.
const WORDS = { type: 'array', items: { type: 'string' } }
const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Starts a new plan from steps' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          t: { type: 'string' },
          s: { type: 'string', enum: STATUSES },
          in: WORDS,
          out: WORDS,
          d: { type: 'string' },
        },
        required: ['id'],
      },
    },
  },
  required: ['steps'],
}

const DESCRIPTION =
  'Roadmap sidebar. Step: id, t=title, s=status, in/out=inputs/outputs (few words each), d=markdown details shown on click. ' +
  'With title: replaces the plan. Without: patches steps by id (new id appends). The first todo step becomes doing when none is.'

function guide(words: Words): string {
  return (
    `The person follows multi-step tasks in a Roadmap sidebar, not in chat. Before starting one, call ${TOOL} once with title and every step (t, in, out). ` +
    'Then one call per finished step: s "done", real out, a short d; batch steps finished together. Re-plan by sending title again. ' +
    `Keep chat brief and skip it for one-step work. Write the roadmap in ${words.name}.`
  )
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter(item => item !== '') : []
}

function status(value: unknown): StepStatus | undefined {
  return STATUSES.includes(value as StepStatus) ? (value as StepStatus) : undefined
}

function patch(base: Step, raw: Record<string, unknown>): Step {
  const details = 'd' in raw ? text(raw.d) : base.details

  return {
    id: base.id,
    title: text(raw.t) || base.title,
    status: status(raw.s) ?? base.status,
    inputs: 'in' in raw ? list(raw.in) : base.inputs,
    outputs: 'out' in raw ? list(raw.out) : base.outputs,
    ...(details ? { details } : {}),
  }
}

export function apply(
  current: Roadmap | null,
  input: Record<string, unknown>,
  words: Words = STRINGS.en,
): Roadmap {
  const title = text(input.title)
  const patches = (Array.isArray(input.steps) ? input.steps : []).map(
    raw => (raw ?? {}) as Record<string, unknown>,
  )
  let steps = title !== '' || current === null ? [] : current.steps

  for (const raw of patches) {
    const id = text(raw.id) || String(steps.length + 1)
    const found = steps.find(step => step.id === id)
    const base: Step = found ?? { id, title: words.step(steps.length + 1), status: 'todo', inputs: [], outputs: [] }
    const step = patch(base, raw)
    steps = found === undefined ? [...steps, step] : steps.map(one => (one.id === id ? step : one))
  }

  if (!steps.some(step => step.status === 'doing')) {
    const index = steps.findIndex(step => step.status === 'todo')
    if (index >= 0) {
      steps = steps.map((step, at) => (at === index ? { ...step, status: 'doing' } : step))
    }
  }

  return { title: title || current?.title || words.task, steps }
}

export function progress(steps: readonly Step[]): number {
  const counted = steps.filter(step => step.status !== 'skip')
  if (counted.length === 0) {
    return steps.length === 0 ? 0 : 100
  }

  return Math.round((counted.filter(step => step.status === 'done').length / counted.length) * 100)
}

function bar(percent: number, width: number): string {
  const filled = Math.round((percent / 100) * width)

  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

export const register: Register = (on, options) => {
  const words = STRINGS[language(options.language)]

  on('session.start', async ($, e, next) => {
    await $.tool.register({ name: 'track', description: DESCRIPTION, inputSchema: SCHEMA, isDeferred: false })
    await $.command.register({ name: 'roadmap', description: words.command, argumentHint: words.hintArgs })

    return next(e)
  })

  // Only where the tool is offered: subagents without it don't pay for the guide.
  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    if (!e.tools.includes(TOOL)) {
      return composed
    }

    return { sections: [...composed.sections, { id: 'roadmap:guide', text: guide(words), scope: 'session' }] }
  })

  on('command.run', { command: 'roadmap' }, async ($, e) => {
    const [verb = '', value = ''] = text(e.args).split(/\s+/)

    if (verb === 'clear') {
      await update($, plan, () => null)
      await update($, expanded, () => [])

      return { text: words.cleared }
    }

    if (verb === 'lang') {
      if (value !== 'en' && value !== 'es') {
        return { text: words.badLanguage }
      }
      // A change of this option reloads the module, which then speaks the new language.
      const set = await $.config.set({ key: 'roadmap.language', value })

      return { text: set.deny === undefined ? STRINGS[value].language(STRINGS[value].name) : words.denied(set.deny) }
    }

    await $.ui.open({ id: PANE, title: TITLE })

    return { text: words.opened }
  })

  on('tool.call', { tool: TOOL }, async ($, e) => {
    const input = e as unknown as Record<string, unknown>
    const roadmap = await update($, plan, current => apply(current, input, words))
    if (text(input.title) !== '') {
      await update($, expanded, () => [])
    }
    $.ui.open({ id: PANE, title: TITLE }).catch(() => undefined)
    const done = roadmap?.steps.filter(step => step.status === 'done').length ?? 0

    return { result: `ok ${done}/${roadmap?.steps.length ?? 0}` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Markdown } = $.ui.resolve(e)
    const roadmap = await read($, plan)
    const open = await read($, expanded)

    if (roadmap === null) {
      return (
        <Box flexDirection="column">
          <Text weight="semibold">{words.empty}</Text>
          <Text dimColor>{words.hint}</Text>
        </Box>
      )
    }

    const percent = progress(roadmap.steps)
    const width = Math.max(8, Math.min(24, e.props.bodyColumns - 8))
    const done = roadmap.steps.filter(step => step.status === 'done').length

    return (
      <Box flexDirection="column">
        <Text weight="bold" size="heading">{roadmap.title}</Text>
        <Box>
          <Text color="success">{bar(percent, width)}</Text>
          <Text tabular> {percent}%</Text>
          <Text dimColor> · {done}/{roadmap.steps.length} {words.steps}</Text>
        </Box>
        {roadmap.steps.map((step, index) => {
          const isOpen = open.includes(step.id)
          const toggle = () =>
            update($, expanded, ids =>
              ids.includes(step.id) ? ids.filter(id => id !== step.id) : [...ids, step.id],
            )

          return (
            <Box key={`row-${step.id}`} flexDirection="column" marginTop={1}>
              <Button key={`step-${step.id}`} plain onPress={toggle}>
                <Text color={COLOR[step.status]}>{ICON[step.status]}</Text>{' '}
                <Text weight={step.status === 'doing' ? 'semibold' : 'regular'} dimColor={step.status === 'skip'}>
                  {index + 1}. {step.title}
                </Text>{' '}
                <Text dimColor>{isOpen ? '▾' : '▸'}</Text>
              </Button>
              {step.inputs.length > 0 && (
                <Text dimColor>   ← {words.input}: {step.inputs.join(' · ')}</Text>
              )}
              {step.outputs.length > 0 && (
                <Text dimColor>   → {words.output}: {step.outputs.join(' · ')}</Text>
              )}
              {isOpen && (
                <Box paddingLeft={3} flexDirection="column">
                  <Markdown text={step.details ?? words.noDetails} />
                </Box>
              )}
            </Box>
          )
        })}
      </Box>
    )
  })
}
