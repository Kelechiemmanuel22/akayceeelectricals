import { supabase } from './supabase'

export type EventName = 'page_view' | 'product_view' | 'whatsapp_click' | 'search' | 'quote_started' | 'quote_sent' | 'newsletter_signup' | 'callback_request'

const SESSION_KEY = 'akaycee_session_id'

function sessionId() {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function trackEvent(event_name: EventName, details: { product_slug?: string; category_id?: string; search_term?: string; metadata?: Record<string, unknown> } = {}) {
  if (!supabase) return
  void supabase.from('analytics_events').insert({
    event_name,
    page_path: window.location.pathname,
    session_id: sessionId(),
    ...details,
  })
}

