import { useState } from 'react'
import type { Vacancy } from '@/shared/types'
import { CoverLetterModal } from './CoverLetterModal'

interface Props {
  vacancy: Vacancy
}

export function InjectButton({ vacancy }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="vk-button"
        onClick={() => setOpen(true)}
        aria-label="Generate cover letter"
      >
        <SparkleIcon />
        <span>Сопроводительное</span>
      </button>
      {open ? <CoverLetterModal vacancy={vacancy} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"
        fill="currentColor"
      />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" fill="currentColor" />
    </svg>
  )
}
