import { formatCurrency } from '../lib/deposits'

type SummaryPanelProps = {
  count: number
  totalAmountRub: number
  totalIncomeRub: number
  warningCount: number
  criticalCount: number
}

export function SummaryPanel({
  count,
  totalAmountRub,
  totalIncomeRub,
  warningCount,
  criticalCount,
}: SummaryPanelProps) {
  return (
    <section className="summary-panel" aria-label="Сводка по активным вкладам">
      <div className="summary-panel__card">
        <span>Активные вклады</span>
        <strong>{count}</strong>
      </div>
      <div className="summary-panel__card">
        <span>Общая сумма</span>
        <strong>{formatCurrency(totalAmountRub)}</strong>
      </div>
      <div className="summary-panel__card">
        <span>Ожидаемый доход</span>
        <strong>{formatCurrency(totalIncomeRub)}</strong>
      </div>
      <div className="summary-panel__card summary-panel__card--signal">
        <span>Скоро закрываются</span>
        <strong>
          {warningCount} / {criticalCount}
        </strong>
        <small>предупреждение / критично</small>
      </div>
    </section>
  )
}
