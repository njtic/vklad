import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { DepositCard } from './components/DepositCard'
import { DepositModal } from './components/DepositModal'
import { SummaryPanel } from './components/SummaryPanel'
import {
  buildSummary,
  createDepositFromDraft,
  getDepositStatus,
  hydrateDeposit,
  makeDraftFromDeposit,
  makeEmptyDraft,
  sortActiveDeposits,
  sortArchivedDeposits,
} from './lib/deposits'
import { loadDeposits, persistDeposits } from './lib/storage'
import type { Deposit, DepositDraft } from './types'

type ModalState =
  | { mode: 'create'; deposit: null }
  | { mode: 'edit'; deposit: Deposit }
  | null

function App() {
  const [deposits, setDeposits] = useState<Deposit[]>(() => loadDeposits())
  const [modalState, setModalState] = useState<ModalState>(null)
  const [draft, setDraft] = useState<DepositDraft>(makeEmptyDraft())
  const [error, setError] = useState('')
  const [archiveOpen, setArchiveOpen] = useState(false)

  useEffect(() => {
    persistDeposits(deposits)
  }, [deposits])

  const normalizedDeposits = deposits.map((deposit) => hydrateDeposit(deposit))
  const activeDeposits = sortActiveDeposits(
    normalizedDeposits.filter((deposit) => deposit.status !== 'closed'),
  )
  const archivedDeposits = sortArchivedDeposits(
    normalizedDeposits.filter((deposit) => deposit.status === 'closed'),
  )
  const summary = buildSummary(activeDeposits)

  function openCreateModal() {
    setModalState({ mode: 'create', deposit: null })
    setDraft(makeEmptyDraft())
    setError('')
  }

  function openEditModal(deposit: Deposit) {
    setModalState({ mode: 'edit', deposit })
    setDraft(makeDraftFromDeposit(deposit))
    setError('')
  }

  function closeModal() {
    setModalState(null)
    setError('')
  }

  function updateDraft(field: keyof DepositDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
    if (error) {
      setError('')
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = draft.bankName.trim()
    const amountRub = Number(draft.amountRub)
    const ratePercent = Number(draft.ratePercent)

    if (!trimmedName || !draft.openDate || !draft.closeDate || Number.isNaN(amountRub) || Number.isNaN(ratePercent)) {
      setError('Заполните все поля вклада.')
      return
    }

    if (amountRub <= 0 || ratePercent <= 0) {
      setError('Сумма и процент должны быть больше нуля.')
      return
    }

    if (draft.closeDate <= draft.openDate) {
      setError('Дата закрытия должна быть позже даты открытия.')
      return
    }

    const updatedDeposit = createDepositFromDraft(
      { ...draft, bankName: trimmedName },
      modalState?.mode === 'edit' ? modalState.deposit : undefined,
    )

    if (modalState?.mode === 'edit') {
      setDeposits((current) =>
        current.map((deposit) => (deposit.id === updatedDeposit.id ? updatedDeposit : deposit)),
      )
    } else {
      setDeposits((current) => [updatedDeposit, ...current])
    }

    closeModal()
  }

  function handleDelete(deposit: Deposit) {
    const confirmed = window.confirm(`Удалить вклад «${deposit.bankName}»?`)
    if (!confirmed) {
      return
    }

    setDeposits((current) => current.filter((item) => item.id !== deposit.id))
  }

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--top" />
      <div className="app-shell__glow app-shell__glow--bottom" />

      <main className="dashboard">
        <section className="hero">
          <div>
            <p className="hero__eyebrow">Локальный трекер вкладов</p>
            <h1>Все вклады на одном экране, с акцентом на сроки закрытия.</h1>
            <p className="hero__body">
              Карточки автоматически подсвечивают вклады, которым скоро нужен следующий шаг.
            </p>
          </div>

          <button type="button" className="primary-button" onClick={openCreateModal}>
            Добавить вклад
          </button>
        </section>

        <SummaryPanel {...summary} />

        <section className="section-header">
          <div>
            <p className="section-header__eyebrow">Активный портфель</p>
            <h2>Активные вклады</h2>
          </div>
          <p className="section-header__meta">
            Сортировка по ближайшей дате закрытия, чтобы срочные вклады были первыми.
          </p>
        </section>

        {activeDeposits.length ? (
          <section className="deposit-grid" data-testid="active-grid" aria-label="Активные вклады">
            {activeDeposits.map((deposit) => (
              <DepositCard
                key={deposit.id}
                deposit={deposit}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </section>
        ) : (
          <section className="empty-state">
            <h2>Активных вкладов пока нет</h2>
            <p>Добавьте первый вклад, и он сразу появится в обзорной сетке.</p>
          </section>
        )}

        <section className="archive-section">
          <button
            type="button"
            className="archive-toggle"
            onClick={() => setArchiveOpen((current) => !current)}
          >
            {archiveOpen ? 'Скрыть архив' : 'Показать архив'} ({archivedDeposits.length})
          </button>

          {archiveOpen ? (
            archivedDeposits.length ? (
              <div className="archive-grid" aria-label="Архив вкладов">
                {archivedDeposits.map((deposit) => (
                  <DepositCard
                    key={deposit.id}
                    deposit={{ ...deposit, status: getDepositStatus(deposit.closeDate) }}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <p className="archive-empty">Архив пока пуст.</p>
            )
          ) : null}
        </section>
      </main>

      {modalState ? (
        <DepositModal
          draft={draft}
          mode={modalState.mode}
          error={error}
          onChange={updateDraft}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  )
}

export default App
