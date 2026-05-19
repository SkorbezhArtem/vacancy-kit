import { useState } from 'react'
import type { ResumeProfile } from '@vacancy-kit/shared'
import { ResumeAuditModal } from '@/components/resume-audit/ResumeAuditModal'

interface Props {
  resume: ResumeProfile
  inline?: boolean
}

export function InjectResumeAuditButton({ resume, inline = false }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={
          inline
            ? 'vk-button vk-button-audit vk-button-audit-inline'
            : 'vk-button vk-button-audit vk-button-floating'
        }
        onClick={() => setOpen(true)}
        aria-label="Audit resume"
      >
        <ScanIcon />
        <span>{inline ? 'Проверить резюме' : 'Проверить резюме'}</span>
      </button>
      {open ? <ResumeAuditModal resume={resume} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

function ScanIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7V5a1 1 0 011-1h2M20 7V5a1 1 0 00-1-1h-2M4 17v2a1 1 0 001 1h2M20 17v2a1 1 0 01-1 1h-2M7 12h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
