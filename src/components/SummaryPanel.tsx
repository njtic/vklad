import { BriefcaseBusiness, ChartColumnIncreasing, Clock3, Wallet } from 'lucide-react'
import { formatCurrency } from '../lib/deposits'

type SummaryPanelProps = {
  count: number
  totalAmountRub: number
  totalIncomeRub: number
  soonCount: number
}

function SummaryIcon({ type }: { type: 'portfolio' | 'money' | 'income' | 'clock' }) {
  if (type === 'portfolio') {
    return <BriefcaseBusiness aria-hidden="true" strokeWidth={1.9} />
  }

  if (type === 'money') {
    return <Wallet aria-hidden="true" strokeWidth={1.9} />
  }

  if (type === 'income') {
    return <ChartColumnIncreasing aria-hidden="true" strokeWidth={1.9} />
  }

  return <Clock3 aria-hidden="true" strokeWidth={1.9} />
}

export function SummaryPanel({ count, totalAmountRub, totalIncomeRub, soonCount }: SummaryPanelProps) {
  const metrics = [
    { icon: 'portfolio' as const, value: String(count), label: 'вкладов', tone: 'neutral' },
    { icon: 'money' as const, value: formatCurrency(totalAmountRub), label: 'общая сумма', tone: 'neutral' },
    { icon: 'income' as const, value: formatCurrency(totalIncomeRub), label: 'ожидаемый доход', tone: 'neutral' },
    { icon: 'clock' as const, value: String(soonCount), label: 'скоро закончатся', tone: 'alert' },
  ]

  return (
    <section className="summary-panel" aria-label="Сводка по активным вкладам">
      {metrics.map((metric) => (
        <div key={metric.label} className={`summary-panel__card summary-panel__card--${metric.tone}`}>
          <span className="summary-panel__icon">
            <SummaryIcon type={metric.icon} />
          </span>
          <div className="summary-panel__copy">
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        </div>
      ))}
    </section>
  )
}
