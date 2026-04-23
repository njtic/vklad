import type { Deposit } from '../types'
import { createDemoDeposits, hydrateDeposit } from './deposits'

export const STORAGE_KEY = 'vklad-tracker'

type PersistedState = {
  hasSeededDemoData: boolean
  deposits: Deposit[]
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function parseState(raw: string | null): PersistedState | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as PersistedState
    if (!Array.isArray(parsed.deposits) || typeof parsed.hasSeededDemoData !== 'boolean') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function loadDeposits(today = new Date()) {
  if (!canUseStorage()) {
    return createDemoDeposits(today)
  }

  const state = parseState(window.localStorage.getItem(STORAGE_KEY))

  if (!state || !state.hasSeededDemoData) {
    const seeded = createDemoDeposits(today)
    persistState({ hasSeededDemoData: true, deposits: seeded })
    return seeded
  }

  return state.deposits.map((deposit) => hydrateDeposit(deposit, today))
}

export function persistDeposits(deposits: Deposit[]) {
  persistState({ hasSeededDemoData: true, deposits })
}

function persistState(state: PersistedState) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
