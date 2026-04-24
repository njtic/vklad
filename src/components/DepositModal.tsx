import type { FormEvent } from 'react'
import type { DepositDraft } from '../types'
import { calculateExpectedIncomeRub, formatCurrency } from '../lib/deposits'

type DepositModalProps = {
  draft: DepositDraft
  mode: 'create' | 'edit'
  error: string
  onChange: (field: keyof DepositDraft, value: string) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onDelete?: () => void
}

export function DepositModal({
  draft,
  mode,
  error,
  onChange,
  onClose,
  onSubmit,
  onDelete,
}: DepositModalProps) {
  const expectedIncome =
    draft.amountRub && draft.ratePercent && draft.openDate && draft.closeDate
      ? calculateExpectedIncomeRub(
          Number(draft.amountRub),
          Number(draft.ratePercent),
          draft.openDate,
          draft.closeDate,
        )
      : 0

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deposit-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <div>
            <p className="modal__eyebrow">Вклад</p>
            <h2 id="deposit-modal-title">
              {mode === 'create' ? 'Добавить вклад' : 'Редактировать вклад'}
            </h2>
          </div>
          <button type="button" className="icon-button" aria-label="Закрыть форму" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="deposit-form" onSubmit={onSubmit}>
          <label>
            <span>Название банка</span>
            <input
              autoFocus
              value={draft.bankName}
              onChange={(event) => onChange('bankName', event.target.value)}
              placeholder="Например, Т-Банк"
              required
            />
          </label>

          <label>
            <span>Процент, %</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={draft.ratePercent}
              onChange={(event) => onChange('ratePercent', event.target.value)}
              placeholder="16.5"
              required
            />
          </label>

          <div className="deposit-form__row">
            <label>
              <span>Дата открытия</span>
              <input
                type="date"
                value={draft.openDate}
                onChange={(event) => onChange('openDate', event.target.value)}
                required
              />
            </label>

            <label>
              <span>Дата закрытия</span>
              <input
                type="date"
                value={draft.closeDate}
                onChange={(event) => onChange('closeDate', event.target.value)}
                required
              />
            </label>
          </div>

          <label>
            <span>Сумма вклада, ₽</span>
            <input
              type="number"
              min="0"
              step="1000"
              value={draft.amountRub}
              onChange={(event) => onChange('amountRub', event.target.value)}
              placeholder="500000"
              required
            />
          </label>

          <div className="income-preview">
            <span>Ожидаемый доход</span>
            <strong>{formatCurrency(expectedIncome)}</strong>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="modal__actions">
            <div className="modal__actions-group">
              {mode === 'edit' && onDelete ? (
                <button type="button" className="danger-button" onClick={onDelete}>
                  Удалить вклад
                </button>
              ) : null}
            </div>
            <div className="modal__actions-group">
              <button type="button" className="ghost-button" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="primary-button">
                {mode === 'create' ? 'Сохранить вклад' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
