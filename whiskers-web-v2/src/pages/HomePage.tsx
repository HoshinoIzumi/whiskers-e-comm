import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { DictionaryLang, Dictionary } from '../lib/dictionary'
import { getDictionary } from '../lib/dictionary'

export default function HomePage() {
  const params = useParams()
  const location = useLocation()
  const lang = useMemo<DictionaryLang>(() => {
    const raw = params.lang
    if (raw === 'zh') return 'zh'
    return location.pathname.startsWith('/zh') ? 'zh' : 'en'
  }, [location.pathname, params.lang])

  const [dict, setDict] = useState<Dictionary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getDictionary(lang)
      .then((d) => {
        setDict(d)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load dictionary')
        setDict(null)
      })
  }, [lang])

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-red-600">
        {error}
      </div>
    )
  }

  if (!dict) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-foreground/70">
        Loading…
      </div>
    )
  }

  return (
    <div className="bg-gelato-cream flex min-h-screen flex-col">
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-16">
        {/* Decorative background elements */}
        <div className="bg-gelato-blue/30 absolute top-[-5%] right-[-5%] -z-10 h-[35%] w-[35%] animate-pulse rounded-full blur-[120px]" />
        <div className="bg-gelato-pink/40 absolute bottom-[-5%] left-[-5%] -z-10 h-[35%] w-[35%] animate-pulse rounded-full blur-[120px]" />

        <div className="flex w-full max-w-5xl flex-col items-center gap-8 text-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white bg-white/60 px-4 py-2 shadow-sm backdrop-blur-md">
              <span className="text-gelato-deep text-xs font-black tracking-[0.2em] uppercase">
                {dict.home.badge}
              </span>
            </div>

            <h1 className="text-gelato-deep text-5xl leading-[0.9] font-black tracking-tighter italic drop-shadow-[0_4px_4px_rgba(39,145,203,0.1)] md:text-9xl">
              Whiskers <br />
              <span className="text-white drop-shadow-[0_2px_10px_rgba(170,224,251,0.5)]">
                Gelato
              </span>
            </h1>
          </div>

          {/* Visual Highlight - Sticker */}
          <div className="relative mt-0 flex aspect-square w-full max-w-[280px] items-center justify-center md:mt-4 md:aspect-video md:max-w-2xl">
            <div className="from-gelato-pink/10 via-gelato-yellow/10 to-gelato-blue/10 absolute -inset-8 -z-10 rounded-[5rem] bg-gradient-to-tr opacity-50 blur-3xl" />
            <div className="relative h-full w-full drop-shadow-[0_20px_50px_rgba(39,145,203,0.15)]">
              <img
                src="/images/stickers/fridge.svg"
                alt={dict.home.fridge_alt}
                className="h-full w-full object-contain"
                draggable={false}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8">
            <Link
              to={`/${lang}/flavours`}
              className="group bg-gelato-deep relative overflow-hidden rounded-full px-12 py-6 font-black text-white shadow-[0_10px_30px_rgba(39,145,203,0.3)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(39,145,203,0.4)]"
            >
              <span className="relative z-10">{dict.home.explore_btn}</span>
              <div className="bg-gelato-blue absolute inset-0 translate-x-full transition-transform duration-500 group-hover:translate-x-0" />
            </Link>

            <Link
              to={`/${lang}/about`}
              className="text-gelato-deep border-gelato-blue rounded-full border-2 bg-white px-12 py-6 font-black shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
            >
              {dict.home.visit_btn}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
