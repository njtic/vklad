import type { Deposit } from '../types'
import {
  formatCurrency,
  formatPercent,
  getStatusLabel,
  getStatusMessage,
  getStatusTone,
} from '../lib/deposits'

type DepositCardProps = {
  deposit: Deposit
  onEdit: (deposit: Deposit) => void
  onDelete: (deposit: Deposit) => void
}

const labelMap = {
  bankName: 'Банк',
  ratePercent: 'Процент',
  openDate: 'Дата открытия',
  closeDate: 'Дата закрытия',
  amountRub: 'Сумма вклада',
  expectedIncomeRub: 'Ожидаемый доход',
}

export function DepositCard({ deposit, onEdit, onDelete }: DepositCardProps) {
  const statusTone = getStatusTone(deposit.status)

  return (
    <article className={`deposit-card ${statusTone}`}>
      <div className="deposit-card__topline">
        <span className="deposit-card__badge">{getStatusLabel(deposit.status)}</span>
        <span className="deposit-card__deadline">{getStatusMessage(deposit.closeDate)}</span>
      </div>

      <div className="deposit-card__header">
        <h3>{deposit.bankName}</h3>
        <p>{formatPercent(deposit.ratePercent)}% годовых</p>
      </div>

      <dl className="deposit-card__details">
        <div>
          <dt>{labelMap.bankName}</dt>
          <dd>{deposit.bankName}</dd>
        </div>
        <div>
          <dt>{labelMap.ratePercent}</dt>
          <dd>{formatPercent(deposit.ratePercent)}%</dd>
        </div>
        <div>
          <dt>{labelMap.openDate}</dt>
          <dd>{deposit.openDate}</dd>
        </div>
        <div>
          <dt>{labelMap.closeDate}</dt>
          <dd>{deposit.closeDate}</dd>
        </div>
        <div>
          <dt>{labelMap.amountRub}</dt>
          <dd>{formatCurrency(deposit.amountRub)}</dd>
        </div>
        <div>
          <dt>{labelMap.expectedIncomeRub}</dt>
          <dd>{formatCurrency(deposit.expectedIncomeRub)}</dd>
        </div>
      </dl>

      <div className="deposit-card__actions">
        <button type="button" className="secondary-button" onClick={() => onEdit(deposit)}>
          Редактировать
        </button>
        <button type="button" className="ghost-button" onClick={() => onDelete(deposit)}>
          Удалить
        </button>
      </div>
    </article>
  )
}
