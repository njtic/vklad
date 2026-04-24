import type { Deposit } from '../types'
import {
  formatCurrency,
  formatPercent,
  formatShortDate,
  getStatusTone,
} from '../lib/deposits'

type DepositCardProps = {
  deposit: Deposit
  onOpen: (deposit: Deposit) => void
}

export function DepositCard({ deposit, onOpen }: DepositCardProps) {
  const statusTone = getStatusTone(deposit.status)

  return (
    <button
      type="button"
      className={`deposit-card ${statusTone}`}
      onClick={() => onOpen(deposit)}
      aria-label={`Открыть вклад ${deposit.bankName}`}
    >
      <div className="deposit-card__topline">
        <h3>{deposit.bankName}</h3>
        <span className={`deposit-card__dot ${statusTone}`} aria-hidden="true" />
      </div>

      <div className="deposit-card__amount">
        <span>Сумма вклада</span>
        <strong>{formatCurrency(deposit.amountRub)}</strong>
      </div>

      <dl className="deposit-card__details">
        <div>
          <dt>Ставка</dt>
          <dd>{formatPercent(deposit.ratePercent)}%</dd>
        </div>
        <div>
          <dt>Ожидаемый доход</dt>
          <dd>{formatCurrency(deposit.expectedIncomeRub)}</dd>
        </div>
      </dl>

      <dl className="deposit-card__dates">
        <div>
          <dt>Открыт</dt>
          <dd>{formatShortDate(deposit.openDate)}</dd>
        </div>
        <div>
          <dt>Закрытие</dt>
          <dd>{formatShortDate(deposit.closeDate)}</dd>
        </div>
      </dl>
    </button>
  )
}
