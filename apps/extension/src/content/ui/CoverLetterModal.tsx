import { useEffect, useState } from 'react'
import type { Vacancy, CoverLetterResult } from '@vacancy-kit/shared'
import { sendMessage } from '@/shared/messages'

interface Props {
  vacancy: Vacancy
  onClose: () => void
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

export function CoverLetterModal({ vacancy, onClose }: Props) {
  const [status, setStatus] = useState<Status>('loading')
  const [result, setResult] = useState<CoverLetterResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [tone, setTone] = useState<'neutral' | 'friendly' | 'formal'>('neutral')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setErrorMessage(null)
    setResult(null)

    sendMessage({
      type: 'cover-letter:request',
      payload: {
        vacancy,
        resume: null,
        tone,
        language: 'ru',
      },
    })
      .then((response) => {
        if (cancelled) return
        const typed = response as
          | { type: 'cover-letter:result'; payload: CoverLetterResult }
          | { type: 'cover-letter:error'; error: string }
        if (typed.type === 'cover-letter:result') {
          setResult(typed.payload)
          setStatus('ready')
        } else {
          setErrorMessage(typed.error)
          setStatus('error')
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setErrorMessage(err instanceof Error ? err.message : String(err))
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [vacancy, tone])

  async function onCopy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (e) {
      console.warn('[vacancy-kit] clipboard failed', e)
    }
  }

  return (
    <div className="vk-overlay" onClick={onClose}>
      <div
        className="vk-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Cover letter"
        onClick={(e) => e.stopPropagation()}
      >
        <Header vacancy={vacancy} onClose={onClose} />
        <ToneRow tone={tone} setTone={setTone} />
        <Body status={status} result={result} errorMessage={errorMessage} />
        <Footer
          status={status}
          copied={copied}
          onCopy={onCopy}
          onRegenerate={() => setTone((t) => t)}
        />
      </div>
    </div>
  )
}

function Header({ vacancy, onClose }: { vacancy: Vacancy; onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '18px 20px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#a4a9b5', marginBottom: 4 }}>
          Сопроводительное письмо
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
          {vacancy.title}
        </div>
        {vacancy.company ? (
          <div style={{ fontSize: 13, color: '#a4a9b5', marginTop: 2 }}>{vacancy.company}</div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
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
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

function ToneRow({
  tone,
  setTone,
}: {
  tone: 'neutral' | 'friendly' | 'formal'
  setTone: (t: 'neutral' | 'friendly' | 'formal') => void
}) {
  const tones: Array<{ id: 'neutral' | 'friendly' | 'formal'; label: string }> = [
    { id: 'neutral', label: 'Нейтрально' },
    { id: 'friendly', label: 'Дружелюбно' },
    { id: 'formal', label: 'Формально' },
  ]
  return (
    <div style={{ display: 'flex', gap: 6, padding: '12px 20px 0' }}>
      {tones.map((t) => {
        const active = t.id === tone
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTone(t.id)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 999,
              border: active ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
              background: active ? 'rgba(139,92,246,0.18)' : 'transparent',
              color: active ? '#dde1ff' : '#a4a9b5',
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

function Body({
  status,
  result,
  errorMessage,
}: {
  status: Status
  result: CoverLetterResult | null
  errorMessage: string | null
}) {
  return (
    <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, minHeight: 200 }}>
      {status === 'loading' ? <Skeleton /> : null}
      {status === 'error' ? (
        <div
          style={{
            color: '#ef4444',
            fontSize: 13,
            padding: 12,
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            background: 'rgba(239,68,68,0.08)',
          }}
        >
          {errorMessage ?? 'Что-то пошло не так. Попробуй ещё раз.'}
        </div>
      ) : null}
      {status === 'ready' && result ? (
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            fontSize: 14,
            lineHeight: 1.55,
            color: '#e7e9ee',
          }}
        >
          {result.text}
        </pre>
      ) : null}
    </div>
  )
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[100, 92, 88, 78, 95, 84, 70].map((w, i) => (
        <div
          key={i}
          style={{
            height: 12,
            width: `${w}%`,
            borderRadius: 6,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 100%)',
            backgroundSize: '200% 100%',
            animation: 'vk-shimmer 1.4s linear infinite',
          }}
        />
      ))}
      <style>{`@keyframes vk-shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }`}</style>
    </div>
  )
}

function Footer({
  status,
  copied,
  onCopy,
  onRegenerate,
}: {
  status: Status
  copied: boolean
  onCopy: () => void
  onRegenerate: () => void
}) {
  const disabled = status !== 'ready'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 20px 18px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <button
        type="button"
        onClick={onRegenerate}
        disabled={disabled}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#e7e9ee',
          borderRadius: 12,
          height: 36,
          padding: '0 14px',
          fontSize: 13,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        Перегенерировать
      </button>
      <div style={{ flex: 1 }} />
      <button
        type="button"
        onClick={onCopy}
        disabled={disabled}
        className="vk-button"
        style={{ height: 36, padding: '0 16px', fontSize: 13, opacity: disabled ? 0.5 : 1 }}
      >
        {copied ? 'Скопировано' : 'Скопировать'}
      </button>
    </div>
  )
}
