import { expect, test } from 'claude-code/testing'

const PANE = {
  component: 'Pane',
  requestId: 'roadmap',
  props: {
    title: 'Roadmap',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const TOOL = 'mcp__roadmap__track' as const

const LABELS = {
  en: { input: 'Input', output: 'Output', empty: /No task/, steps: '2/4 steps' },
  es: { input: 'Entrada', output: 'Salida', empty: /Sin tarea/, steps: '2/4 pasos' },
} as const

for (const language of ['en', 'es'] as const) {
  const words = LABELS[language]

  test(`${language}: one call per finished step, the next step starts by itself`, { options: { language } }, async $ => {
    for (const surface of ['terminal', 'desktop'] as const) {
      const set = await $.tool.call({
        tool: TOOL,
        title: 'Login',
        steps: [
          { id: '1', t: 'Read the code', in: ['src/'], out: ['auth map'] },
          { id: '2', t: 'Write the form', in: ['auth map'] },
          { id: '3', t: 'Test it' },
          { id: '4', t: 'Document it' },
        ],
      })
      expect(String(set.result)).toBe('ok 0/4')

      const ui = await $.ui.mount({ plugin: 'roadmap', surface, ...PANE })
      expect(await ui.find({ type: 'Text', text: '0%' })).toBeDefined()

      const moved = await $.tool.call({
        tool: TOOL,
        steps: [
          { id: '1', s: 'done' },
          { id: '2', s: 'done', out: ['LoginForm.tsx'], d: 'Wrote **LoginForm.tsx**.' },
        ],
      })
      expect(String(moved.result)).toBe('ok 2/4')
      expect(await ui.find({ type: 'Text', text: '50%' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: words.steps })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: new RegExp(`${words.input}: src/`) })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: new RegExp(`${words.output}: LoginForm\\.tsx`) })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '◐' })).toBeDefined()
      expect(await ui.find({ type: 'Markdown' })).toBeUndefined()

      await ui.press({ key: 'step-2' })
      expect(await ui.find({ type: 'Markdown', text: /LoginForm/ })).toBeDefined()
      await ui.press({ key: 'step-2' })
      expect(await ui.find({ type: 'Markdown' })).toBeUndefined()
      await ui.unmount()
    }
  })

  test(`${language}: an empty session shows a hint`, { options: { language } }, async $ => {
    const ui = await $.ui.mount({ plugin: 'roadmap', surface: 'desktop', ...PANE })
    expect(await ui.find({ type: 'Text', text: words.empty })).toBeDefined()
    await ui.unmount()
  })
}
