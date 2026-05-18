import { generateCoverLetter } from '@/shared/api'
import type { Message } from '@/shared/messages'

chrome.runtime.onInstalled.addListener((details) => {
  console.info('[vacancy-kit] installed', details.reason)
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

  return false
})
