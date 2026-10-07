import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { contact } from '../lib/site'
import { WhatsAppIcon } from './SocialIcons'

type FaqItem = {
  question: string
  answer: string
}

const faqs: FaqItem[] = [
  {
    question: 'Where is your physical store located in Lagos?',
    answer:
      'We are located at 12 Ajayi Road, Ogba Okeira, Lagos State. Contact us before visiting if you need to confirm a particular item or product option.',
  },
  {
    question: 'How do I check current prices and stock availability?',
    answer:
      'Contact us on WhatsApp or by phone for current pricing and availability. We will confirm the relevant option before you make a purchase decision.',
  },
  {
    question: 'Can you help with delivery arrangements?',
    answer:
      'Please ask the store team about delivery options for your location and order. Availability, costs and timing are confirmed on enquiry.',
  },
  {
    question: 'How do I confirm warranty information?',
    answer:
      'Warranty terms can vary by product and supplier. Ask the store team to confirm the warranty information for the exact item you are considering.',
  },
  {
    question: 'Can you supply bulk electrical materials for building projects?',
    answer:
      'Yes. Send your materials list or bill of quantities through WhatsApp so the store team can advise on relevant options and provide a current quote.',
  },
  {
    question: 'How do I confirm payment options?',
    answer:
      'Contact the store directly to confirm available payment methods before placing your order.',
  },
]

export function FaqSection({ className = '' }: { className?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className={`section ${className}`}>
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-gold-dark">
            <HelpCircle size={14} /> Frequently Asked Questions
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Everything You Need to Know
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink/70">
            Clear details on store visits, product enquiries and project supply.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl divide-y divide-ink/10 rounded-3xl border border-ink/10 bg-white p-6 shadow-lg shadow-ink/5 sm:p-8">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div key={faq.question} className="py-4 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 text-left font-display text-lg font-bold tracking-tight text-ink transition hover:text-gold-dark"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full bg-sand text-ink transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-gold/20 text-gold-dark' : ''
                    }`}
                  >
                    <ChevronDown size={18} />
                  </span>
                </button>
                {isOpen && (
                  <div className="mt-3 text-sm leading-relaxed text-ink/70 pr-8 animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Still have questions banner */}
        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-whatsapp/20 bg-whatsapp/10 p-5 sm:flex-row">
          <div>
            <h3 className="font-display text-base font-bold text-ink">Have a custom question or need a bulk quote?</h3>
            <p className="text-xs text-ink/70">Chat with the store team on WhatsApp.</p>
          </div>
          <a
            href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent('Hello A Kaycee Electricals, I have a question about your products and services.')}`}
            target="_blank"
            rel="noreferrer"
            className="button button-whatsapp shrink-0 !py-2.5 !text-xs"
          >
            <WhatsAppIcon className="size-4" /> Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
