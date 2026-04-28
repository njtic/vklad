import type { Deposit } from '../types'
import { createDemoDeposits, hydrateDeposit } from './deposits'

export const STORAGE_KEY = 'vklad-tracker'

type PersistedState = {
  hasSeededDemoData: boolean
  deposits: Deposit[]
}

export function hasDesktopStorage() {
  return typeof window !== 'undefined' && typeof window.vkladStorage !== 'undefined'
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') {
    return false
  }

  const state = value as PersistedState
  return Array.isArray(state.deposits) && typeof state.hasSeededDemoData === 'boolean'
}

function parseState(raw: string | null): PersistedState | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    return isPersistedState(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function loadDeposits(today = new Date()) {
  if (hasDesktopStorage()) {
    return []
  }

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
  void persistState({ hasSeededDemoData: true, deposits })
}

export async function loadRuntimeDeposits(today = new Date()) {
  if (!hasDesktopStorage()) {
    return loadDeposits(today)
  }

  const state = await window.vkladStorage?.load()

  if (!isPersistedState(state) || !state.hasSeededDemoData) {
    const seeded = createDemoDeposits(today)
    await persistState({ hasSeededDemoData: true, deposits: seeded })
    return seeded
  }

  return state.deposits.map((deposit) => hydrateDeposit(deposit, today))
}

async function persistState(state: PersistedState) {
  if (hasDesktopStorage()) {
    await window.vkladStorage?.save(state)
    return
  }

  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
