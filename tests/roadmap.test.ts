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

test('one call per finished step: the next step starts by itself', async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const set = await $.tool.call({
      tool: TOOL,
      title: 'Añadir login',
      steps: [
        { id: '1', t: 'Leer el código', in: ['src/'], out: ['mapa de auth'] },
        { id: '2', t: 'Escribir el formulario', in: ['mapa de auth'] },
        { id: '3', t: 'Probarlo' },
        { id: '4', t: 'Documentarlo' },
      ],
    })
    expect(String(set.result)).toBe('ok 0/4')

    const ui = await $.ui.mount({ plugin: 'roadmap', surface, ...PANE })
    expect(await ui.find({ type: 'Text', text: '0%' })).toBeDefined()

    const moved = await $.tool.call({
      tool: TOOL,
      steps: [
        { id: '1', s: 'done' },
        { id: '2', s: 'done', out: ['LoginForm.tsx'], d: 'Creé **LoginForm.tsx**.' },
      ],
    })
    expect(String(moved.result)).toBe('ok 2/4')
    expect(await ui.find({ type: 'Text', text: '50%' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Entrada: src\// })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Salida: LoginForm\.tsx/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '◐' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown' })).toBeUndefined()

    await ui.press({ key: 'step-2' })
    expect(await ui.find({ type: 'Markdown', text: /LoginForm/ })).toBeDefined()
    await ui.press({ key: 'step-2' })
    expect(await ui.find({ type: 'Markdown' })).toBeUndefined()
    await ui.unmount()
  }
})

test('an empty session shows a hint', async $ => {
  const ui = await $.ui.mount({ plugin: 'roadmap', surface: 'desktop', ...PANE })
  expect(await ui.find({ type: 'Text', text: /Sin tarea/ })).toBeDefined()
  await ui.unmount()
})
