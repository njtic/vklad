import {
  calculateExpectedIncomeRub,
  getDepositStatus,
  getDaysUntilClose,
} from './deposits'

describe('deposit helpers', () => {
  it('calculates expected income by amount, rate and term', () => {
    expect(calculateExpectedIncomeRub(100_000, 18, '2026-01-01', '2026-04-01')).toBe(4438.36)
  })

  it('returns warning and critical states on exact boundaries', () => {
    const today = new Date('2026-04-23T10:00:00')

    expect(getDepositStatus('2026-05-23', today)).toBe('warning')
    expect(getDepositStatus('2026-04-30', today)).toBe('critical')
    expect(getDepositStatus('2026-04-22', today)).toBe('closed')
    expect(getDepositStatus('2026-06-10', today)).toBe('normal')
  })

  it('counts days to close from calendar day start', () => {
    const today = new Date('2026-04-23T23:59:00')

    expect(getDaysUntilClose('2026-04-24', today)).toBe(1)
  })
})
