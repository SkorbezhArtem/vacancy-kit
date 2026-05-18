import type { UserSettings, Tone, Language } from '@vacancy-kit/shared'
import { cn } from '@/lib/cn'

interface Props {
  settings: UserSettings
  onChange: (patch: Partial<UserSettings>) => void
  savedAt: number | null
}

const TONES: Array<{ id: Tone; label: string; ru: string }> = [
  { id: 'neutral', label: 'NEUTRAL', ru: 'нейтрально' },
  { id: 'friendly', label: 'FRIENDLY', ru: 'дружелюбно' },
  { id: 'formal', label: 'FORMAL', ru: 'формально' },
]

const LANGS: Array<{ id: Language; label: string }> = [
  { id: 'ru', label: 'RU' },
  { id: 'en', label: 'EN' },
]

export function SettingsPanel({ settings, onChange, savedAt }: Props) {
  const recentlySaved = savedAt !== null && Date.now() - savedAt < 1800

  return (
    <div>
      <Row
        label="tone"
        title="Тон письма"
        hint="С каким настроением модалка стартует на новой вакансии."
      >
        <Segmented
          options={TONES.map((t) => ({ id: t.id, label: t.label, hint: t.ru }))}
          value={settings.defaultTone}
          onChange={(v) => onChange({ defaultTone: v })}
        />
      </Row>

      <Row label="language" title="Язык" hint="На каком языке писать письмо.">
        <Segmented
          options={LANGS}
          value={settings.defaultLanguage}
          onChange={(v) => onChange({ defaultLanguage: v })}
        />
      </Row>

      <Row
        label="archive"
        title="Скрывать на закрытых вакансиях"
        hint="Не вмешиваться в страницу, если объявление в архиве."
      >
        <Toggle
          checked={settings.hideOnClosedVacancies}
          onChange={(v) => onChange({ hideOnClosedVacancies: v })}
        />
      </Row>

      <div className="mt-6 h-3 font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
        {recentlySaved ? <span className="text-success">› saved</span> : null}
      </div>
    </div>
  )
}

function Row({
  label,
  title,
  hint,
  children,
}: {
  label: string
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-4 border-b border-border/40 py-6 first:pt-2 last:border-b-0 md:grid-cols-[140px_1fr_auto] md:items-center md:gap-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
        — {label}
      </div>
      <div className="min-w-0">
        <div className="text-[15px] font-medium leading-tight text-text">{title}</div>
        {hint ? <div className="mt-1 text-xs text-text-muted">{hint}</div> : null}
      </div>
      <div className="md:justify-self-end">{children}</div>
    </div>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: T; label: string; hint?: string }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border bg-bg-elevated/40">
      {options.map((opt, i) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            title={opt.hint}
            className={cn(
              'relative h-9 px-4 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
              i > 0 && 'border-l border-border',
              active
                ? 'bg-text text-bg'
                : 'bg-transparent text-text-muted hover:bg-white/[0.03] hover:text-text'
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-7 w-12 items-center rounded-full p-0.5 transition-colors',
        checked ? 'bg-text' : 'bg-white/[0.08] hover:bg-white/[0.12]'
      )}
    >
      <span
        className={cn(
          'block h-6 w-6 rounded-full shadow transition-all',
          checked ? 'translate-x-5 bg-bg' : 'translate-x-0 bg-text-muted'
        )}
      />
    </button>
  )
}
