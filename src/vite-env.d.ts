/// <reference types="vite/client" />

type VkladPersistedState = {
  hasSeededDemoData: boolean
  deposits: import('./types').Deposit[]
}

interface Window {
  vkladStorage?: {
    load: () => Promise<VkladPersistedState | null>
    save: (state: VkladPersistedState) => Promise<boolean>
  }
}
