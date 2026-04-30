import type { Deposit } from '../types'
import {
  formatCurrency,
  formatDaysLabel,
  formatTimelineDate,
  getDaysUntilClose,
  getStatusTone,
} from '../lib/deposits'

type ClosingTimelineProps = {
  deposits: Deposit[]
}

export function ClosingTimeline({ deposits }: ClosingTimelineProps) {
  if (!deposits.length) {
    return (
      <section className="timeline-card">
        <h2>Ближайшие закрытия</h2>
        <p className="timeline-card__empty">Активных вкладов пока нет.</p>
      </section>
    )
  }

  return (
    <section className="timeline-card">
      <h2>Ближайшие закрытия</h2>
      <div
        className="timeline"
        data-testid="closing-timeline"
        style={{ gridTemplateColumns: `repeat(${deposits.length}, minmax(0, 1fr))` }}
      >
        <div className="timeline__track" aria-hidden="true" />
        {deposits.map((deposit) => {
          const daysUntilClose = getDaysUntilClose(deposit.closeDate)

          return (
            <article key={deposit.id} className="timeline__item">
              <div className="timeline__summary">
                <div className={`timeline__circle ${getStatusTone(deposit.status)}`}>
                  <strong>{daysUntilClose}</strong>
                  <span>{formatDaysLabel(daysUntilClose).split(' ')[1]}</span>
                </div>
                <div className="timeline__copy">
                  <h3>{deposit.bankName}</h3>
                  <p>{formatCurrency(deposit.amountRub)}</p>
                </div>
              </div>
              <div className={`timeline__dot ${getStatusTone(deposit.status)}`} aria-hidden="true" />
              <time className="timeline__date" dateTime={deposit.closeDate}>
                {formatTimelineDate(deposit.closeDate)}
              </time>
            </article>
          )
        })}
      </div>
    </section>
  )
}
