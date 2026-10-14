// Remember only recovery intent, never the URL's credentials or session tokens.
export function isPasswordRecoveryCallback(hash: string) {
  return new URLSearchParams(hash.replace(/^#/, '')).get('type') === 'recovery'
}

export function createRecoveryTracker(initial = false) {
  let pending = initial
  const listeners = new Set<() => void>()
  return {
    isPending: () => pending,
    clear: () => { pending = false },
    handle(event: string) {
      if (event === 'SIGNED_OUT') pending = false
      if (event !== 'PASSWORD_RECOVERY') return
      pending = true
      for (const listener of listeners) listener()
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

export const recoveryDestination = (validSession: boolean) => validSession
  ? '/ak-owner-portal?reset=1'
  : '/ak-owner-portal?reset=1&error=invalid_recovery'
