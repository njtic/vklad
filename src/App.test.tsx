import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'
import { STORAGE_KEY } from './lib/storage'

function persistState(deposits: Array<Record<string, unknown>>) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      hasSeededDemoData: true,
      deposits,
    }),
  )
}

function getStoredDeposits() {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-25T12:00:00'))
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders new dashboard summary, timeline and archive from stored deposits', () => {
    persistState([
      {
        id: '1',
        bankName: 'Сбер',
        ratePercent: 13.8,
        openDate: '2026-03-31',
        closeDate: '2026-05-01',
        amountRub: 264000,
        expectedIncomeRub: 0,
        status: 'safe',
        createdAt: '2026-03-31T00:00:00.000Z',
        updatedAt: '2026-03-31T00:00:00.000Z',
      },
      {
        id: '2',
        bankName: 'Озон ЦФА',
        ratePercent: 17,
        openDate: '2026-03-08',
        closeDate: '2026-05-23',
        amountRub: 120000,
        expectedIncomeRub: 0,
        status: 'safe',
        createdAt: '2026-03-08T00:00:00.000Z',
        updatedAt: '2026-03-08T00:00:00.000Z',
      },
      {
        id: '3',
        bankName: 'Финуслуги',
        ratePercent: 25,
        openDate: '2026-04-16',
        closeDate: '2026-06-09',
        amountRub: 350000,
        expectedIncomeRub: 0,
        status: 'safe',
        createdAt: '2026-04-16T00:00:00.000Z',
        updatedAt: '2026-04-16T00:00:00.000Z',
      },
      {
        id: '4',
        bankName: 'Т-Банк',
        ratePercent: 14,
        openDate: '2026-04-10',
        closeDate: '2026-07-30',
        amountRub: 350000,
        expectedIncomeRub: 0,
        status: 'safe',
        createdAt: '2026-04-10T00:00:00.000Z',
        updatedAt: '2026-04-10T00:00:00.000Z',
      },
      {
        id: '5',
        bankName: 'Альфа-Банк',
        ratePercent: 17.3,
        openDate: '2026-04-01',
        closeDate: '2026-08-08',
        amountRub: 500000,
        expectedIncomeRub: 0,
        status: 'safe',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
      {
        id: '6',
        bankName: 'ВТБ',
        ratePercent: 15.7,
        openDate: '2025-04-01',
        closeDate: '2026-04-20',
        amountRub: 420000,
        expectedIncomeRub: 0,
        status: 'safe',
        createdAt: '2025-04-01T00:00:00.000Z',
        updatedAt: '2025-04-01T00:00:00.000Z',
      },
    ])

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Календарь вкладов' })).toBeInTheDocument()
    const summary = screen.getByLabelText('Сводка по активным вкладам')
    expect(within(summary).getAllByText(/общая сумма|ожидаемый доход|вкладов|скоро закончатся/).map((node) => node.textContent)).toEqual([
      'общая сумма',
      'ожидаемый доход',
      'вкладов',
      'скоро закончатся',
    ])
    expect(within(summary).getByText('вкладов').previousSibling).toHaveTextContent('5')
    expect(within(summary).getByText('скоро закончатся').previousSibling).toHaveTextContent('2')

    const timeline = screen.getByTestId('closing-timeline')
    expect(within(timeline).getAllByRole('heading', { level: 3 }).map((node) => node.textContent)).toEqual([
      'Сбер',
      'Озон ЦФА',
      'Финуслуги',
      'Т-Банк',
      'Альфа-Банк',
    ])

    const calendar = screen.getByLabelText('Календарь закрытий вкладов')
    expect(within(calendar).getByText(/апрель 2026/i)).toBeInTheDocument()
    const vtbDay = within(calendar).getByRole('button', { name: /ВТБ/ })
    expect(vtbDay).toHaveTextContent('20')
    expect(within(vtbDay).getByText('ВТБ')).toBeInTheDocument()
    expect(within(vtbDay).getByText('420 000 ₽')).toBeInTheDocument()
    fireEvent.click(vtbDay)
    expect(vtbDay).toHaveClass('calendar-day--active')
    fireEvent.click(screen.getByRole('heading', { name: 'Календарь вкладов' }))
    expect(vtbDay).not.toHaveClass('calendar-day--active')
    fireEvent.click(within(calendar).getByRole('button', { name: 'Следующий месяц' }))
    expect(within(calendar).getByText(/май 2026/i)).toBeInTheDocument()
    expect(within(calendar).getByRole('button', { name: /Сбер/ })).toHaveTextContent('1')

    const activeGrid = screen.getByTestId('active-grid')
    expect(within(activeGrid).getAllByRole('heading', { level: 3 }).map((node) => node.textContent)).toEqual([
      'Сбер',
      'Озон ЦФА',
      'Финуслуги',
      'Т-Банк',
      'Альфа-Банк',
    ])
    expect(within(activeGrid).getByTestId('add-deposit-tile')).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: 'Открыть вклад ВТБ' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Архивные вклады/i }))
    expect(screen.getByRole('button', { name: 'Открыть вклад ВТБ' })).toBeInTheDocument()
  })

  it('supports create, edit and delete with modal interactions and localStorage persistence', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Добавить вклад' }))

    fireEvent.change(screen.getByLabelText('Название банка'), { target: { value: 'Газпромбанк' } })
    fireEvent.change(screen.getByLabelText('Процент, %'), { target: { value: '19.2' } })
    fireEvent.change(screen.getByLabelText('Дата открытия'), { target: { value: '2026-04-01' } })
    fireEvent.change(screen.getByLabelText('Дата закрытия'), { target: { value: '2026-09-01' } })
    fireEvent.change(screen.getByLabelText('Сумма вклада, ₽'), { target: { value: '800000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить вклад' }))

    const activeGrid = screen.getByTestId('active-grid')
    const createdCard = within(activeGrid).getByRole('heading', { name: 'Газпромбанк' }).closest('button')
    expect(createdCard).not.toBeNull()
    fireEvent.click(createdCard!)

    const bankNameInput = screen.getByLabelText('Название банка')
    fireEvent.change(bankNameInput, { target: { value: 'Газпромбанк Премиум' } })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }))

    expect(within(activeGrid).getByRole('heading', { name: 'Газпромбанк Премиум' })).toBeInTheDocument()

    const editedCard = within(activeGrid).getByRole('heading', { name: 'Газпромбанк Премиум' }).closest('button')
    expect(editedCard).not.toBeNull()
    fireEvent.click(editedCard!)
    fireEvent.click(screen.getByRole('button', { name: 'Удалить вклад' }))

    expect(within(activeGrid).queryByRole('heading', { name: 'Газпромбанк Премиум' })).not.toBeInTheDocument()

    const stored = getStoredDeposits()
    expect(stored.hasSeededDemoData).toBe(true)
    expect(
      stored.deposits.some((deposit: { bankName: string }) => deposit.bankName === 'Газпромбанк Премиум'),
    ).toBe(false)
  })

  it('opens create modal from the add tile', () => {
    render(<App />)

    fireEvent.click(screen.getByTestId('add-deposit-tile'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Добавить вклад' })).toBeInTheDocument()
  })

  it('keeps the modal open when clicking outside it', () => {
    const { container } = render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Добавить вклад' }))
    fireEvent.click(container.querySelector('.modal-backdrop')!)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not inject demo data when seeded state already exists', () => {
    persistState([
      {
        id: 'custom',
        bankName: 'Мой Банк',
        ratePercent: 14,
        openDate: '2026-01-01',
        closeDate: '2026-12-01',
        amountRub: 100000,
        expectedIncomeRub: 0,
        status: 'safe',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ])

    render(<App />)

    const activeGrid = screen.getByTestId('active-grid')
    expect(within(activeGrid).getByRole('heading', { name: 'Мой Банк' })).toBeInTheDocument()
    expect(within(activeGrid).queryByRole('heading', { name: 'Сбер' })).not.toBeInTheDocument()
  })
})
