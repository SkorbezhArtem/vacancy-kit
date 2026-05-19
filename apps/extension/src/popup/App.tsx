import { useEffect } from 'react'
import { FileText, Sparkles, ScanLine, ExternalLink, Upload } from 'lucide-react'
import { openResumeAuditPage } from '@/shared/open-audit-page'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QUOTA_STORAGE_KEY } from '@/shared/quota'
import { useAppStore } from '@/shared/store'

export function App() {
  const { quota, quotaSyncing, refresh, applyFromStorage } = useAppStore()

  useEffect(() => {
    void refresh()

    const onStorage = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === 'local' && changes[QUOTA_STORAGE_KEY]) {
        void applyFromStorage()
      }
    }

    chrome.storage.onChanged.addListener(onStorage)
    return () => chrome.storage.onChanged.removeListener(onStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per popup open
  }, [])

  const used = quota.used
  const limit = quota.limit
  const remaining = Math.max(0, limit - used)
  const pct = limit === 0 ? 0 : Math.min(100, Math.round((remaining / limit) * 100))

  return (
    <div className="w-[360px] min-h-[440px] bg-bg p-4 text-text">
      <div className="bg-brand-radial absolute inset-x-0 top-0 h-40 pointer-events-none" />

      <header className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-brand-gradient grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">vacancy-kit</div>
            <div className="text-[11px] text-text-dim">hh.ru · rabota.by</div>
          </div>
        </div>
        <Badge variant="brand">beta</Badge>
      </header>

      <Card className="relative mb-3">
        <CardHeader>
          <CardTitle className="text-gradient">Quota</CardTitle>
          <CardDescription>
            {remaining} of {limit} free generations left today
            {quotaSyncing ? ' · updating…' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-brand-gradient transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button size="sm" variant="secondary" className="ml-auto">
            Manage plan
          </Button>
        </CardFooter>
      </Card>

      <Card className="relative mb-3">
        <CardHeader>
          <CardTitle>Проверка резюме</CardTitle>
          <CardDescription>
            Загрузите PDF или DOCX — обычный отчёт для РФ или ATS для зарубежных вакансий.
            Результат сохраняется локально.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" className="w-full" onClick={() => openResumeAuditPage()}>
            <Upload className="h-4 w-4 mr-2" />
            Загрузить и проверить
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-3">
        <CardHeader>
          <CardTitle>What it does</CardTitle>
          <CardDescription>Open a vacancy on hh.ru or rabota.by — the kit shows up next to the apply button.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Feature icon={<FileText className="h-4 w-4" />} title="Cover letter" desc="Tailored to the vacancy + your resume." />
          <Feature icon={<ScanLine className="h-4 w-4" />} title="Resume audit" desc="On hh/rabota or upload PDF/DOCX — normal & ATS modes, PDF export." />
          <Feature icon={<Sparkles className="h-4 w-4" />} title="Match score" desc="0–100 fit on every vacancy card." />
        </CardContent>
      </Card>

      <div className="text-center text-[11px] text-text-dim mt-4">
        <a
          href="https://github.com/SkorbezhArtem/vacancy-kit"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 hover:text-text-muted"
        >
          source on github
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
      <div className="h-7 w-7 shrink-0 rounded-lg bg-brand-500/15 text-brand-300 grid place-items-center">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-text-muted">{desc}</div>
      </div>
    </div>
  )
}
