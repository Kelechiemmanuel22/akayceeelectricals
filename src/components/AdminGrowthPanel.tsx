import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, Check, Mail, MessageSquareText, Send, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

type EventRow={id:number;event_name:string;page_path:string;product_slug:string|null;search_term:string|null;created_at:string}
type Subscriber={id:string;email:string;status:string;created_at:string}
type RequestRow={id:string;request_type:string;name:string;phone:string;email:string|null;details:string;delivery_area:string|null;preferred_time:string|null;items:{name:string;quantity:number}[];status:string;created_at:string}

export function AdminGrowthPanel() {
  const [tab,setTab]=useState<'analytics'|'requests'|'newsletter'>('analytics')
  const [events,setEvents]=useState<EventRow[]>([]), [subscribers,setSubscribers]=useState<Subscriber[]>([]), [requests,setRequests]=useState<RequestRow[]>([])
  const [notice,setNotice]=useState(''), [busy,setBusy]=useState(true)
  const [campaign,setCampaign]=useState({subject:'',preview_text:'',headline:'',body:'',button_label:'Browse catalogue',button_url:'https://akayceeelectricals.com/products'})

  const load=useCallback(async()=>{if(!supabase)return;setBusy(true);const [e,s,r]=await Promise.all([supabase.from('analytics_events').select('*').order('created_at',{ascending:false}).limit(2000),supabase.from('newsletter_subscribers').select('*').order('created_at',{ascending:false}),supabase.from('customer_requests').select('*').order('created_at',{ascending:false})]);setEvents((e.data||[]) as EventRow[]);setSubscribers((s.data||[]) as Subscriber[]);setRequests((r.data||[]) as RequestRow[]);setBusy(false)},[])
  useEffect(()=>{void load()},[load])
  const metrics=useMemo(()=>({views:events.filter(e=>e.event_name==='product_view').length,whatsapp:events.filter(e=>e.event_name==='whatsapp_click').length,searches:events.filter(e=>e.event_name==='search').length,subscribers:subscribers.filter(s=>s.status==='confirmed').length}),[events,subscribers])
  const topProducts=useMemo(()=>Object.entries(events.filter(e=>e.product_slug).reduce<Record<string,number>>((a,e)=>{a[e.product_slug!]=(a[e.product_slug!]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]).slice(0,8),[events])
  const searchTerms=useMemo(()=>Object.entries(events.filter(e=>e.search_term).reduce<Record<string,number>>((a,e)=>{a[e.search_term!]=(a[e.search_term!]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]).slice(0,8),[events])
  const updateRequest=async(id:string,status:string)=>{if(!supabase)return;await supabase.from('customer_requests').update({status}).eq('id',id);await load()}
  const saveDraft=async(event:React.FormEvent)=>{event.preventDefault();if(!supabase)return;const {error}=await supabase.from('newsletter_campaigns').insert({...campaign,status:'draft',recipient_count:metrics.subscribers});setNotice(error?error.message:'Campaign saved as a draft. Connect the email delivery provider before sending.');if(!error)setCampaign({...campaign,subject:'',preview_text:'',headline:'',body:''})}
  return <div className="growth-panel">
    <div className="owner-section-heading"><div><p className="eyebrow text-gold-dark">Growth centre</p><h2>Enquiries and audience insights</h2><p>Privacy-conscious activity, customer requests and newsletter subscribers.</p></div></div>
    <div className="growth-tabs"><button className={tab==='analytics'?'active':''} onClick={()=>setTab('analytics')}><BarChart3 size={16}/>Analytics</button><button className={tab==='requests'?'active':''} onClick={()=>setTab('requests')}><MessageSquareText size={16}/>Requests <span>{requests.filter(r=>r.status==='new').length}</span></button><button className={tab==='newsletter'?'active':''} onClick={()=>setTab('newsletter')}><Mail size={16}/>Newsletter</button></div>
    {notice&&<div className="owner-notice"><Check size={16}/>{notice}</div>}
    {busy?<div className="owner-loading">Loading growth data…</div>:tab==='analytics'?<>
      <div className="metric-grid"><Metric label="Product views" value={metrics.views}/><Metric label="WhatsApp clicks" value={metrics.whatsapp}/><Metric label="Catalogue searches" value={metrics.searches}/><Metric label="Subscribers" value={metrics.subscribers}/></div>
      <div className="analytics-grid"><Rank title="Most viewed products" rows={topProducts}/><Rank title="Popular search terms" rows={searchTerms}/></div>
      <p className="data-note">Counts are based on anonymous session activity. No advertising trackers or personal browsing profiles are used.</p>
    </>:tab==='requests'?<div className="request-list">{requests.length?requests.map(r=><article key={r.id}><div><span className="request-type">{r.request_type.replace('_',' ')}</span><h3>{r.name}</h3><p>{r.details}</p>{r.items?.length>0&&<small>{r.items.map(i=>`${i.quantity}× ${i.name}`).join(' · ')}</small>}</div><div className="request-contact"><a href={`tel:${r.phone}`}>{r.phone}</a>{r.email&&<a href={`mailto:${r.email}`}>{r.email}</a>}<time>{new Date(r.created_at).toLocaleDateString()}</time><select value={r.status} onChange={e=>void updateRequest(r.id,e.target.value)}><option>new</option><option>contacted</option><option>completed</option><option>closed</option></select></div></article>):<div className="empty-panel">No customer requests yet.</div>}</div>:<div className="newsletter-admin-grid">
      <section className="subscriber-panel"><div><Users size={22}/><h3>{metrics.subscribers} confirmed subscribers</h3></div><div className="subscriber-list">{subscribers.map(s=><div key={s.id}><span>{s.email}</span><span className={`subscriber-status ${s.status}`}>{s.status}</span></div>)}</div></section>
      <form className="campaign-form" onSubmit={saveDraft}><h3>Create newsletter campaign</h3><label>Subject<input required value={campaign.subject} onChange={e=>setCampaign({...campaign,subject:e.target.value})}/></label><label>Inbox preview<input value={campaign.preview_text} onChange={e=>setCampaign({...campaign,preview_text:e.target.value})}/></label><label>Headline<input required value={campaign.headline} onChange={e=>setCampaign({...campaign,headline:e.target.value})}/></label><label>Message<textarea required rows={7} value={campaign.body} onChange={e=>setCampaign({...campaign,body:e.target.value})}/></label><div className="owner-form-grid"><label>Button text<input value={campaign.button_label} onChange={e=>setCampaign({...campaign,button_label:e.target.value})}/></label><label>Button link<input type="url" value={campaign.button_url} onChange={e=>setCampaign({...campaign,button_url:e.target.value})}/></label></div><button className="button button-dark"><Send size={16}/>Save campaign draft</button><small>Email delivery will be activated through a dedicated provider so subscriber addresses and sending credentials remain secure.</small></form>
    </div>}
  </div>
}

function Metric({label,value}:{label:string;value:number}){return <article><strong>{value.toLocaleString()}</strong><span>{label}</span></article>}
function Rank({title,rows}:{title:string;rows:[string,number][]}){return <section><h3>{title}</h3>{rows.length?rows.map(([name,count],i)=><div className="rank-row" key={name}><span>{i+1}</span><strong>{name.replace(/-/g,' ')}</strong><em>{count}</em></div>):<p className="empty-copy">Insights will appear as customers use the website.</p>}</section>}

