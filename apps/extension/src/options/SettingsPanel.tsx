import { Check } from 'lucide-react'
import type { UserSettings, Tone, Language } from '@vacancy-kit/shared'
import { cn } from '@/lib/cn'

interface Props {
  settings: UserSettings
  onChange: (patch: Partial<UserSettings>) => void
  savedAt: number | null
}

const TONES: Array<{ id: Tone; label: string; hint: string }> = [
  { id: 'neutral', label: 'Нейтрально', hint: 'сухо, по делу' },
  { id: 'friendly', label: 'Дружелюбно', hint: 'живо, по-человечески' },
  { id: 'formal', label: 'Формально', hint: 'деловой стиль' },
]

const LANGS: Array<{ id: Language; label: string }> = [
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
]

export function SettingsPanel({ settings, onChange, savedAt }: Props) {
  const recentlySaved = savedAt !== null && Date.now() - savedAt < 1800

  return (
    <div className="space-y-6">
      <Row label="Тон по умолчанию" hint="используется при первой генерации">
        <div className="grid grid-cols-3 gap-2">
          {TONES.map((t) => {
            const active = settings.defaultTone === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ defaultTone: t.id })}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left transition-colors',
                  active
                    ? 'border-brand-400/50 bg-brand-500/15'
                    : 'border-border bg-white/[0.02] hover:bg-white/[0.04]'
                )}
              >
                <div className={cn('text-sm font-medium', active ? 'text-text' : 'text-text')}>
                  {t.label}
                </div>
                <div className="text-[11px] text-text-dim">{t.hint}</div>
              </button>
            )
          })}
        </div>
      </Row>

      <Row label="Язык по умолчанию" hint="на каком языке писать письмо">
        <div className="flex gap-2">
          {LANGS.map((l) => {
            const active = settings.defaultLanguage === l.id
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onChange({ defaultLanguage: l.id })}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm transition-colors',
                  active
                    ? 'border-brand-400/50 bg-brand-500/15 text-text'
                    : 'border-border bg-transparent text-text-muted hover:text-text'
                )}
              >
                {l.label}
              </button>
            )
          })}
        </div>
      </Row>

      <Row
        label="Не показывать кнопку на закрытых вакансиях"
        hint="если вакансия в архиве — не вмешиваться в страницу"
      >
        <Toggle
          checked={settings.hideOnClosedVacancies}
          onChange={(v) => onChange({ hideOnClosedVacancies: v })}
        />
      </Row>

      <div className="h-4 text-xs text-text-dim">
        {recentlySaved ? (
          <span className="inline-flex items-center gap-1 text-success">
            <Check className="h-3 w-3" />
            Сохранено
          </span>
        ) : null}
      </div>
    </div>
  )
}

function Row({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto] md:items-center md:gap-6">
      <div>
        <div className="text-sm font-medium text-text">{label}</div>
        {hint ? <div className="text-xs text-text-dim">{hint}</div> : null}
      </div>
      <div className="md:justify-self-end">{children}</div>
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
        'relative h-6 w-11 rounded-full transition-colors',
        checked ? 'bg-brand-gradient' : 'bg-white/10'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}
