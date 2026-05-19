import { auditResume, fetchQuotaFromApi, generateCoverLetter } from '@/shared/api'
import type { Message } from '@/shared/messages'

function prefetchQuota(): void {
  void fetchQuotaFromApi().catch(() => {})
}

chrome.runtime.onInstalled.addListener((details) => {
  console.info('[vacancy-kit] installed', details.reason)
  prefetchQuota()
})

chrome.runtime.onStartup.addListener(() => {
  prefetchQuota()
})

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message.type === 'ping') {
    sendResponse({ type: 'pong', payload: { ts: Date.now() } })
    return false
  }

  if (message.type === 'cover-letter:request') {
    generateCoverLetter(message.payload)
      .then((result) => sendResponse({ type: 'cover-letter:result', payload: result }))
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : String(err)
        sendResponse({ type: 'cover-letter:error', error: errorMessage })
      })
    return true
  }

  if (message.type === 'resume-audit:request') {
    auditResume(message.payload)
      .then((result) => sendResponse({ type: 'resume-audit:result', payload: result }))
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : String(err)
        sendResponse({ type: 'resume-audit:error', error: errorMessage })
      })
    return true
  }

  return false
})
