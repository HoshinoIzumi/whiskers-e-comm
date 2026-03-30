import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useCartStore } from '../stores/cartStore'
import { useFlavours } from '../hooks/useFlavours'
import { useTodayMenu } from '../hooks/useTodayMenu'
import { getCategories } from '../lib/api'
import type { Dictionary, DictionaryLang } from '../lib/dictionary'
import { getDictionary } from '../lib/dictionary'

const CATEGORY_ORDER = ['signature', 'classic', 'premium', 'sorbet'] as const
type CategoryKey = (typeof CATEGORY_ORDER)[number]

function isCategoryKey(value: string): value is CategoryKey {
  return (CATEGORY_ORDER as readonly string[]).includes(value)
}

export default function FlavoursPage() {
  const location = useLocation()
  const params = useParams()
  const add = useCartStore((s) => s.add)
  const [search, setSearch] = useState('')

  const lang = useMemo<DictionaryLang>(() => {
    const raw = params.lang
    if (raw === 'zh') return 'zh'
    return location.pathname.startsWith('/zh') ? 'zh' : 'en'
  }, [location.pathname, params.lang])

  const [dict, setDict] = useState<Dictionary | null>(null)
  const [dictError, setDictError] = useState<string | null>(null)

  useEffect(() => {
    void getDictionary(lang)
      .then((d) => {
        setDict(d)
      })
      .catch((e) => {
        setDict(null)
        setDictError(e instanceof Error ? e.message : 'Failed to load dictionary')
      })
  }, [lang])

  const [selectedKey, setSelectedKey] = useState<CategoryKey | null>(null)
  const { data: categoriesData, isPending: categoriesPending } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  })

  const categoryKeyToCategoryId = useMemo(() => {
    const map: Partial<Record<CategoryKey, string>> = {}
    for (const c of categoriesData ?? []) {
      if (isCategoryKey(c.slug)) {
        map[c.slug] = c.id
      }
    }
    return map
  }, [categoriesData])

  const selectedCategoryId = selectedKey
    ? categoryKeyToCategoryId[selectedKey]
    : undefined

  const { data, isPending, isError } = useFlavours({
    page: 1,
    limit: 100,
    categoryId: selectedCategoryId,
    search: search.trim() || undefined,
  })

  const { data: todayMenu } = useTodayMenu()

  const todayIds = useMemo(() => {
    return new Set((todayMenu ?? []).map((f) => f.id))
  }, [todayMenu])

  const flavours = data?.data ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start gap-8">
        <aside className="w-full max-w-[320px]">
          <div className="rounded-2xl border border-border/80 bg-white/55 p-4 shadow-sm backdrop-blur">
            <h2 className="text-lg font-black text-gelato-deep">
              {lang === 'zh' ? '分类' : 'Categories'}
            </h2>

            {categoriesPending && <p className="mt-2 text-foreground/60">Loading…</p>}
            {!categoriesPending && dict && (
              <div className="mt-4 space-y-2">
                {CATEGORY_ORDER.map((key) => {
                  const cat = dict.flavours.categories[key]
                  const id = categoryKeyToCategoryId[key]
                  const active = selectedKey === key
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!id}
                      onClick={() => setSelectedKey((cur) => (cur === key ? null : key))}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${
                        active
                          ? 'bg-gelato-deep text-gelato-cream'
                          : 'bg-white/40 text-foreground hover:bg-gelato-blue/10'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <span className="flex items-center gap-2">
                        {cat.sticker ? (
                          <img
                            src={cat.sticker}
                            alt={cat.title}
                            className="h-6 w-6"
                            draggable={false}
                          />
                        ) : null}
                        <span className="text-sm font-semibold">{cat.title}</span>
                      </span>
                      <span className="text-xs opacity-80">{active ? '✓' : ''}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="mt-5">
              <Link
                to={lang === 'zh' ? '/zh/today' : '/en/today'}
                className="font-medium text-gelato-deep hover:underline"
              >
                {lang === 'zh' ? '今日供应 →' : 'Today’s menu →'}
              </Link>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <h1 className="text-3xl font-black text-gelato-deep md:text-5xl">
            {dict?.flavours.title ?? 'Flavours'}
          </h1>
          <p className="mt-2 text-foreground/70">
            {dict?.flavours.subtitle ?? ''}
          </p>

          <div className="mt-6">
            <label className="text-sm font-medium text-foreground/80">
              {lang === 'zh' ? '搜索' : 'Search'}
            </label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'zh' ? '搜索口味/描述' : 'Search flavours'}
              className="mt-2 w-full rounded-2xl border border-border/80 bg-white/60 px-4 py-3 text-foreground shadow-sm backdrop-blur"
            />
          </div>

          {dictError && <p className="mt-6 text-red-600">{dictError}</p>}
          {isPending && <p className="mt-6 text-foreground/60">Loading…</p>}
          {isError && (
            <p className="mt-6 text-red-600">
              Could not reach API. Ensure `whiskers-api` is running and{' '}
              <code>VITE_API_URL</code> is set.
            </p>
          )}

          {data && (
            <div className="mt-8 space-y-3">
              {flavours.length === 0 ? (
                <p className="text-foreground/60">
                  {search
                    ? lang === 'zh'
                      ? '没有匹配的口味'
                      : 'No flavours found matching your search.'
                    : lang === 'zh'
                      ? '没有可用口味'
                      : 'No flavours available.'}
                </p>
              ) : (
                flavours.map((f) => {
                  const isOnToday = todayIds.has(f.id)
                  const tagKeys = f.categories
                    .map((c) => c.slug)
                    .filter(isCategoryKey)

                  return (
                    <div
                      key={f.id}
                      className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border/80 bg-white/55 px-4 py-4 shadow-sm backdrop-blur"
                    >
                      <div className="min-w-[240px]">
                        <h3 className="text-lg font-black text-gelato-deep">
                          <Link
                            to={`/${lang}/flavours/${f.id}`}
                            className="hover:underline"
                          >
                            {f.name}
                          </Link>
                        </h3>

                        <div className="mt-1 text-sm text-foreground/60">
                          ${(f.priceCents / 100).toFixed(2)}
                        </div>

                        {tagKeys.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {tagKeys.map((key) => {
                              const cat = dict?.flavours.categories[key]
                              return (
                                <span
                                  key={key}
                                  className="rounded-full bg-gelato-yellow/30 px-3 py-1 text-xs font-semibold text-gelato-deep"
                                >
                                  {cat?.title ?? key}
                                </span>
                              )
                            })}
                          </div>
                        ) : null}

                        {f.description ? (
                          <p className="mt-3 text-sm text-foreground/70">
                            {f.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <button
                          type="button"
                          disabled={!isOnToday}
                          className="rounded-full bg-gelato-deep px-4 py-2 text-sm font-semibold text-gelato-cream shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() =>
                            add({
                              flavourId: f.id,
                              name: f.name,
                              unitPriceCents: f.priceCents,
                              quantity: 1,
                            })
                          }
                        >
                          {isOnToday
                            ? lang === 'zh'
                              ? '加入购物车'
                              : 'Add to cart'
                            : lang === 'zh'
                              ? '当前不可选'
                              : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          <div className="mt-10 flex items-center justify-between gap-4">
            <Link
              to={lang === 'zh' ? '/zh/cart' : '/en/cart'}
              className="font-medium text-gelato-deep hover:underline"
            >
              {lang === 'zh' ? '查看购物车' : 'View cart'} →
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
