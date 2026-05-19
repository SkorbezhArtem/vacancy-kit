/** User-facing message for resume-audit API failures. */
export function formatAuditError(raw: string | null | undefined): string {
  if (!raw?.trim()) {
    return 'Не удалось провести аудит. Попробуйте ещё раз.'
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const body = JSON.parse(jsonMatch[0]) as { message?: string }
      if (body.message) {
        if (/non-JSON|invalid audit JSON/i.test(body.message)) {
          return 'Модель вернула некорректный ответ. Нажмите «Обновить» — обычно помогает со второй попытки.'
        }
        return body.message
      }
    } catch {
      /* use fallback below */
    }
  }

  if (/non-JSON|invalid audit JSON/i.test(raw)) {
    return 'Модель вернула некорректный ответ. Нажмите «Обновить» — обычно помогает со второй попытки.'
  }

  if (raw.length > 220) {
    return `${raw.slice(0, 220)}…`
  }

  return raw
}
