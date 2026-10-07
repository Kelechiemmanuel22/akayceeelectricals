import React from 'react'

export function SectionIntro({
  eyebrow,
  title,
  children,
  inverted = false,
}: {
  eyebrow: string
  title: string
  children?: React.ReactNode
  inverted?: boolean
}) {
  return (
    <div className={`max-w-2xl ${inverted ? 'text-white' : 'text-ink'}`}>
      <p className={`eyebrow ${inverted ? 'text-gold' : 'text-gold-dark'}`}>{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight leading-tight sm:text-4xl">
        {title}
      </h2>
      {children && (
        <div
          className={`mt-4 max-w-xl text-base leading-relaxed ${
            inverted ? 'text-white/75' : 'text-ink/70'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  )
}