import type { CoverLetterRequest, CoverLetterResult, Vacancy } from '@vacancy-kit/shared'

export type Message =
  | { type: 'cover-letter:request'; payload: CoverLetterRequest }
  | { type: 'cover-letter:result'; payload: CoverLetterResult }
  | { type: 'match-score:request'; payload: { vacancy: Vacancy } }
  | { type: 'match-score:result'; payload: { score: number; reasons: string[] } }
  | { type: 'ping' }
  | { type: 'pong'; payload: { ts: number } }

export type MessageOf<T extends Message['type']> = Extract<Message, { type: T }>

export function sendMessage<T extends Message>(msg: T): Promise<unknown> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(msg, (response) => {
        const err = chrome.runtime.lastError
        if (err) {
          reject(new Error(err.message))
          return
        }
        resolve(response)
      })
    } catch (e) {
      reject(e)
    }
  })
}
