import { useEffect, useState } from 'react'
import { Sparkles, Settings as SettingsIcon, History as HistoryIcon } from 'lucide-react'
import type { UserSettings, HistoryEntry } from '@vacancy-kit/shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSettings, setSettings, DEFAULT_SETTINGS } from '@/shared/settings'
import { getHistory, deleteFromHistory, clearHistory } from '@/shared/history'
import { SettingsPanel } from './SettingsPanel'
import { HistoryPanel } from './HistoryPanel'

export function Options() {
  const [settings, setLocalSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [history, setLocalHistory] = useState<HistoryEntry[]>([])
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [ready, setReady] = useState(false)

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
      <div className="bg-brand-radial pointer-events-none absolute inset-x-0 top-0 h-72" />

      <div className="relative mx-auto w-full max-w-3xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold">vacancy-kit</div>
              <div className="text-xs text-text-dim">настройки и история</div>
            </div>
          </div>
          <Badge variant="brand">beta</Badge>
        </header>

        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-text-muted" />
              Настройки
            </CardTitle>
            <CardDescription>
              Применяются к новым генерациям. Изменения сохраняются автоматически.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ready ? (
              <SettingsPanel settings={settings} onChange={onChange} savedAt={savedAt} />
            ) : (
              <div className="text-sm text-text-dim">Загрузка…</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="h-4 w-4 text-text-muted" />
              История
              <span className="text-xs font-normal text-text-dim">· {history.length}/20</span>
            </CardTitle>
            <CardDescription>
              Последние сопроводительные. Хранятся локально, не уходят на сервер.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ready ? (
              <HistoryPanel items={history} onDelete={onDelete} onClearAll={onClearAll} />
            ) : (
              <div className="text-sm text-text-dim">Загрузка…</div>
            )}
          </CardContent>
        </Card>

        <footer className="mt-10 text-center text-[11px] text-text-dim">
          v{chrome.runtime?.getManifest?.()?.version ?? '0.0.0'} · хранится локально в chrome.storage
        </footer>
      </div>
    </div>
  )
}
