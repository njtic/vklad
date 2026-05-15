import { useEffect, useState } from 'react'
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

const COMPACT_TIMELINE_QUERY = '(max-width: 1180px)'

export function ClosingTimeline({ deposits }: ClosingTimelineProps) {
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }

    return window.matchMedia(COMPACT_TIMELINE_QUERY).matches
  })
  const visibleDeposits = deposits.slice(0, isCompact ? 3 : 5)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(COMPACT_TIMELINE_QUERY)
    const handleChange = () => setIsCompact(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

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
        style={{ gridTemplateColumns: `repeat(${visibleDeposits.length}, minmax(0, 1fr))` }}
      >
        <div className="timeline__track" aria-hidden="true" />
        {visibleDeposits.map((deposit) => {
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
