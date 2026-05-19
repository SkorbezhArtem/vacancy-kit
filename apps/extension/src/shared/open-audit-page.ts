export function openResumeAuditPage(): void {
  if (typeof chrome === 'undefined' || !chrome.runtime?.getURL) return
  const url = chrome.runtime.getURL('src/audit/index.html')
  if (chrome.tabs?.create) {
    void chrome.tabs.create({ url })
  } else {
    window.open(url, '_blank')
  }
}
