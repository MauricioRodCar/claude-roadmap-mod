export type StepStatus = 'todo' | 'doing' | 'done' | 'blocked' | 'skip'

export type Step = {
  id: string
  title: string
  status: StepStatus
  inputs: string[]
  outputs: string[]
  details?: string
}

export type Roadmap = {
  title: string
  steps: Step[]
}

declare module 'claude-code' {
  interface PluginState {
    roadmap: { plan: Roadmap | null; expanded: string[] }
  }
}
