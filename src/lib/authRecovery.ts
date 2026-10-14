// Remember only recovery intent, never the URL's credentials or session tokens.
export function isPasswordRecoveryCallback(hash: string) {
  return new URLSearchParams(hash.replace(/^#/, '')).get('type') === 'recovery'
}

export function hasAuthCallbackError(hash: string, search = '') {
  const fragment = new URLSearchParams(hash.replace(/^#/, ''))
  const query = new URLSearchParams(search.replace(/^\?/, ''))
  return Boolean(fragment.get('error') || fragment.get('error_code') || query.get('error') || query.get('error_code'))
}

export function createRecoveryTracker(initial = false, initialError = false) {
  let pending = initial || initialError
  let invalid = initialError
  const listeners = new Set<() => void>()
  return {
    isPending: () => pending,
    isInvalid: () => invalid,
    clear: () => { pending = false; invalid = false },
    handle(event: string) {
      // Initialization may sign out after rejecting an expired callback. Keep
      // the error long enough for the app to show recovery feedback.
      if (event === 'SIGNED_OUT' && !invalid) pending = false
      if (event !== 'PASSWORD_RECOVERY') return
      pending = true
      invalid = false
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
