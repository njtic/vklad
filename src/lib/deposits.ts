import type { Deposit, DepositDraft, DepositStatus } from '../types'

const DAY_MS = 86_400_000

function startOfDay(input: string | Date) {
  const date = typeof input === 'string' ? new Date(`${input}T00:00:00`) : input
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function shiftDays(base: Date, days: number) {
  return new Date(base.getTime() + days * DAY_MS)
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export function calculateDepositTermDays(openDate: string, closeDate: string) {
  const diff = startOfDay(closeDate).getTime() - startOfDay(openDate).getTime()
  return Math.max(0, Math.round(diff / DAY_MS))
}

export function calculateExpectedIncomeRub(
  amountRub: number,
  ratePercent: number,
  openDate: string,
  closeDate: string,
) {
  const days = calculateDepositTermDays(openDate, closeDate)
  return roundMoney(amountRub * (ratePercent / 100) * (days / 365))
}

export function getDaysUntilClose(closeDate: string, today = new Date()) {
  const diff = startOfDay(closeDate).getTime() - startOfDay(today).getTime()
  return Math.round(diff / DAY_MS)
}

export function getDepositStatus(closeDate: string, today = new Date()): DepositStatus {
  const daysUntilClose = getDaysUntilClose(closeDate, today)

  if (daysUntilClose < 0) {
    return 'closed'
  }

  if (daysUntilClose <= 7) {
    return 'critical'
  }

  if (daysUntilClose <= 30) {
    return 'warning'
  }

  return 'normal'
}

export function hydrateDeposit(deposit: Deposit, today = new Date()): Deposit {
  return {
    ...deposit,
    expectedIncomeRub: calculateExpectedIncomeRub(
      deposit.amountRub,
      deposit.ratePercent,
      deposit.openDate,
      deposit.closeDate,
    ),
    status: getDepositStatus(deposit.closeDate, today),
  }
}

export function createDepositFromDraft(
  draft: DepositDraft,
  existing?: Deposit,
  today = new Date(),
): Deposit {
  const nowIso = new Date().toISOString()
  const amountRub = Number(draft.amountRub)
  const ratePercent = Number(draft.ratePercent)
  const closeDate = draft.closeDate
  const openDate = draft.openDate

  const deposit: Deposit = {
    id: existing?.id ?? safeId(),
    bankName: draft.bankName.trim(),
    ratePercent,
    openDate,
    closeDate,
    amountRub,
    expectedIncomeRub: calculateExpectedIncomeRub(amountRub, ratePercent, openDate, closeDate),
    status: getDepositStatus(closeDate, today),
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
  }

  return deposit
}

export function sortActiveDeposits(deposits: Deposit[]) {
  return [...deposits].sort((a, b) => {
    const byCloseDate = a.closeDate.localeCompare(b.closeDate)
    if (byCloseDate !== 0) {
      return byCloseDate
    }
    return a.bankName.localeCompare(b.bankName, 'ru')
  })
}

export function sortArchivedDeposits(deposits: Deposit[]) {
  return [...deposits].sort((a, b) => {
    const byCloseDate = b.closeDate.localeCompare(a.closeDate)
    if (byCloseDate !== 0) {
      return byCloseDate
    }
    return a.bankName.localeCompare(b.bankName, 'ru')
  })
}

export function buildSummary(deposits: Deposit[]) {
  return deposits.reduce(
    (acc, deposit) => {
      acc.count += 1
      acc.totalAmountRub += deposit.amountRub
      acc.totalIncomeRub += deposit.expectedIncomeRub

      if (deposit.status === 'warning') {
        acc.warningCount += 1
      }

      if (deposit.status === 'critical') {
        acc.criticalCount += 1
      }

      return acc
    },
    {
      count: 0,
      totalAmountRub: 0,
      totalIncomeRub: 0,
      warningCount: 0,
      criticalCount: 0,
    },
  )
}

export function makeEmptyDraft(): DepositDraft {
  return {
    bankName: '',
    ratePercent: '',
    openDate: '',
    closeDate: '',
    amountRub: '',
  }
}

export function makeDraftFromDeposit(deposit: Deposit): DepositDraft {
  return {
    bankName: deposit.bankName,
    ratePercent: String(deposit.ratePercent),
    openDate: deposit.openDate,
    closeDate: deposit.closeDate,
    amountRub: String(deposit.amountRub),
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  }).format(value)
}

export function getStatusLabel(status: DepositStatus) {
  switch (status) {
    case 'critical':
      return 'Закрывается скоро'
    case 'warning':
      return 'Срок подходит'
    case 'closed':
      return 'Закрыт'
    default:
      return 'Активен'
  }
}

export function getStatusTone(status: DepositStatus) {
  switch (status) {
    case 'critical':
      return 'status-critical'
    case 'warning':
      return 'status-warning'
    case 'closed':
      return 'status-closed'
    default:
      return 'status-normal'
  }
}

export function getStatusMessage(closeDate: string, today = new Date()) {
  const daysUntilClose = getDaysUntilClose(closeDate, today)

  if (daysUntilClose < 0) {
    return 'Срок истёк'
  }

  if (daysUntilClose === 0) {
    return 'Закрывается сегодня'
  }

  if (daysUntilClose === 1) {
    return 'Закрывается через 1 день'
  }

  return `Закрывается через ${daysUntilClose} дн.`
}

export function createDemoDeposits(today = new Date()): Deposit[] {
  const base = startOfDay(today)
  const drafts: DepositDraft[] = [
    {
      bankName: 'Т-Банк',
      ratePercent: '17.4',
      openDate: formatDateInput(shiftDays(base, -25)),
      closeDate: formatDateInput(shiftDays(base, 120)),
      amountRub: '500000',
    },
    {
      bankName: 'Альфа-Банк',
      ratePercent: '18.2',
      openDate: formatDateInput(shiftDays(base, -130)),
      closeDate: formatDateInput(shiftDays(base, 21)),
      amountRub: '350000',
    },
    {
      bankName: 'Сбер',
      ratePercent: '16.9',
      openDate: formatDateInput(shiftDays(base, -300)),
      closeDate: formatDateInput(shiftDays(base, 5)),
      amountRub: '900000',
    },
    {
      bankName: 'ВТБ',
      ratePercent: '15.7',
      openDate: formatDateInput(shiftDays(base, -420)),
      closeDate: formatDateInput(shiftDays(base, -14)),
      amountRub: '420000',
    },
  ]

  return drafts.map((draft) => createDepositFromDraft(draft, undefined, today))
}

function safeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `deposit-${Math.random().toString(36).slice(2, 10)}`
}
