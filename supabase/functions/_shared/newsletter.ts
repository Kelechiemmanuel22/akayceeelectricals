export type NewsletterContent = { subject: string; preview_text: string; headline: string; body: string; button_label?: string; button_url?: string }
export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]!)
}
export function validateNewsletter(content: NewsletterContent) {
  if (!content.subject?.trim() || content.subject.length > 150 || /[\r\n]/.test(content.subject)) throw Error('Use a subject between 1 and 150 characters without line breaks.')
  if (!content.headline?.trim() || content.headline.length > 200 || !content.body?.trim() || content.body.length > 15000) throw Error('Enter a headline and message within the allowed lengths.')
  if ((content.preview_text || '').length > 200) throw Error('Inbox preview must be 200 characters or fewer.')
  if (content.button_url) {
    let url: URL
    try { url = new URL(content.button_url) } catch { throw Error('The button link must be a valid HTTPS URL.') }
    if (url.protocol !== 'https:' || url.username || url.password) throw Error('The button link must use HTTPS without embedded credentials.')
  }
}
export function newsletterHtml(content: NewsletterContent, unsubscribe: string | null) {
  validateNewsletter(content)
  const safe = escapeHtml
  return `<!doctype html><html><body style="margin:0;background:#f3f5fa;font-family:Arial,sans-serif;color:#081b31"><div style="max-width:620px;margin:auto;padding:32px 20px"><span style="display:none!important">${safe(content.preview_text || '')}</span><div style="background:#fff;border-radius:16px;padding:32px"><p style="color:#005be4;font-weight:bold;font-size:18px">A Kaycee Electricals</p><h1 style="font-size:30px;line-height:1.25">${safe(content.headline)}</h1><div style="line-height:1.8;white-space:pre-line">${safe(content.body)}</div>${content.button_url ? `<p style="margin-top:28px"><a href="${safe(content.button_url)}" style="display:inline-block;background:#081b31;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none">${safe(content.button_label || 'Explore catalogue')}</a></p>` : ''}</div><p style="font-size:12px;line-height:1.8;color:#576781;text-align:center">A Kaycee Electricals · 12 Ajayi Road, Ogba Okeira, Lagos, Nigeria.<br/>${unsubscribe ? `You subscribed to our updates. <a href="${safe(unsubscribe)}">Unsubscribe</a>` : 'Owner-only test email. No subscriber preferences were changed.'}</p></div></body></html>`
}
export function newsletterText(content: NewsletterContent, unsubscribe: string | null) {
  return `${content.headline}\n\n${content.body}${content.button_url ? `\n\n${content.button_label || 'Explore catalogue'}: ${content.button_url}` : ''}\n\nA Kaycee Electricals, 12 Ajayi Road, Ogba Okeira, Lagos, Nigeria.${unsubscribe ? `\nUnsubscribe: ${unsubscribe}` : '\nOwner-only test email.'}`
}
