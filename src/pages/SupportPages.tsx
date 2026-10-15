import { ArrowDown, ArrowRight, ArrowUpRight, Check, Mail, MapPin, Phone, Package, Cable, Wind, Wrench, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { WhatsAppLink } from '../components/WhatsAppLink'
import { InstagramIcon } from '../components/SocialIcons'
import { contact, setPageMeta } from '../lib/site'
import '../discovery.css'

export function ServicesPage() {
  useEffect(()=>setPageMeta('Supply & Services','Appliance supply, electrical materials and project support from A Kaycee Electricals in Ogba, Lagos.'),[])
  return <div className="discovery-page services-editorial">
    <section className="editorial-hero services-editorial-hero"><img src="/assets/heroes/services-planning-v1.webp" alt="Illustrative technician reviewing a home project plan beside appliances and installation materials" fetchPriority="high"/><div className="editorial-hero-shade"/>
      <div className="container editorial-hero-copy"><p className="eyebrow">Supply. Support. Sorted.</p><h1>Good spaces.<br/><span>Start here.</span></h1><p>From the first appliance to the finishing touches.<br/>Let’s find what your space needs.</p><div className="editorial-actions"><a href="#our-services" className="button button-dark">Explore services <ArrowDown size={17}/></a><WhatsAppLink variant="ghost" subject="Supply and project support">Talk to our team</WhatsAppLink></div></div><small className="editorial-photo-note">Illustrative project setting</small>
    </section>
    <section className="editorial-promise"><div className="container"><span><Check size={18}/> Homes & businesses</span><span><Check size={18}/> Single items & project lists</span><span><Check size={18}/> A real team in Ogba, Lagos</span></div></section>
    <section id="our-services" className="editorial-section"><div className="container"><div className="editorial-section-heading"><div><p className="eyebrow">What we can help with</p><h2>A little support.<br/>A lot of possibility.</h2></div><p>Tell us what you’re working on. We’ll help you explore suitable options and confirm the details before you decide.</p></div>
      <div className="editorial-services-grid">{[
        {icon:Package,title:'Appliances for everyday living',text:'TVs, refrigerators, washing machines and practical essentials for your home.',to:'/#categories',label:'Explore the range'},
        {icon:Cable,title:'Materials for the bigger picture',text:'Cables, switches, sockets and electrical materials for homes and projects.',to:'/category/electrical-materials',label:'Browse electricals'},
        {icon:Wind,title:'Comfort, room by room',text:'Explore air conditioners and fans. Ask us about capacity, placement and available models.',to:'/category/cooling',label:'Find your cooling'},
        {icon:Wrench,title:'Support beyond the selection',text:'Discuss installation or workmanship where applicable. Scope, availability and charges are agreed with the store.',to:'/contact',label:'Discuss your needs'},
      ].map((item,index)=><article key={item.title}><div className="editorial-service-top"><item.icon size={28} strokeWidth={1.5}/><span>0{index+1}</span></div><h3>{item.title}</h3><p>{item.text}</p><Link to={item.to}>{item.label}<ArrowRight size={18}/></Link></article>)}</div>
    </div></section>
    <section className="editorial-process"><div className="container"><div><p className="eyebrow">Easy from the start</p><h2>From your list.<br/>To your next step.</h2><WhatsAppLink variant="gold" subject="Help with a product or project list">Let’s talk <ArrowRight size={17}/></WhatsAppLink></div><ol>{[
      ['Tell us what you need','A product name, room requirements or your material list is a good place to start.'],
      ['Explore your options','We’ll discuss suitable models, available stock and any service requirements.'],
      ['Confirm the details','Agree pricing, collection or delivery arrangements directly with the store.'],
    ].map(([title,text],index)=><li key={title}><span>0{index+1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></div></section>
    <section className="editorial-quote"><div className="container editorial-quote-grid"><div className="editorial-quote-copy"><p className="eyebrow">Projects & bulk enquiries</p><h2>Big plans?<br/><span>Send us your list.</span></h2><p>Share your bill of quantities, appliance shortlist or project requirements on WhatsApp. We’ll take the conversation from there.</p><div className="editorial-actions"><WhatsAppLink subject="Request a quote for my project material list">Request a quote <ArrowRight size={17}/></WhatsAppLink><a href={contact.phoneHref} className="button button-ghost"><Phone size={17}/> Call the store</a></div></div><picture className="editorial-quote-image" aria-hidden="true"><source media="(min-width: 1024px)" srcSet="/assets/heroes/project-list-desktop-v1.webp"/><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" width={1200} height={900} loading="lazy"/></picture></div></section>
  </div>
}

export function ContactPage() {
  useEffect(()=>setPageMeta('Contact','Talk to A Kaycee Electricals on WhatsApp, call 08085565004 or visit 12 Ajayi Road, Ogba Okeira, Lagos.'),[])
  return <div className="discovery-page contact-editorial">
    <section className="editorial-hero contact-editorial-hero"><img src="/assets/heroes/contact-conversation-v1.webp" alt="Illustrative friendly customer consultation about home appliances" fetchPriority="high"/><div className="editorial-hero-shade"/>
      <div className="container editorial-hero-copy"><p className="eyebrow">People, not just products.</p><h1>Let’s find<br/><span>your answer.</span></h1><p>A product question. A project idea.<br/>We’re here for the conversation.</p><div className="editorial-actions"><WhatsAppLink subject="I would like to speak with your store team">Chat with us <ArrowRight size={17}/></WhatsAppLink><a href="#visit-store" className="button button-ghost">Find the store <ArrowDown size={17}/></a></div></div><small className="editorial-photo-note">Illustrative customer consultation</small>
    </section>
    <section className="editorial-contact-options"><div className="container"><a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={25}/><small>Start a conversation</small><strong>WhatsApp the team</strong><span>{contact.whatsappDisplay}<ArrowUpRight size={18}/></span></a><a href={contact.phoneHref}><Phone size={25}/><small>Prefer a quick call?</small><strong>Call the store</strong><span>{contact.phone}<ArrowUpRight size={18}/></span></a><a href={contact.instagram} target="_blank" rel="noreferrer"><InstagramIcon className="size-6"/><small>A closer look at the range</small><strong>Find us on Instagram</strong><span>@a_kaycee_electricals<ArrowUpRight size={18}/></span></a></div></section>
    <section id="visit-store" className="editorial-section editorial-visit"><div className="container editorial-visit-grid"><div><p className="eyebrow">Your local store</p><h2>Come say hello.<br/><span>We’re in Ogba.</span></h2><address><MapPin size={22}/><span>12 Ajayi Road,<br/>Ogba Okeira, Lagos State,<br/>Nigeria.</span></address><p>Looking for a particular model? Message or call before visiting so the team can confirm availability.</p><a className="button button-dark" href={contact.directions} target="_blank" rel="noreferrer">Get directions <ArrowUpRight size={17}/></a><a className="editorial-email" href={`mailto:${contact.email}`}><Mail size={18}/><span>{contact.email}</span></a></div>
      <div className="editorial-map-card"><iframe title="A Kaycee Electricals location — 12 Ajayi Road, Ogba Okeira, Lagos" src="https://maps.google.com/maps?q=12%20Ajayi%20Road%20Ogba%20Okeira%20Lagos&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/><a href={contact.directions} target="_blank" rel="noreferrer"><span><strong>A Kaycee Electricals</strong><small>Ogba Okeira · Lagos</small></span><ArrowUpRight size={22}/></a></div>
    </div></section>
    <section className="editorial-contact-note"><div className="container"><p className="eyebrow">Before you get in touch</p><h2>A few details go a long way.</h2><div>{[['Product enquiries','Share the product name or a screenshot, plus the size or capacity you need.'],['Project enquiries','Send your material list, quantities and any requirements you already have.'],['Visits & collection','Check availability and agree collection or delivery details with the team.']].map(([title,text])=><article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div><WhatsAppLink variant="gold" subject="I have a product enquiry">Let’s get started <ArrowRight size={17}/></WhatsAppLink></div></section>
  </div>
}
