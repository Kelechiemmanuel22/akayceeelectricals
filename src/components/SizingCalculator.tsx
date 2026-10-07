import { useState } from 'react'
import { Wind, Zap, Check, ArrowRight } from 'lucide-react'
import { contact } from '../lib/site'
import { WhatsAppIcon } from './SocialIcons'

export function SizingCalculator() {
  const [tab, setTab] = useState<'ac' | 'cable'>('ac')

  // AC sizing state
  const [roomType, setRoomType] = useState<'bedroom' | 'living' | 'office' | 'hall'>('bedroom')
  const [roomSize, setRoomSize] = useState<number>(18) // in sqm

  // Cable estimator state
  const [application, setApplication] = useState<'lighting' | 'sockets' | 'ac15' | 'ac20' | 'cooker' | 'main'>('sockets')

  // AC Recommendation logic
  const getAcRecommendation = () => {
    let multiplier = 1
    if (roomType === 'living') multiplier = 1.15
    if (roomType === 'office') multiplier = 1.25
    if (roomType === 'hall') multiplier = 1.4

    const adjustedArea = roomSize * multiplier
    if (adjustedArea <= 14) return { hp: '1.0 HP', btu: '9,000 BTU', note: 'Ideal for standard compact bedrooms or private study rooms.' }
    if (adjustedArea <= 24) return { hp: '1.5 HP', btu: '12,000 BTU', note: 'Perfect for master bedrooms and medium-sized living spaces.' }
    if (adjustedArea <= 36) return { hp: '2.0 HP', btu: '18,000 BTU', note: 'Recommended for open living rooms, executive offices, and larger suites.' }
    return { hp: '2.5 HP – 3.0 HP', btu: '24,000+ BTU', note: 'Heavy-duty cooling for large commercial spaces, restaurants or halls.' }
  }

  // Cable Recommendation logic
  const getCableRecommendation = () => {
    switch (application) {
      case 'lighting':
        return { size: '1.5 mm² Electrical Cable', rating: '10A - 16A', desc: 'A starting point for lighting circuits. Confirm suitability with a qualified electrician.' }
      case 'sockets':
        return { size: '2.5 mm² Electrical Cable', rating: '20A - 25A', desc: 'A starting point for socket circuits. Confirm suitability with a qualified electrician.' }
      case 'ac15':
        return { size: '2.5 mm² or 4.0 mm² Dedicated Cable', rating: '25A - 32A', desc: 'Dedicated line from distribution box for 1.0HP to 1.5HP Split Air Conditioners.' }
      case 'ac20':
        return { size: '4.0 mm² Dedicated Cable', rating: '32A Breaker', desc: 'High-current dedicated feeder for 2.0HP – 3.0HP standing or split air conditioning units.' }
      case 'cooker':
        return { size: '6.0 mm² Heavy-Duty Cable', rating: '40A - 50A', desc: 'Electric cookers, ovens, instant water heaters and heavy kitchen equipment.' }
      case 'main':
        return { size: '10.0 mm² - 16.0 mm² Armoured / Mains Cable', rating: '60A - 100A Mains', desc: 'Main incoming supply cable from meter / changeover to internal distribution board.' }
    }
  }

  const acResult = getAcRecommendation()
  const cableResult = getCableRecommendation()

  const acWhatsappText = encodeURIComponent(
    `Hello A Kaycee Electricals, I used your AC sizing tool for a ${roomType} (${roomSize} m²). The guide suggested ${acResult.hp} (${acResult.btu}). What current brand options and prices can you share?`
  )

  const cableWhatsappText = encodeURIComponent(
    `Hello A Kaycee Electricals, I need an enquiry for ${cableResult.size} for ${application}. Please share the available options and current prices per roll.`
  )

  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xl shadow-ink/5 sm:p-8">
      {/* Tool Header & Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-ink/10 pb-6">
        <div>
          <span className="eyebrow text-gold-dark">Interactive Buyers Guide</span>
          <h3 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Sizing & Material Calculator
          </h3>
          <p className="mt-1 text-sm text-ink/60">
            Use this as a starting guide for cooling capacity or wiring sizes. Confirm electrical choices with a qualified electrician.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-full bg-sand p-1">
          <button
            type="button"
            onClick={() => setTab('ac')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
              tab === 'ac' ? 'bg-ink text-white shadow-md' : 'text-ink/70 hover:text-ink'
            }`}
          >
            <Wind size={15} /> AC Sizing
          </button>
          <button
            type="button"
            onClick={() => setTab('cable')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
              tab === 'cable' ? 'bg-ink text-white shadow-md' : 'text-ink/70 hover:text-ink'
            }`}
          >
            <Zap size={15} /> Cable Estimator
          </button>
        </div>
      </div>

      {/* Tab 1: AC Sizing */}
      {tab === 'ac' ? (
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="min-w-0 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                1. Select Room / Building Type
              </label>
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: 'bedroom', label: 'Bedroom' },
                  { id: 'living', label: 'Living Room' },
                  { id: 'office', label: 'Office' },
                  { id: 'hall', label: 'Open Hall' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRoomType(item.id as any)}
                    className={`rounded-xl border p-3 text-center text-xs font-bold transition-all ${
                      roomType === item.id
                        ? 'border-gold-dark bg-gold/10 text-ink shadow-xs ring-1 ring-gold'
                        : 'border-ink/15 bg-cream text-ink/70 hover:border-ink/30'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="uppercase tracking-wider text-ink/70">2. Estimated Floor Area</span>
                <span className="text-sm font-extrabold text-gold-dark">{roomSize} m² (~{Math.round(roomSize * 10.764)} sq ft)</span>
              </div>
              <input
                type="range"
                min="8"
                max="60"
                step="2"
                value={roomSize}
                onChange={(e) => setRoomSize(Number(e.target.value))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-sand accent-gold-dark"
              />
              <div className="mt-1 flex justify-between text-[11px] text-ink/40">
                <span>Small Bedroom (8-12m²)</span>
                <span>Standard Room (18-24m²)</span>
                <span>Large Space (35-60m²)</span>
              </div>
            </div>
          </div>

          {/* Recommendation Box */}
          <div className="min-w-0 rounded-2xl border border-gold/30 bg-gradient-to-br from-sand/80 to-cream p-6">
            <span className="eyebrow text-gold-dark">Recommended Cooling Capacity</span>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold text-ink sm:text-5xl">{acResult.hp}</span>
              <span className="text-sm font-semibold text-ink/60">({acResult.btu})</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">{acResult.note}</p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-ink/70">
              <span className="flex items-center gap-1 rounded-md bg-white px-2.5 py-1 border border-ink/10">
                <Check size={14} className="text-whatsapp" /> Inverter & Non-Inverter
              </span>
              <span className="flex items-center gap-1 rounded-md bg-white px-2.5 py-1 border border-ink/10">
                <Check size={14} className="text-whatsapp" /> Ask about installation materials
              </span>
            </div>

            <a
              href={`https://wa.me/${contact.whatsapp}?text=${acWhatsappText}`}
              target="_blank"
              rel="noreferrer"
              className="button button-whatsapp mt-6 w-full shadow-md shadow-whatsapp/20"
            >
              <WhatsAppIcon className="size-4" />
              Inquire {acResult.hp} AC Prices on WhatsApp
            </a>
          </div>
        </div>
      ) : (
        /* Tab 2: Cable Estimator */
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="min-w-0 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
              Select Your Electrical Load / Application
            </label>
            <div className="grid gap-2">
              {[
                { id: 'lighting', title: 'Lighting Points & Ceiling Fans', subtitle: 'Standard indoor & outdoor fixtures' },
                { id: 'sockets', title: 'Power Sockets & General Appliances', subtitle: 'TV, Fridge, Home Electronics' },
                { id: 'ac15', title: '1.0HP – 1.5HP Air Conditioners', subtitle: 'Dedicated circuit line' },
                { id: 'ac20', title: '2.0HP – 3.0HP Air Conditioners', subtitle: 'Heavy-duty cooling line' },
                { id: 'cooker', title: 'Electric Cooker / Instant Water Heater', subtitle: 'High load residential appliance' },
                { id: 'main', title: 'Main Incoming Feeder Cable', subtitle: 'Meter to distribution panel' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setApplication(item.id as any)}
                  className={`flex items-start justify-between rounded-xl border p-3 text-left transition-all ${
                    application === item.id
                      ? 'border-gold-dark bg-gold/10 text-ink ring-1 ring-gold'
                      : 'border-ink/15 bg-cream text-ink/70 hover:border-ink/30'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-ink">{item.title}</div>
                    <div className="text-[11px] text-ink/60">{item.subtitle}</div>
                  </div>
                  {application === item.id && (
                    <span className="size-2 rounded-full bg-gold-dark mt-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Recommendation Box */}
          <div className="min-w-0 rounded-2xl border border-gold/30 bg-gradient-to-br from-sand/80 to-cream p-6">
            <span className="eyebrow text-gold-dark">Recommended Cable Specification</span>
            <div className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {cableResult.size}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink/70">{cableResult.desc}</p>

            <div className="mt-4 rounded-xl border border-ink/10 bg-white p-3 text-xs text-ink/75">
              <span className="font-bold text-ink">Circuit Protection Rating:</span> {cableResult.rating}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink/55">Guide only. A qualified electrician should confirm cable size, protection and installation requirements.</p>

            <a
              href={`https://wa.me/${contact.whatsapp}?text=${cableWhatsappText}`}
              target="_blank"
              rel="noreferrer"
              className="button button-whatsapp mt-6 w-full shadow-md shadow-whatsapp/20"
            >
              <WhatsAppIcon className="size-4" />
              Inquire Cable Prices on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
