import { useState } from 'react'
import { CheckCircle2, Clock3, PhoneCall, Send } from 'lucide-react'
import { useQuoteCart } from '../context/QuoteCartContext'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/engagement'

export function CustomerToolsPage() {
  const { items, generateWhatsAppUrl } = useQuoteCart()
  const [mode, setMode] = useState<'quote'|'callback'|'help'>('quote')
  const [form, setForm] = useState({ name:'', phone:'', email:'', details:'', delivery_area:'', preferred_time:'' })
  const [state, setState] = useState<'idle'|'busy'|'done'>('idle')
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setState('busy'); setError('')
    if (!supabase) { setError('Requests are temporarily unavailable.'); setState('idle'); return }
    const { error: requestError } = await supabase.from('customer_requests').insert({
      request_type: mode === 'help' ? 'product_help' : mode,
      ...form,
      items: items.map(({product, quantity}) => ({ slug: product.slug, name: product.name, quantity })),
    })
    if (requestError) { setError(requestError.message); setState('idle'); return }
    trackEvent(mode === 'callback' ? 'callback_request' : 'quote_started')
    setState('done')
  }

  return <section className="section customer-tools-page"><div className="container tools-layout">
    <div className="tools-intro"><p className="eyebrow text-gold-dark">Personal product support</p><h1>Tell us what you need.</h1><p>Share your requirements once. The store team can follow up with suitable options, current availability and pricing.</p><div className="tools-assurances"><span><PhoneCall size={17}/>Direct store follow-up</span><span><Clock3 size={17}/>Choose a suitable callback time</span><span><CheckCircle2 size={17}/>No online payment required</span></div></div>
    <form className="tools-form" onSubmit={submit}>
      <div className="tools-tabs"><button type="button" className={mode==='quote'?'active':''} onClick={()=>setMode('quote')}>Request quote</button><button type="button" className={mode==='callback'?'active':''} onClick={()=>setMode('callback')}>Request callback</button><button type="button" className={mode==='help'?'active':''} onClick={()=>setMode('help')}>Help me choose</button></div>
      {state === 'done' ? <div className="tools-success"><CheckCircle2 size={34}/><h2>Request received.</h2><p>The A Kaycee team can now follow up using the contact details you supplied.</p>{mode==='quote' && items.length>0 && <a className="button button-whatsapp" href={generateWhatsAppUrl(form.details)} target="_blank" rel="noreferrer">Also send on WhatsApp</a>}</div> : <>
        <div className="owner-form-grid"><label>Your name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Phone / WhatsApp<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Email (optional)<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Delivery area<input value={form.delivery_area} onChange={e=>setForm({...form,delivery_area:e.target.value})}/></label>{mode==='callback' && <label className="owner-wide">Preferred callback time<input value={form.preferred_time} onChange={e=>setForm({...form,preferred_time:e.target.value})} placeholder="e.g. Weekdays after 2pm"/></label>}<label className="owner-wide">{mode==='help'?'Product, room size and budget range':'Requirements'}<textarea rows={5} required value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="Tell us the products, quantities, preferred brands or specifications you need."/></label></div>
        {items.length>0 && <p className="tools-cart-note">Your {items.length} saved quote item{items.length===1?' is':'s are'} included.</p>}
        {error && <div className="owner-error">{error}</div>}<button className="button button-dark" disabled={state==='busy'}><Send size={16}/>{state==='busy'?'Sending…':'Send request'}</button>
      </>}
    </form>
  </div></section>
}

