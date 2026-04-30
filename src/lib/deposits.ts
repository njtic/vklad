import type { Deposit, DepositDraft, DepositStatus } from '../types'

const DAY_MS = 86_400_000
const shortDateFormatter = new Intl.DateTimeFormat('ru-RU')
const longDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const timelineDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
})

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

  if (daysUntilClose <= 30) {
    return 'urgent'
  }

  if (daysUntilClose <= 90) {
    return 'warning'
  }

  return 'safe'
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

      if (deposit.status === 'urgent') {
        acc.soonCount += 1
      }

      return acc
    },
    {
      count: 0,
      totalAmountRub: 0,
      totalIncomeRub: 0,
      soonCount: 0,
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
    case 'urgent':
      return 'До 30 дней'
    case 'warning':
      return '31-90 дней'
    case 'closed':
      return 'Закрыт'
    default:
      return '90+ дней'
  }
}

export function getStatusTone(status: DepositStatus) {
  switch (status) {
    case 'urgent':
      return 'status-urgent'
    case 'warning':
      return 'status-warning'
    case 'closed':
      return 'status-closed'
    default:
      return 'status-safe'
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

  return `Закрывается через ${formatDaysLabel(daysUntilClose)}`
}

export function createDemoDeposits(today = new Date()): Deposit[] {
  const base = startOfDay(today)
  const drafts: DepositDraft[] = [
    {
      bankName: 'Банк Скоро',
      ratePercent: '13.8',
      openDate: formatDateInput(shiftDays(base, -25)),
      closeDate: formatDateInput(shiftDays(base, 12)),
      amountRub: '264000',
    },
    {
      bankName: 'Банк Надолго',
      ratePercent: '17',
      openDate: formatDateInput(shiftDays(base, -60)),
      closeDate: formatDateInput(shiftDays(base, 122)),
      amountRub: '405000',
    },
  ]

  return drafts.map((draft) => createDepositFromDraft(draft, undefined, today))
}

export function formatShortDate(date: string) {
  return shortDateFormatter.format(new Date(`${date}T00:00:00`))
}

export function formatLongDate(date: string) {
  return longDateFormatter.format(new Date(`${date}T00:00:00`))
}

export function formatTimelineDate(date: string) {
  return timelineDateFormatter.format(new Date(`${date}T00:00:00`))
}

export function getClosestClosingDeposits(deposits: Deposit[], limit = 5) {
  return sortActiveDeposits(deposits.filter((deposit) => deposit.status !== 'closed')).slice(0, limit)
}

export function formatDaysLabel(value: number) {
  const abs = Math.abs(value)
  const mod10 = abs % 10
  const mod100 = abs % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${value} день`
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${value} дня`
  }

  return `${value} дней`
}

function safeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `deposit-${Math.random().toString(36).slice(2, 10)}`
}
