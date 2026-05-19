import type { ResumeAuditMode } from '@vacancy-kit/shared'
import { useState, type CSSProperties } from 'react'

interface Props {
  mode: ResumeAuditMode
  onChange: (mode: ResumeAuditMode) => void
}

export function AuditModeToggle({ mode, onChange }: Props) {
  const [showTip, setShowTip] = useState(false)

  const pill = (active: boolean): CSSProperties => ({
    padding: '6px 14px',
    fontSize: 12,
    borderRadius: 999,
    border: active ? '1px solid rgba(20,184,166,0.55)' : '1px solid rgba(255,255,255,0.12)',
    background: active ? 'rgba(20,184,166,0.18)' : 'rgba(255,255,255,0.04)',
    color: active ? '#99f6e4' : '#a4a9b5',
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
  })

  return (
    <div style={{ marginBottom: 12, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#a4a9b5' }}>Режим проверки</span>
        <button
          type="button"
          aria-label="Подсказка о режимах"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onFocus={() => setShowTip(true)}
          onBlur={() => setShowTip(false)}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: '#a4a9b5',
            fontSize: 11,
            cursor: 'help',
            lineHeight: 1,
          }}
        >
          ?
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={pill(mode === 'normal')} onClick={() => onChange('normal')}>
          Обычный
        </button>
        <button type="button" style={pill(mode === 'ats')} onClick={() => onChange('ats')}>
          ATS-системы
        </button>
      </div>
      {showTip ? (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: 0,
            top: '100%',
            marginTop: 8,
            zIndex: 10,
            maxWidth: 280,
            padding: '10px 12px',
            borderRadius: 10,
            background: '#fff',
            color: '#111',
            fontSize: 12,
            lineHeight: 1.45,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          <strong>Обычный</strong> — в основном для вакансий РФ (рекрутеры).
          <br />
          <br />
          <strong>ATS</strong> — Applicant Tracking System (для зарубежных вакансий).
        </div>
      ) : null}
    </div>
  )
}
