import type { ResumeAuditMode } from '@vacancy-kit/shared'
import { useState } from 'react'

interface Props {
  mode: ResumeAuditMode
  onChange: (mode: ResumeAuditMode) => void
}

export function AuditModeToggle({ mode, onChange }: Props) {
  const [showTip, setShowTip] = useState(false)

  return (
    <div className="vk-audit-mode">
      <div className="vk-audit-mode-label">
        <span>Режим проверки</span>
        <span
          className="vk-audit-mode-help-wrap"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
        >
          <button
            type="button"
            className="vk-audit-mode-help"
            aria-label="Подсказка о режимах"
            aria-expanded={showTip}
            onFocus={() => setShowTip(true)}
            onBlur={() => setShowTip(false)}
          >
            ?
          </button>
          {showTip ? (
            <div className="vk-audit-mode-tip" role="tooltip">
              <p>
                <strong>Обычный</strong> — в основном для вакансий РФ (рекрутеры).
              </p>
              <p>
                <strong>ATS</strong> — Applicant Tracking System (для зарубежных вакансий).
              </p>
            </div>
          ) : null}
        </span>
      </div>
      <div className="vk-audit-mode-pills">
        <button
          type="button"
          className={`vk-audit-mode-pill${mode === 'normal' ? ' vk-audit-mode-pill--active' : ''}`}
          onClick={() => onChange('normal')}
        >
          Обычный
        </button>
        <button
          type="button"
          className={`vk-audit-mode-pill${mode === 'ats' ? ' vk-audit-mode-pill--active' : ''}`}
          onClick={() => onChange('ats')}
        >
          ATS-системы
        </button>
      </div>
    </div>
  )
}