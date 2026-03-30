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
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        Browse all active flavours. Only flavours on today’s menu can be
        ordered.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
          Search
        </label>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="e.g. chocolate"
          className="w-full max-w-xs rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
        <Link
          to="/today"
          className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-400"
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
            <p className="mt-6 text-stone-500">
              No flavours match your search.
            </p>
          ) : (
            <ul className="mt-6 space-y-2 text-left">
              {flavours.map((f) => {
                const isOnToday = todayIds.has(f.id)
                return (
                  <li
                    key={f.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 px-4 py-3 dark:border-stone-700"
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
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Today
                          </span>
                        ) : (
                          <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600 dark:bg-stone-800/40 dark:text-stone-300">
                            Not today
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-stone-500">
                        ${(f.priceCents / 100).toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!isOnToday}
                      className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
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

      <p className="mt-8 text-sm text-stone-500">
        <Link
          to="/cart"
          className="font-medium text-amber-700 hover:underline dark:text-amber-400"
        >
          View cart
        </Link>
      </p>
    </div>
  )
}
