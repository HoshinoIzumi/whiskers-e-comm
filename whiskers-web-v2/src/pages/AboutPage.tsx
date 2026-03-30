import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import type { Dictionary, DictionaryLang } from '../lib/dictionary'
import { getDictionary } from '../lib/dictionary'

export default function AboutPage() {
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

  const tagline = dict.site?.tagline ?? 'Freshly churned happiness.'
  const shopName = dict.site?.shopName ?? 'Whiskers Gelato'
  const address = dict.site?.address ?? ''
  const hours = dict.site?.hours

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-black text-gelato-deep drop-shadow-sm">
        {shopName}
      </h1>
      <p className="mt-2 text-foreground/70">{tagline}</p>

      <div className="mt-6 rounded-2xl border border-border/80 bg-white/55 p-5 shadow-sm backdrop-blur">
        <h2 className="text-lg font-semibold text-foreground">Address</h2>
        <p className="mt-1 whitespace-pre-wrap text-foreground/80">
          {address}
        </p>

        {hours && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-foreground">Hours</h2>
            <ul className="mt-2 space-y-1 text-foreground/80">
              {Object.entries(hours).map(([k, v]) => (
                <li key={k} className="flex gap-3">
                  <span className="capitalize">{k.replace(/_/g, ' ')}</span>
                  <span className="ml-auto">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

