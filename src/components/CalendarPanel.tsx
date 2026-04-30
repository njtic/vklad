import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Deposit } from '../types'
import { formatCurrency, getStatusTone } from '../lib/deposits'

type CalendarPanelProps = {
  deposits: Deposit[]
}

type CalendarDay = {
  date: Date
  iso: string
  day: number
  isCurrentMonth: boolean
}

const monthFormatter = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
})

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function buildCalendarDays(monthDate: Date): CalendarDay[] {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)

    return {
      date,
      iso: toIsoDate(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
    }
  })
}

function shiftMonth(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

export function CalendarPanel({ deposits }: CalendarPanelProps) {
  const calendarRef = useRef<HTMLElement | null>(null)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [activeTooltipDate, setActiveTooltipDate] = useState<string | null>(null)

  useEffect(() => {
    if (!activeTooltipDate) {
      return
    }

    function handleDocumentClick(event: MouseEvent) {
      if (
        calendarRef.current?.contains(event.target as Node) &&
        (event.target as Element).closest('.calendar-day--marked')
      ) {
        return
      }

      setActiveTooltipDate(null)
    }

    document.addEventListener('click', handleDocumentClick)

    return () => {
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [activeTooltipDate])

  const closingByDate = deposits.reduce<Record<string, Deposit[]>>((acc, deposit) => {
    acc[deposit.closeDate] = [...(acc[deposit.closeDate] ?? []), deposit]
    return acc
  }, {})
  const days = buildCalendarDays(visibleMonth)

  return (
    <section ref={calendarRef} className="calendar-card" aria-label="Календарь закрытий вкладов">
      <div className="calendar-card__header">
        <h2>Календарь</h2>
        <div className="calendar-card__controls">
          <button
            type="button"
            className="calendar-card__nav"
            aria-label="Предыдущий месяц"
            onClick={() => setVisibleMonth((current) => shiftMonth(current, -1))}
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <button
            type="button"
            className="calendar-card__nav"
            aria-label="Следующий месяц"
            onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))}
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>
      </div>

      <p className="calendar-card__month">{monthFormatter.format(visibleMonth)}</p>

      <div className="calendar-grid" aria-hidden="true">
        {weekDays.map((day) => (
          <span key={day} className="calendar-grid__weekday">
            {day}
          </span>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((day) => {
          const dayDeposits = closingByDate[day.iso] ?? []
          const isMarked = dayDeposits.length > 0
          const tooltip = dayDeposits
            .map((deposit) => `${deposit.bankName}: ${formatCurrency(deposit.amountRub)}`)
            .join(', ')
          const primaryStatus = dayDeposits[0]?.status
          const className = [
            'calendar-day',
            day.isCurrentMonth ? '' : 'calendar-day--muted',
            isMarked ? 'calendar-day--marked' : '',
            activeTooltipDate === day.iso ? 'calendar-day--active' : '',
            primaryStatus ? getStatusTone(primaryStatus) : '',
          ].filter(Boolean).join(' ')

          if (isMarked) {
            return (
              <button
                key={day.iso}
                type="button"
                className={className}
                aria-label={`${day.day}: ${tooltip}`}
                onClick={() => setActiveTooltipDate((current) => (current === day.iso ? null : day.iso))}
              >
                <span>{day.day}</span>
                <span className="calendar-day__tooltip" role="tooltip">
                  {dayDeposits.map((deposit) => (
                    <span key={deposit.id} className="calendar-day__tooltip-row">
                      <strong>{deposit.bankName}</strong>
                      <span>{formatCurrency(deposit.amountRub)}</span>
                    </span>
                  ))}
                </span>
              </button>
            )
          }

          return (
            <span
              key={day.iso}
              className={className}
            >
              {day.day}
            </span>
          )
        })}
      </div>
    </section>
  )
}
