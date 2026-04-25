import {
  calculateExpectedIncomeRub,
  createDemoDeposits,
  getClosestClosingDeposits,
  getDepositStatus,
  getDaysUntilClose,
  hydrateDeposit,
} from './deposits'

describe('deposit helpers', () => {
  it('calculates expected income by amount, rate and term', () => {
    expect(calculateExpectedIncomeRub(100_000, 18, '2026-01-01', '2026-04-01')).toBe(4438.36)
  })

  it('returns statuses on exact boundaries', () => {
    const today = new Date('2026-04-23T10:00:00')

    expect(getDepositStatus('2026-05-23', today)).toBe('urgent')
    expect(getDepositStatus('2026-07-22', today)).toBe('warning')
    expect(getDepositStatus('2026-04-22', today)).toBe('closed')
    expect(getDepositStatus('2026-07-23', today)).toBe('safe')
  })

  it('counts days to close from calendar day start', () => {
    const today = new Date('2026-04-23T23:59:00')

    expect(getDaysUntilClose('2026-04-24', today)).toBe(1)
  })

  it('returns only five closest active deposits for the timeline', () => {
    const today = new Date('2026-04-23T10:00:00')
    const deposits = [
      '2026-04-28',
      '2026-05-10',
      '2026-05-22',
      '2026-06-12',
      '2026-07-05',
      '2026-08-10',
      '2026-04-20',
    ].map((closeDate, index) =>
      hydrateDeposit(
        {
          id: String(index),
          bankName: `Банк ${index + 1}`,
          ratePercent: 10,
          openDate: '2026-01-01',
          closeDate,
          amountRub: 100_000,
          expectedIncomeRub: 0,
          status: 'safe',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        today,
      ),
    )

    expect(getClosestClosingDeposits(deposits).map((deposit) => deposit.closeDate)).toEqual([
      '2026-04-28',
      '2026-05-10',
      '2026-05-22',
      '2026-06-12',
      '2026-07-05',
    ])
  })

  it('keeps demo data small and covers urgent and safe statuses', () => {
    const today = new Date('2026-04-23T10:00:00')
    const demoDeposits = createDemoDeposits(today)

    expect(demoDeposits).toHaveLength(2)
    expect(demoDeposits.map((deposit) => deposit.status)).toEqual(['urgent', 'safe'])
  })
})
