import React from 'react'
import { whatsappHref } from '../lib/site'
import { WhatsAppIcon } from './SocialIcons'
import { trackEvent } from '../lib/engagement'

type Props = {
  subject?: string
  children?: React.ReactNode
  className?: string
  compact?: boolean
  variant?: 'whatsapp' | 'ghost' | 'light' | 'gold'
}

export function WhatsAppLink({
  subject,
  children = 'Chat on WhatsApp',
  className = '',
  compact = false,
  variant = 'whatsapp',
}: Props) {
  const variantClass =
    variant === 'whatsapp'
      ? 'button-whatsapp'
      : variant === 'light'
      ? 'button-light'
      : variant === 'gold'
      ? 'button-gold'
      : 'button-ghost'

  return (
    <a
      className={`button ${variantClass} ${compact ? 'button-compact' : ''} ${className}`}
      href={whatsappHref(subject)}
      target="_blank"
      rel="noreferrer"
      aria-label="Direct chat on WhatsApp"
      onClick={() => trackEvent('whatsapp_click', { metadata: { subject: subject || 'general enquiry' } })}
    >
      <WhatsAppIcon className={compact ? 'size-4' : 'size-4.5'} />
      <span>{children}</span>
    </a>
  )
}
