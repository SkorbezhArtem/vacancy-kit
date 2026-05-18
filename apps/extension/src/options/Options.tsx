import { useEffect, useState } from 'react'
import type { UserSettings, HistoryEntry } from '@vacancy-kit/shared'
import { getSettings, setSettings, DEFAULT_SETTINGS } from '@/shared/settings'
import { getHistory, deleteFromHistory, clearHistory } from '@/shared/history'
import { SettingsPanel } from './SettingsPanel'
import { HistoryPanel } from './HistoryPanel'

function appVersion(): string {
  if (typeof chrome === 'undefined' || !chrome.runtime?.getManifest) return '0.0.0'
  try {
    return chrome.runtime.getManifest().version
  } catch {
    return '0.0.0'
  }
}

export function Options() {
  const [settings, setLocalSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [history, setLocalHistory] = useState<HistoryEntry[]>([])
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState<'preferences' | 'history'>('preferences')

  useEffect(() => {
    Promise.all([getSettings(), getHistory()])
      .then(([s, h]) => {
        setLocalSettings(s)
        setLocalHistory(h)
        setReady(true)
      })
      .catch((e) => {
        console.warn('[vacancy-kit] options load failed', e)
        setReady(true)
      })
  }, [])

  useEffect(() => {
    function onScroll() {
      const h = document.getElementById('sec-history')
      if (!h) return
      const offset = h.getBoundingClientRect().top
      setActive(offset < 120 ? 'history' : 'preferences')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function onChange(patch: Partial<UserSettings>) {
    const next: UserSettings = { ...settings, ...patch }
    setLocalSettings(next)
    await setSettings(next)
    setSavedAt(Date.now())
  }

  async function onDelete(id: string) {
    const next = await deleteFromHistory(id)
    setLocalHistory(next)
  }

  async function onClearAll() {
    await clearHistory()
    setLocalHistory([])
  }

  return (
    <div className="relative min-h-screen w-full bg-bg text-text">
      <div className="vk-grid-bg pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative border-b border-border/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          <span>vacancy-kit · v{appVersion()}</span>
          <span className="flex items-center gap-5">
            <span className="hidden sm:inline">hh.ru · rabota.by</span>
            <span className="hidden sm:inline">·</span>
            <span>local storage</span>
            <span>·</span>
            <span>auto-save</span>
          </span>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-5xl grid-cols-1 gap-12 px-8 py-16 md:grid-cols-[200px_1fr] md:gap-20 md:py-20">
        <aside className="md:sticky md:top-12 md:h-fit">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
            vacancy-kit
          </div>
          <h1 className="mt-1 text-[34px] font-semibold leading-[1] tracking-tight text-text">
            <span className="text-text-dim">/</span> options
          </h1>
          <p className="mt-4 max-w-[180px] text-sm leading-snug text-text-muted">
            Локальные настройки и история сопроводительных писем.
          </p>

          <nav className="mt-10 flex flex-row gap-6 md:flex-col md:gap-2">
            <TocLink href="#sec-preferences" active={active === 'preferences'}>
              01 — preferences
            </TocLink>
            <TocLink href="#sec-history" active={active === 'history'}>
              02 — history
            </TocLink>
          </nav>

          <div className="mt-12 hidden border-t border-border/40 pt-5 md:block">
            <Stat label="entries" value={`${history.length} / 20`} />
            <Stat label="tone" value={settings.defaultTone} />
            <Stat label="lang" value={settings.defaultLanguage.toUpperCase()} />
          </div>
        </aside>

        <main className="min-w-0">
          <section id="sec-preferences">
            <SectionHead num="01" title="Preferences" tag="настройки" />
            {ready ? (
              <SettingsPanel settings={settings} onChange={onChange} savedAt={savedAt} />
            ) : (
              <div className="py-8 font-mono text-[11px] uppercase tracking-[0.2em] text-text-dim">
                loading…
              </div>
            )}
          </section>

          <section id="sec-history" className="mt-24">
            <SectionHead
              num="02"
              title="History"
              tag={`${history.length} / 20 — локально, не уходит на сервер`}
            />
            {ready ? (
              <HistoryPanel items={history} onDelete={onDelete} onClearAll={onClearAll} />
            ) : (
              <div className="py-8 font-mono text-[11px] uppercase tracking-[0.2em] text-text-dim">
                loading…
              </div>
            )}
          </section>

          <footer className="mt-24 flex items-center justify-between border-t border-border/40 pt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
            <span>vk-options · v{appVersion()}</span>
            <span>chrome.storage.local</span>
          </footer>
        </main>
      </div>
    </div>
  )
}

function SectionHead({ num, title, tag }: { num: string; title: string; tag?: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim">
          {num}
        </span>
        <span className="vk-rule flex-1" />
      </div>
      <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight">{title}</h2>
      {tag ? (
        <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-text-dim">
          — {tag}
        </p>
      ) : null}
    </div>
  )
}

function TocLink({
  href,
  active,
  children,
}: {
  href: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className={
        'group block font-mono text-[11px] uppercase tracking-[0.22em] transition-colors ' +
        (active ? 'text-text' : 'text-text-dim hover:text-text')
      }
    >
      <span className={'mr-2 ' + (active ? 'text-accent-400' : 'text-text-dim/60')}>
        {active ? '▸' : '·'}
      </span>
      {children}
    </a>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em]">
      <span className="text-text-dim">{label}</span>
      <span className="text-text">{value}</span>
    </div>
  )
}
