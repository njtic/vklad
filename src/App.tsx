import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { AddDepositTile } from './components/AddDepositTile'
import { ClosingTimeline } from './components/ClosingTimeline'
import { DepositCard } from './components/DepositCard'
import { DepositModal } from './components/DepositModal'
import { SummaryPanel } from './components/SummaryPanel'
import {
  buildSummary,
  createDepositFromDraft,
  getClosestClosingDeposits,
  getDepositStatus,
  hydrateDeposit,
  makeDraftFromDeposit,
  makeEmptyDraft,
  sortActiveDeposits,
  sortArchivedDeposits,
} from './lib/deposits'
import { hasDesktopStorage, loadDeposits, loadRuntimeDeposits, persistDeposits } from './lib/storage'
import type { Deposit, DepositDraft } from './types'

type ModalState =
  | { mode: 'create'; deposit: null }
  | { mode: 'edit'; deposit: Deposit }
  | null

function App() {
  const [deposits, setDeposits] = useState<Deposit[]>(() => loadDeposits())
  const [storageReady, setStorageReady] = useState(() => !hasDesktopStorage())
  const [modalState, setModalState] = useState<ModalState>(null)
  const [draft, setDraft] = useState<DepositDraft>(makeEmptyDraft())
  const [error, setError] = useState('')
  const [archiveOpen, setArchiveOpen] = useState(false)

  useEffect(() => {
    if (!hasDesktopStorage()) {
      return
    }

    let isMounted = true

    void loadRuntimeDeposits().then((loadedDeposits) => {
      if (!isMounted) {
        return
      }

      setDeposits(loadedDeposits)
      setStorageReady(true)
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!storageReady) {
      return
    }

    persistDeposits(deposits)
  }, [deposits, storageReady])

  const normalizedDeposits = deposits.map((deposit) => hydrateDeposit(deposit))
  const activeDeposits = sortActiveDeposits(
    normalizedDeposits.filter((deposit) => deposit.status !== 'closed'),
  )
  const archivedDeposits = sortArchivedDeposits(
    normalizedDeposits.filter((deposit) => deposit.status === 'closed'),
  )
  const closestClosingDeposits = getClosestClosingDeposits(activeDeposits)
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
    closeModal()
  }

  return (
    <div className="app-shell">
      <main className="dashboard">
        <header className="page-header">
          <h1>Календарь вкладов</h1>
          <button type="button" className="outline-button" onClick={openCreateModal} aria-label="Добавить вклад">
            <span aria-hidden="true">+</span>
            Добавить вклад
          </button>
        </header>

        <SummaryPanel {...summary} />

        <ClosingTimeline deposits={closestClosingDeposits} />

        <section className="content-card">
          <div className="section-header">
            <h2>Активные вклады</h2>
            <div className="legend" aria-label="Легенда сроков">
              <span><i className="legend__dot status-urgent" />До 30 дней</span>
              <span><i className="legend__dot status-warning" />30–90 дней</span>
              <span><i className="legend__dot status-safe" />90+ дней</span>
            </div>
          </div>

          {activeDeposits.length ? (
            <section className="deposit-grid" data-testid="active-grid" aria-label="Активные вклады">
              {activeDeposits.map((deposit) => (
                <DepositCard key={deposit.id} deposit={deposit} onOpen={openEditModal} />
              ))}
              <AddDepositTile onClick={openCreateModal} />
            </section>
          ) : (
            <section className="deposit-grid deposit-grid--empty" data-testid="active-grid">
              <AddDepositTile onClick={openCreateModal} />
            </section>
          )}
        </section>

        <section className="archive-section content-card">
          <button type="button" className="archive-toggle" onClick={() => setArchiveOpen((current) => !current)}>
            <span>Архивные вклады</span>
            <span className={`archive-toggle__chevron ${archiveOpen ? 'archive-toggle__chevron--open' : ''}`}>⌄</span>
          </button>
          {archiveOpen ? (
            archivedDeposits.length ? (
              <div className="archive-grid" aria-label="Архив вкладов">
                {archivedDeposits.map((deposit) => (
                  <DepositCard
                    key={deposit.id}
                    deposit={{ ...deposit, status: getDepositStatus(deposit.closeDate) }}
                    onOpen={openEditModal}
                  />
                ))}
              </div>
            ) : (
              <p className="archive-empty">Архив пока пуст.</p>
            )
          ) : null}
        </section>

        <footer className="privacy-note">
          <span className="privacy-note__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3l7 3v5c0 5-3.2 8.8-7 10-3.8-1.2-7-5-7-10V6z" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <path d="M9.5 12l1.6 1.6L14.8 10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p>Данные хранятся только на вашем устройстве и никуда не передаются.</p>
        </footer>
      </main>

      {modalState ? (
        <DepositModal
          draft={draft}
          mode={modalState.mode}
          error={error}
          onChange={updateDraft}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onDelete={modalState.mode === 'edit' ? () => handleDelete(modalState.deposit) : undefined}
        />
      ) : null}
    </div>
  )
}

export default App
