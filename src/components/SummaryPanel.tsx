import { formatCurrency } from '../lib/deposits'

type SummaryPanelProps = {
  count: number
  totalAmountRub: number
  totalIncomeRub: number
  soonCount: number
}

function SummaryIcon({ type }: { type: 'portfolio' | 'money' | 'income' | 'clock' }) {
  if (type === 'portfolio') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2h2.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M10 6h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M17.5 12.5h3v2h-3a1 1 0 0 1 0-2z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }

  if (type === 'money') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <ellipse cx="8" cy="6.5" rx="4" ry="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M4 6.5v7c0 1.4 1.8 2.5 4 2.5s4-1.1 4-2.5v-7" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 10c.6-.3 1.4-.5 2.2-.5 2.1 0 3.8 1 3.8 2.3v4.4c0 1.3-1.7 2.3-3.8 2.3-1 0-1.9-.2-2.5-.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }

  if (type === 'income') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 18.5h15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M7 18V11.5M12 18V7.5M17 18V4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M4.5 18.5V14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5v5l3 1.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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
          <div>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        </div>
      ))}
    </section>
  )
}
