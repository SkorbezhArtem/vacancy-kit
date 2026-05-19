import { useCallback, useState, type DragEvent } from 'react'
import type { ResumeProfile } from '@vacancy-kit/shared'
import { ResumeAuditModal } from '@/components/resume-audit/ResumeAuditModal'
import { isSupportedResumeFile, parseResumeFile } from '@/shared/resume-file-parser'

export function AuditApp() {
  const [resume, setResume] = useState<ResumeProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!isSupportedResumeFile(file)) {
      setError('Поддерживаются PDF и DOCX до 10 МБ.')
      return
    }
    setParsing(true)
    setError(null)
    try {
      const profile = await parseResumeFile(file)
      setResume(profile)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setParsing(false)
    }
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) void handleFile(file)
    },
    [handleFile],
  )

  if (resume) {
    return (
      <ResumeAuditModal
        resume={resume}
        variant="page"
        onClose={() => setResume(null)}
      />
    )
  }

  return (
    <div className="vk-audit-landing">
      <div className="vk-audit-landing-inner">
        <h1 className="vk-audit-title">Проверить резюме</h1>
        <p className="vk-audit-subtitle">
          Подробный аудит: обычный режим для рекрутеров РФ и ATS для зарубежных вакансий.
          Отчёт сохраняется — можно закрыть и вернуться без повторной генерации.
        </p>

        <label
          className={`vk-audit-dropzone${dragOver ? ' vk-audit-dropzone--active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="vk-audit-file-input"
            disabled={parsing}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ''
            }}
          />
          <div className="vk-audit-dropzone-title">
            {parsing ? 'Читаем файл…' : 'Выберите или перетащите файл'}
          </div>
          <div className="vk-audit-dropzone-hint">PDF, DOCX · до 10 МБ</div>
        </label>

        {error ? <div className="vk-audit-error">{error}</div> : null}

        <p className="vk-audit-footnote">
          На hh.ru и rabota.by кнопка «Проверить резюме» появится на странице вашего резюме.
        </p>
      </div>
    </div>
  )
}
