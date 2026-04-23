import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { STORAGE_KEY } from './lib/storage'

function getStoredDeposits() {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders active deposits sorted by close date and moves closed deposits to archive', async () => {
    render(<App />)

    const activeGrid = screen.getByTestId('active-grid')
    const headings = within(activeGrid).getAllByRole('heading', { level: 3 })
    expect(headings.map((node) => node.textContent)).toEqual(['Сбер', 'Альфа-Банк', 'Т-Банк'])

    expect(screen.queryByText('ВТБ')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Показать архив \(1\)/ }))

    expect(screen.getByRole('heading', { name: 'ВТБ' })).toBeInTheDocument()
  })

  it('supports create, edit and delete with localStorage persistence', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Добавить вклад' }))

    await user.type(screen.getByLabelText('Название банка'), 'Газпромбанк')
    await user.type(screen.getByLabelText('Процент, %'), '19.2')
    await user.type(screen.getByLabelText('Дата открытия'), '2026-04-01')
    await user.type(screen.getByLabelText('Дата закрытия'), '2026-09-01')
    await user.type(screen.getByLabelText('Сумма вклада, ₽'), '800000')
    await user.click(screen.getByRole('button', { name: 'Сохранить вклад' }))

    expect(screen.getByRole('heading', { name: 'Газпромбанк' })).toBeInTheDocument()

    const createdCard = screen.getByRole('heading', { name: 'Газпромбанк' }).closest('article')
    expect(createdCard).not.toBeNull()
    await user.click(within(createdCard!).getByRole('button', { name: 'Редактировать' }))

    const bankNameInput = screen.getByLabelText('Название банка')
    await user.clear(bankNameInput)
    await user.type(bankNameInput, 'Газпромбанк Премиум')
    await user.click(screen.getByRole('button', { name: 'Сохранить изменения' }))

    expect(screen.getByRole('heading', { name: 'Газпромбанк Премиум' })).toBeInTheDocument()

    const editedCard = screen.getByRole('heading', { name: 'Газпромбанк Премиум' }).closest('article')
    expect(editedCard).not.toBeNull()
    await user.click(within(editedCard!).getByRole('button', { name: 'Удалить' }))

    expect(screen.queryByRole('heading', { name: 'Газпромбанк Премиум' })).not.toBeInTheDocument()

    const stored = getStoredDeposits()
    expect(stored.hasSeededDemoData).toBe(true)
    expect(stored.deposits.some((deposit: { bankName: string }) => deposit.bankName === 'Газпромбанк Премиум')).toBe(false)
  })

  it('does not inject demo data when seeded state already exists', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        hasSeededDemoData: true,
        deposits: [
          {
            id: 'custom',
            bankName: 'Мой Банк',
            ratePercent: 14,
            openDate: '2026-01-01',
            closeDate: '2026-12-01',
            amountRub: 100000,
            expectedIncomeRub: 0,
            status: 'normal',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    )

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Мой Банк' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Т-Банк' })).not.toBeInTheDocument()
  })
})
