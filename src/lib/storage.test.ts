import { loadRuntimeDeposits } from './storage'

describe('runtime storage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-25T12:00:00'))
    window.localStorage.clear()
    Reflect.deleteProperty(window, 'vkladStorage')
  })

  afterEach(() => {
    vi.useRealTimers()
    Reflect.deleteProperty(window, 'vkladStorage')
  })

  it('seeds desktop JSON storage on first launch', async () => {
    const save = vi.fn().mockResolvedValue(true)
    window.vkladStorage = {
      load: vi.fn().mockResolvedValue(null),
      save,
    }

    const deposits = await loadRuntimeDeposits()

    expect(deposits).toHaveLength(2)
    expect(deposits.map((deposit) => deposit.bankName)).toEqual(['Банк Скоро', 'Банк Надолго'])
    expect(save).toHaveBeenCalledWith({
      hasSeededDemoData: true,
      deposits,
    })
    expect(window.localStorage.length).toBe(0)
  })

  it('loads existing desktop JSON storage without adding demo deposits', async () => {
    window.vkladStorage = {
      load: vi.fn().mockResolvedValue({
        hasSeededDemoData: true,
        deposits: [
          {
            id: 'custom',
            bankName: 'Личный банк',
            ratePercent: 14,
            openDate: '2026-01-01',
            closeDate: '2026-12-01',
            amountRub: 100000,
            expectedIncomeRub: 0,
            status: 'safe',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
      save: vi.fn().mockResolvedValue(true),
    }

    const deposits = await loadRuntimeDeposits()

    expect(deposits).toHaveLength(1)
    expect(deposits[0].bankName).toBe('Личный банк')
    expect(window.vkladStorage.save).not.toHaveBeenCalled()
    expect(window.localStorage.length).toBe(0)
  })
})
