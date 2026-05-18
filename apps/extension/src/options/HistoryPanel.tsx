import { useState } from 'react'
import { Copy, Trash2, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import type { HistoryEntry } from '@vacancy-kit/shared'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

interface Props {
  items: HistoryEntry[]
  onDelete: (id: string) => void
  onClearAll: () => void
}

const TONE_LABEL: Record<HistoryEntry['tone'], string> = {
  neutral: 'Нейтрально',
  friendly: 'Дружелюбно',
  formal: 'Формально',
}

export function HistoryPanel({ items, onDelete, onClearAll }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white/[0.02] px-4 py-8 text-center text-sm text-text-dim">
        Тут пока пусто. Сгенерируй первое письмо на странице вакансии — оно появится здесь.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={onClearAll}>
          Очистить всё
        </Button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <HistoryItem item={item} onDelete={() => onDelete(item.id)} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function HistoryItem({ item, onDelete }: { item: HistoryEntry; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(item.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (e) {
      console.warn('[vacancy-kit] clipboard failed', e)
    }
  }

  const date = new Date(item.generatedAt)
  const dateLabel = isNaN(date.getTime())
    ? item.generatedAt
    : date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-white/[0.02] transition-colors',
        expanded ? 'border-border-strong' : 'hover:border-border-strong'
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <div className="mt-0.5 text-text-dim">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-text">{item.vacancy.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-text-dim">
            {item.vacancy.company ? <span className="truncate">{item.vacancy.company}</span> : null}
            <span>·</span>
            <span>{dateLabel}</span>
            <span>·</span>
            <span>{TONE_LABEL[item.tone]}</span>
            <span>·</span>
            <span className="uppercase">{item.language}</span>
          </div>
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <pre className="m-0 max-h-72 overflow-y-auto whitespace-pre-wrap font-sans text-[13px] leading-[1.55] text-text">
            {item.text}
          </pre>
          {item.highlights.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.highlights.map((h, i) => (
                <span
                  key={i}
                  className="rounded-full border border-border bg-white/[0.03] px-2 py-0.5 text-[11px] text-text-muted"
                >
                  {h}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onCopy}>
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Скопировано' : 'Скопировать'}
            </Button>
            <a
              href={item.vacancy.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border px-3 text-xs text-text-muted hover:text-text"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Вакансия
            </a>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Удалить
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
