import { useState } from 'react'
import type { HistoryEntry } from '@vacancy-kit/shared'
import { cn } from '@/lib/cn'

interface Props {
  items: HistoryEntry[]
  onDelete: (id: string) => void
  onClearAll: () => void
}

const TONE_SHORT: Record<HistoryEntry['tone'], string> = {
  neutral: 'neutral',
  friendly: 'friendly',
  formal: 'formal',
}

export function HistoryPanel({ items, onDelete, onClearAll }: Props) {
  if (items.length === 0) {
    return (
      <div className="relative border border-dashed border-border/60 px-5 py-10 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          — empty —
        </div>
        <p className="mx-auto mt-3 max-w-sm text-sm text-text-muted">
          Сгенерируй первое сопроводительное на странице вакансии — оно появится здесь.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          {pad(items.length)} / 20 entries
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim transition-colors hover:text-danger"
        >
          clear all ×
        </button>
      </div>
      <ul>
        {items.map((item, i) => (
          <li key={item.id}>
            <HistoryRow
              index={i + 1}
              item={item}
              onDelete={() => onDelete(item.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function HistoryRow({
  index,
  item,
  onDelete,
}: {
  index: number
  item: HistoryEntry
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  async function onCopy(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(item.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (err) {
      console.warn('[vacancy-kit] clipboard failed', err)
    }
  }

  const date = new Date(item.generatedAt)
  const dateLabel = isNaN(date.getTime())
    ? item.generatedAt
    : date
        .toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
        .replace(',', '')

  return (
    <div
      className={cn(
        'group border-b border-border/40 transition-colors',
        expanded ? 'bg-white/[0.015]' : 'hover:bg-white/[0.015]'
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="grid w-full grid-cols-[56px_1fr_auto] items-baseline gap-4 py-4 text-left"
      >
        <span className="font-mono text-[11px] tracking-[0.12em] text-text-dim">
          {pad(index)}
          <span className="ml-1.5 text-text-dim/60">{expanded ? '▾' : '›'}</span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-medium leading-tight text-text">
            {item.vacancy.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-dim">
            {item.vacancy.company ? (
              <span className="truncate normal-case tracking-normal text-text-muted">
                {item.vacancy.company}
              </span>
            ) : null}
            <span>{TONE_SHORT[item.tone]}</span>
            <span>{item.language}</span>
          </span>
        </span>
        <span className="font-mono text-[11px] tracking-[0.05em] text-text-dim">{dateLabel}</span>
      </button>

      {expanded ? (
        <div className="grid grid-cols-[56px_1fr] gap-4 pb-5 pl-0 pr-0">
          <div />
          <div>
            <pre className="m-0 max-h-80 overflow-y-auto whitespace-pre-wrap font-sans text-[13.5px] leading-[1.6] text-text">
              {item.text}
            </pre>
            {item.highlights.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-dim">
                {item.highlights.map((h, i) => (
                  <span key={i}>· {h}</span>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex items-center gap-5">
              <RowAction onClick={onCopy} active={copied}>
                {copied ? '› copied' : '› copy'}
              </RowAction>
              <RowAction asLink href={item.vacancy.url}>
                › open vacancy
              </RowAction>
              <div className="flex-1" />
              <RowAction onClick={onDelete} variant="danger">
                × delete
              </RowAction>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function RowAction({
  children,
  onClick,
  asLink,
  href,
  variant,
  active,
}: {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  asLink?: boolean
  href?: string
  variant?: 'danger'
  active?: boolean
}) {
  const cls = cn(
    'font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
    variant === 'danger'
      ? 'text-text-dim hover:text-danger'
      : active
        ? 'text-success'
        : 'text-text-muted hover:text-text'
  )
  if (asLink && href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cls}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </a>
    )
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  )
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}
