import { Link, useLocation, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useTodayMenu } from '../hooks/useTodayMenu'
import { useCartStore } from '../stores/cartStore'
import type { Dictionary, DictionaryLang } from '../lib/dictionary'
import { getDictionary } from '../lib/dictionary'

const CATEGORY_ORDER = ['signature', 'classic', 'premium', 'sorbet'] as const
function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export default function TodayMenuPage() {
  const location = useLocation()
  const params = useParams()
  const add = useCartStore((s) => s.add)
  const { data, isPending, isError } = useTodayMenu()

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

  const categoryGroups = useMemo(() => {
    const flavours = data ?? []
    return CATEGORY_ORDER.map((key) => {
      const items = flavours.filter((f) =>
        f.categories.some((c) => c.slug === key),
      )
      return { key, items }
    })
  }, [data])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black text-gelato-deep md:text-5xl">
        {lang === 'zh' ? '今日供应' : "Today's Scoops"}
      </h1>
      <p className="mt-2 text-foreground/70">
        {lang === 'zh'
          ? '快来看看今天店里有哪些新鲜制作的 Gelato！'
          : 'Checkout what freshly churned limited gelato we are scooping today!'}
      </p>

      {(isPending || !dict) && (
        <p className="mt-6 text-foreground/60">Loading…</p>
      )}

      {error && <p className="mt-6 text-red-600">{error}</p>}

      {isError && (
        <p className="mt-6 text-red-600">
          Could not reach API. Ensure `whiskers-api` is running and{' '}
          <code>VITE_API_URL</code> is set.
        </p>
      )}

      {dict && (
        <div className="mt-10 space-y-10">
          {categoryGroups.map(({ key, items }) => {
            if (items.length === 0) return null
            const cat = dict.flavours.categories[key]
            return (
              <section key={key}>
                {cat.sticker ? (
                  <div className="mb-4">
                    <img
                      src={cat.sticker}
                      alt={cat.title}
                      className="h-16 w-auto"
                      draggable={false}
                    />
                  </div>
                ) : null}
                <h2 className="text-2xl font-black text-gelato-deep">
                  {cat.title}
                  {cat.price_suffix ? (
                    <span className="ml-2 text-gelato-blue">
                      {cat.price_suffix}
                    </span>
                  ) : null}
                </h2>

                <ul className="mt-4 space-y-2 text-left">
                  {items.map((f) => (
                    <li
                      key={f.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-white/55 px-4 py-3 shadow-sm backdrop-blur"
                    >
                      <div>
                        <span className="font-medium">{f.name}</span>
                        <span className="ml-2 text-foreground/60">
                          {formatUsd(f.priceCents)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="rounded-full bg-gelato-deep px-3 py-1.5 text-sm font-medium text-gelato-cream shadow-sm transition hover:brightness-95"
                        onClick={() =>
                          add({
                            flavourId: f.id,
                            name: f.name,
                            unitPriceCents: f.priceCents,
                            quantity: 1,
                          })
                        }
                      >
                        Add to cart
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <Link
              to={lang === 'zh' ? '/zh/cart' : '/en/cart'}
              className="font-medium text-gelato-deep hover:underline"
            >
              {lang === 'zh' ? '查看购物车' : 'View cart'} →
            </Link>
            <Link
              to={lang === 'zh' ? '/zh/flavours' : '/en/flavours'}
              className="font-medium text-gelato-deep hover:underline"
            >
              {lang === 'zh'
                ? '查看口味图鉴'
                : 'Explore our entire flavour library'}{' '}
              →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

