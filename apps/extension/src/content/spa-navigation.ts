const listeners = new Set<() => void>()
let installed = false

function notify(): void {
  for (const fn of listeners) {
    try {
      fn()
    } catch (e) {
      console.warn('[vacancy-kit] navigation listener failed', e)
    }
  }
}

export function onSpaNavigation(listener: () => void): () => void {
  listeners.add(listener)

  if (!installed) {
    installed = true
    const pushState = history.pushState.bind(history)
    const replaceState = history.replaceState.bind(history)

    history.pushState = (...args) => {
      pushState(...args)
      notify()
    }
    history.replaceState = (...args) => {
      replaceState(...args)
      notify()
    }
    window.addEventListener('popstate', notify)
  }

  return () => listeners.delete(listener)
}
