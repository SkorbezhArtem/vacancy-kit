import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import type {
  Language,
  ResumeAuditCheck,
  ResumeAuditMode,
  ResumeAuditResult,
  ResumeImprovementItem,
  ResumeProfile,
} from '@vacancy-kit/shared'
import { sendMessage } from '@/shared/messages'
import { getSettings } from '@/shared/settings'
import {
  buildAuditCacheKey,
  getCachedResumeAudit,
  saveCachedResumeAudit,
} from '@/shared/resume-audit-cache'
import { formatAuditError } from '@/shared/format-audit-error'
import { AuditModeToggle } from './AuditModeToggle'

interface Props {
  resume: ResumeProfile
  onClose: () => void
  /** Full-page layout (audit tab) vs content-script overlay */
  variant?: 'overlay' | 'page'
}

type Status = 'loading' | 'ready' | 'error'
type ViewTab = 'summary' | 'report' | 'checks'

const SEVERITY_ORDER = { critical: 0, warn: 1, ok: 2 } as const
const SEVERITY_LABEL: Record<ResumeAuditCheck['severity'], string> = {
  critical: 'Критично',
  warn: 'Замечание',
  ok: 'Ок',
}
const SEVERITY_COLOR: Record<ResumeAuditCheck['severity'], string> = {
  critical: '#ef4444',
  warn: '#f59e0b',
  ok: '#22c55e',
}

export function ResumeAuditModal({ resume, onClose, variant = 'overlay' }: Props) {
  const [status, setStatus] = useState<Status>('loading')
  const [result, setResult] = useState<ResumeAuditResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [language, setLanguage] = useState<Language>('ru')
  const [mode, setMode] = useState<ResumeAuditMode>('normal')
  const [view, setView] = useState<ViewTab>('summary')
  const [filter, setFilter] = useState<'all' | 'issues'>('issues')
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [fromCache, setFromCache] = useState(false)
  const [runId, setRunId] = useState(0)

  const cacheKey = useMemo(
    () => buildAuditCacheKey(resume, mode, language),
    [resume, mode, language],
  )

  const runAudit = useCallback(
    async (force: boolean, cancelled: () => boolean) => {
      if (!force) {
        const cached = await getCachedResumeAudit(cacheKey)
        if (cached && !cancelled()) {
          setResult(cached.result)
          setFromCache(true)
          setStatus('ready')
          return
        }
      }

      setFromCache(false)
      setStatus('loading')
      setErrorMessage(null)
      if (force) setResult(null)

      try {
        const response = await sendMessage({
          type: 'resume-audit:request',
          payload: { resume, language, mode },
        })
        if (cancelled()) return

        const typed = response as
          | { type: 'resume-audit:result'; payload: ResumeAuditResult }
          | { type: 'resume-audit:error'; error: string }

        if (typed.type === 'resume-audit:result') {
          setResult(typed.payload)
          setStatus('ready')
          await saveCachedResumeAudit({
            key: cacheKey,
            resume,
            mode,
            language,
            result: typed.payload,
            savedAt: new Date().toISOString(),
          })
        } else {
          setErrorMessage(typed.error)
          setStatus('error')
        }
      } catch (err: unknown) {
        if (cancelled()) return
        setErrorMessage(err instanceof Error ? err.message : String(err))
        setStatus('error')
      }
    },
    [cacheKey, resume, language, mode],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && variant === 'overlay') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, variant])

  useEffect(() => {
    getSettings()
      .then((s) => setLanguage(s.defaultLanguage))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    void runAudit(runId > 0, () => cancelled)
    return () => {
      cancelled = true
    }
  }, [runId, cacheKey, runAudit, mode])

  const checks = result
    ? [...result.checks].sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      )
    : []
  const issueCount = checks.filter((c) => c.severity !== 'ok').length
  const visibleChecks =
    filter === 'issues' ? checks.filter((c) => c.severity !== 'ok') : checks

  const hasRichReport =
    result &&
    ((result.mode === 'normal' && result.normalReport) ||
      (result.mode === 'ats' && result.atsReport))

  async function onCopyReport() {
    if (!result) return
    const lines = buildPlainTextReport(resume, result, checks)
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (e) {
      console.warn('[vacancy-kit] clipboard failed', e)
    }
  }

  const shellClass = variant === 'page' ? 'vk-audit-page' : 'vk-overlay'
  const modalClass =
    variant === 'page'
      ? 'vk-modal vk-modal-wide vk-modal-page'
      : 'vk-modal vk-modal-wide'

  return (
    <div
      className={shellClass}
      onClick={variant === 'overlay' ? onClose : undefined}
    >
      <div
        className={modalClass}
        role="dialog"
        aria-modal={variant === 'overlay'}
        aria-label="Resume audit"
        onClick={(e) => e.stopPropagation()}
      >
        <header style={headerStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#a4a9b5', marginBottom: 4 }}>
              Аудит резюме
              {fromCache && status === 'ready' ? ' · сохранённый отчёт' : ''}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#e7e9ee',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {resume.title ?? resume.fullName ?? resume.sourceFileName ?? 'Резюме'}
            </div>
          </div>
          {variant === 'overlay' ? (
            <button type="button" onClick={onClose} aria-label="Close" style={closeBtnStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </header>

        <div className="vk-modal-body">
          <div className="vk-modal-toolbar">
            <AuditModeToggle mode={mode} onChange={setMode} />
            {status === 'loading' ? <LoadingBlock /> : null}
            {status === 'error' ? <ErrorBlock message={errorMessage} /> : null}
          </div>

          {status === 'ready' && result ? (
            <>
              <ScoreRow result={result} issueCount={issueCount} />
              <ViewTabs view={view} setView={setView} hasRichReport={!!hasRichReport} />
              <div
                className="vk-modal-scroll"
                style={{
                  minHeight: variant === 'page' ? 320 : 160,
                  maxHeight: variant === 'page' ? undefined : 'min(50vh, 360px)',
                }}
              >
                {view === 'summary' ? (
                  <SummaryView result={result} />
                ) : null}
                {view === 'report' && hasRichReport ? (
                  <RichReportView result={result} />
                ) : null}
                {view === 'checks' ? (
                  <>
                    <FilterRow
                      filter={filter}
                      setFilter={setFilter}
                      total={checks.length}
                      issues={issueCount}
                    />
                    {visibleChecks.map((check) => (
                      <CheckCard key={check.id} check={check} />
                    ))}
                  </>
                ) : null}
              </div>
              <footer style={footerStyle}>
                <button
                  type="button"
                  onClick={() => setRunId((n) => n + 1)}
                  style={ghostBtnStyle}
                >
                  Обновить
                </button>
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  style={{
                    ...ghostBtnStyle,
                    opacity: pdfLoading ? 0.6 : 1,
                    cursor: pdfLoading ? 'wait' : 'pointer',
                  }}
                  disabled={pdfLoading}
                  onClick={() => {
                    setPdfLoading(true)
                    void import('@/shared/resume-audit-pdf')
                      .then((m) => m.downloadResumeAuditPdf(resume, result))
                      .catch((err: unknown) => {
                        console.warn('[vacancy-kit] pdf export failed', err)
                        setErrorMessage(
                          err instanceof Error
                            ? err.message
                            : 'Не удалось сохранить PDF',
                        )
                        setStatus('error')
                      })
                      .finally(() => setPdfLoading(false))
                  }}
                >
                  {pdfLoading ? 'PDF…' : 'PDF'}
                </button>
                <button
                  type="button"
                  className="vk-button vk-button-audit"
                  style={{ height: 36, fontSize: 13 }}
                  onClick={onCopyReport}
                >
                  {copied ? 'Скопировано' : 'Копировать'}
                </button>
              </footer>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ViewTabs({
  view,
  setView,
  hasRichReport,
}: {
  view: ViewTab
  setView: (v: ViewTab) => void
  hasRichReport: boolean
}) {
  const tab = (id: ViewTab): CSSProperties => ({
    padding: '5px 10px',
    fontSize: 12,
    borderRadius: 999,
    border: view === id ? '1px solid rgba(20,184,166,0.5)' : '1px solid rgba(255,255,255,0.1)',
    background: view === id ? 'rgba(20,184,166,0.15)' : 'transparent',
    color: view === id ? '#99f6e4' : '#a4a9b5',
    cursor: 'pointer',
  })

  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
      <button type="button" style={tab('summary')} onClick={() => setView('summary')}>
        Сводка
      </button>
      {hasRichReport ? (
        <button type="button" style={tab('report')} onClick={() => setView('report')}>
          Подробный отчёт
        </button>
      ) : null}
      <button type="button" style={tab('checks')} onClick={() => setView('checks')}>
        Проверки
      </button>
    </div>
  )
}

function SummaryView({ result }: { result: ResumeAuditResult }) {
  return (
    <>
      <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.5, color: '#c8ccd4' }}>
        {result.summary}
      </p>
      {result.strengths.length > 0 ? (
        <ChipRow title="Сильные стороны" items={result.strengths} />
      ) : null}
      {result.priorities.length > 0 ? (
        <ChipRow title="Сделать в первую очередь" items={result.priorities} warn />
      ) : null}
    </>
  )
}

function RichReportView({ result }: { result: ResumeAuditResult }) {
  if (result.mode === 'normal' && result.normalReport) {
    const r = result.normalReport
    return (
      <div style={{ fontSize: 13, color: '#c8ccd4', lineHeight: 1.5 }}>
        <Section title="Грейд и вывод">{r.gradeVerdict}</Section>
        <BulletSection title="Критические проблемы" items={r.impact.critical} empty="Не обнаружено" />
        <BulletSection title="Серьёзно снижает шансы" items={r.impact.serious} />
        <BulletSection title="Немного снижает шансы" items={r.impact.minor} />
        <ImprovementSection title="Критичные улучшения" items={r.improvements.critical} />
        <ImprovementSection title="Важные улучшения" items={r.improvements.important} />
        <ImprovementSection title="Желательные улучшения" items={r.improvements.optional} />
        {r.metricsExamples?.length ? (
          <BulletSection title="Примеры метрик" items={r.metricsExamples} />
        ) : null}
        {r.closing ? (
          <Section title="Финал">
            <strong>Сейчас:</strong> {r.closing.priority}
            <br />
            <strong>Позже:</strong> {r.closing.later}
            <br />
            <strong>Совет:</strong> {r.closing.tip}
          </Section>
        ) : null}
        {r.detailedReview?.map((item) => (
          <Section key={item.title} title={item.title}>
            {item.message}
          </Section>
        ))}
      </div>
    )
  }

  if (result.mode === 'ats' && result.atsReport) {
    const r = result.atsReport
    return (
      <div style={{ fontSize: 13, color: '#c8ccd4', lineHeight: 1.5 }}>
        <Section title="Совместимость с ATS">{r.compatibilityNotes}</Section>
        <BulletSection title="Сильные ключевые слова" items={r.keywordStrengths} />
        <BulletSection title="Пробелы" items={r.keywordGaps} />
        <BulletSection title="Форматирование" items={r.formattingWarnings} />
        <BulletSection title="Рекомендуемые заголовки" items={r.recommendedHeadings} />
      </div>
    )
  }

  return null
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 600, color: '#e7e9ee', marginBottom: 6 }}>{title}</div>
      <div>{children}</div>
    </div>
  )
}

function BulletSection({
  title,
  items,
  empty,
}: {
  title: string
  items: string[]
  empty?: string
}) {
  if (items.length === 0 && !empty) return null
  return (
    <Section title={title}>
      {items.length === 0 ? (
        <span>{empty}</span>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {items.map((item) => (
            <li key={item} style={{ marginBottom: 4 }}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

function ImprovementSection({
  title,
  items,
}: {
  title: string
  items: ResumeImprovementItem[]
}) {
  if (items.length === 0) return null
  return (
    <Section title={title}>
      {items.map((item) => (
        <div
          key={`${item.now}-${item.problem}`}
          style={{
            marginBottom: 10,
            padding: 10,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div>
            <span style={{ color: '#a4a9b5' }}>Сейчас: </span>
            {item.now}
          </div>
          <div>
            <span style={{ color: '#a4a9b5' }}>Проблема: </span>
            {item.problem}
          </div>
          <div style={{ color: '#5eead4' }}>Как исправить: {item.fix}</div>
          <div>
            <span style={{ color: '#a4a9b5' }}>Почему: </span>
            {item.why}
          </div>
        </div>
      ))}
    </Section>
  )
}

function buildPlainTextReport(
  resume: ResumeProfile,
  result: ResumeAuditResult,
  checks: ResumeAuditCheck[],
): string[] {
  const lines = [
    'vacancy-kit — аудит резюме',
    `${resume.title ?? resume.sourceFileName ?? 'Резюме'}`,
    `Оценка: ${result.score}/100 (${result.grade}) · режим ${result.mode}`,
    '',
    result.summary,
  ]
  if (result.normalReport) {
    lines.push('', '--- Подробный отчёт ---', result.normalReport.gradeVerdict)
  }
  lines.push(
    '',
    'Сильные стороны:',
    ...result.strengths.map((s) => `• ${s}`),
    '',
    'Проверки:',
    ...checks.map(
      (c) =>
        `[${SEVERITY_LABEL[c.severity]}] ${c.title}\n${c.message}${c.fix ? `\n→ ${c.fix}` : ''}`,
    ),
  )
  return lines
}

function ScoreRow({
  result,
  issueCount,
}: {
  result: ResumeAuditResult
  issueCount: number
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 14,
        padding: 12,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontSize: 18,
          fontWeight: 700,
          color: '#fff',
          background: scoreGradient(result.score),
          flexShrink: 0,
        }}
      >
        {result.score}
      </div>
      <div>
        <div style={{ fontSize: 13, color: '#a4a9b5' }}>Итоговая оценка</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#e7e9ee' }}>
          {gradeLabel(result.grade)}
        </div>
        <div style={{ fontSize: 12, color: '#a4a9b5', marginTop: 4 }}>
          {issueCount} замечаний · {result.checks.length} проверок
        </div>
      </div>
    </div>
  )
}

function gradeLabel(grade: ResumeAuditResult['grade']): string {
  const map = {
    weak: 'Слабое резюме',
    fair: 'Нужна доработка',
    good: 'Хорошая база',
    excellent: 'Сильное резюме',
  }
  return map[grade]
}

function scoreGradient(score: number): string {
  if (score >= 85) return 'linear-gradient(135deg, #22c55e, #14b8a6)'
  if (score >= 70) return 'linear-gradient(135deg, #3b82f6, #14b8a6)'
  if (score >= 50) return 'linear-gradient(135deg, #f59e0b, #f97316)'
  return 'linear-gradient(135deg, #ef4444, #f97316)'
}

function ChipRow({
  title,
  items,
  warn,
}: {
  title: string
  items: string[]
  warn?: boolean
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 11,
          color: '#a4a9b5',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item) => (
          <span
            key={item}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 999,
              background: warn ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
              color: warn ? '#fcd34d' : '#86efac',
              border: `1px solid ${warn ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.25)'}`,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function FilterRow({
  filter,
  setFilter,
  total,
  issues,
}: {
  filter: 'all' | 'issues'
  setFilter: (f: 'all' | 'issues') => void
  total: number
  issues: number
}) {
  const btn = (active: boolean): CSSProperties => ({
    padding: '5px 10px',
    fontSize: 12,
    borderRadius: 999,
    border: active ? '1px solid rgba(20,184,166,0.5)' : '1px solid rgba(255,255,255,0.1)',
    background: active ? 'rgba(20,184,166,0.15)' : 'transparent',
    color: active ? '#99f6e4' : '#a4a9b5',
    cursor: 'pointer',
  })

  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
      <button type="button" style={btn(filter === 'issues')} onClick={() => setFilter('issues')}>
        Проблемы ({issues})
      </button>
      <button type="button" style={btn(filter === 'all')} onClick={() => setFilter('all')}>
        Все ({total})
      </button>
    </div>
  )
}

function CheckCard({ check }: { check: ResumeAuditCheck }) {
  return (
    <div
      style={{
        marginBottom: 8,
        padding: '10px 12px',
        borderRadius: 10,
        border: `1px solid ${SEVERITY_COLOR[check.severity]}33`,
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            color: SEVERITY_COLOR[check.severity],
          }}
        >
          {SEVERITY_LABEL[check.severity]}
        </span>
        <span style={{ fontSize: 10, color: '#6b7280' }}>{check.category}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e7e9ee', marginBottom: 4 }}>
        {check.title}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.45, color: '#b8bcc6' }}>{check.message}</div>
      {check.fix ? (
        <div style={{ fontSize: 12, lineHeight: 1.4, color: '#5eead4', marginTop: 6 }}>
          → {check.fix}
        </div>
      ) : null}
    </div>
  )
}

function LoadingBlock() {
  return (
    <div style={{ padding: '24px 0', textAlign: 'center', color: '#a4a9b5', fontSize: 14 }}>
      Анализируем резюме… подробный отчёт может занять до минуты
    </div>
  )
}

function ErrorBlock({ message }: { message: string | null }) {
  return <div className="vk-audit-error-block">{formatAuditError(message)}</div>
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '18px 20px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}

const closeBtnStyle: CSSProperties = {
  background: 'transparent',
  color: '#a4a9b5',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  width: 32,
  height: 32,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const footerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingTop: 12,
  marginTop: 8,
  borderTop: '1px solid rgba(255,255,255,0.06)',
}

const ghostBtnStyle: CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#e7e9ee',
  borderRadius: 12,
  height: 36,
  padding: '0 14px',
  fontSize: 13,
  cursor: 'pointer',
}


