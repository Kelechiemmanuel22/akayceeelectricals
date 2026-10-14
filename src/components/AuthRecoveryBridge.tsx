import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { passwordRecovery, supabase } from '../lib/supabase'
import { recoveryDestination } from '../lib/authRecovery'

export function AuthRecoveryBridge() {
  const navigate = useNavigate()
  useEffect(() => {
    const client = supabase
    if (!client) return
    let disposed = false
    let routing = false
    let timer: number | undefined
    const routeRecovery = async () => {
      if (disposed || routing || !passwordRecovery.isPending()) return
      routing = true
      const invalidCallback = passwordRecovery.isInvalid()
      try {
        // Wait until Supabase has processed the emailed callback before changing
        // routes. Moving earlier could remove the fragment before verification.
        const { data, error } = await client.auth.getSession()
        if (disposed) return
        passwordRecovery.clear()
        navigate(recoveryDestination(!invalidCallback && Boolean(data.session) && !error), { replace: true })
      } catch {
        if (!disposed) {
          passwordRecovery.clear()
          navigate(recoveryDestination(false), { replace: true })
        }
      } finally { routing = false }
    }
    const schedule = () => {
      window.clearTimeout(timer)
      // Never await another auth call inside onAuthStateChange's auth lock.
      timer = window.setTimeout(() => { void routeRecovery() }, 0)
    }
    const unsubscribe = passwordRecovery.subscribe(schedule)
    if (passwordRecovery.isPending()) schedule()
    return () => { disposed = true; window.clearTimeout(timer); unsubscribe() }
  }, [navigate])
  return null
}
