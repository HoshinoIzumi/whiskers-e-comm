import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'
import { useFlavours } from '../hooks/useFlavours'
import { useTodayMenu } from '../hooks/useTodayMenu'

export default function FlavoursPage() {
  const add = useCartStore((s) => s.add)
  const [search, setSearch] = useState('')

  const { data, isPending, isError } = useFlavours({
    page: 1,
    limit: 100,
    search: search.trim() || undefined,
  })

  const { data: todayMenu } = useTodayMenu()

  const todayIds = useMemo(() => {
    return new Set((todayMenu ?? []).map((f) => f.id))
  }, [todayMenu])

  const flavours = data?.data ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Flavours
      </h1>
      <p className="mt-2 text-foreground/70">
        Browse all active flavours. Only flavours on today’s menu can be
        ordered.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-foreground/80">
          Search
        </label>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="e.g. chocolate"
          className="w-full max-w-xs rounded-2xl border border-border/80 bg-white/60 px-3 py-2 text-foreground shadow-sm backdrop-blur"
        />
        <Link
          to="/today"
          className="text-sm font-medium text-gelato-deep hover:underline"
        >
          Today’s menu →
        </Link>
      </div>

      {isPending && <p className="mt-6 text-stone-500">Loading…</p>}
      {isError && (
        <p className="mt-6 text-red-600">
          Could not reach API. Ensure `whiskers-api` is running and{' '}
          <code>VITE_API_URL</code> is set.
        </p>
      )}

      {data && (
        <>
          {flavours.length === 0 ? (
            <p className="mt-6 text-foreground/60">
              No flavours match your search.
            </p>
          ) : (
            <ul className="mt-6 space-y-2 text-left">
              {flavours.map((f) => {
                const isOnToday = todayIds.has(f.id)
                return (
                  <li
                    key={f.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-white/55 px-4 py-3 shadow-sm backdrop-blur"
                  >
                    <div className="min-w-[180px]">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium">
                          <Link
                            to={`/flavours/${f.id}`}
                            className="hover:underline"
                          >
                            {f.name}
                          </Link>
                        </span>
                        {isOnToday ? (
                          <span className="rounded bg-gelato-blue/20 px-2 py-0.5 text-xs font-medium text-gelato-deep">
                            Today
                          </span>
                        ) : (
                          <span className="rounded bg-gelato-pink/20 px-2 py-0.5 text-xs font-medium text-foreground/80">
                            Not today
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-foreground/60">
                        ${(f.priceCents / 100).toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!isOnToday}
                      className="rounded-full bg-gelato-deep px-3 py-1.5 text-sm font-medium text-gelato-cream shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() =>
                        add({
                          flavourId: f.id,
                          name: f.name,
                          unitPriceCents: f.priceCents,
                          quantity: 1,
                        })
                      }
                    >
                      {isOnToday ? 'Add to cart' : 'Unavailable'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      <p className="mt-8 text-sm text-foreground/60">
        <Link
          to="/cart"
          className="font-medium text-gelato-deep hover:underline"
        >
          View cart
        </Link>
      </p>
    </div>
  )
}
