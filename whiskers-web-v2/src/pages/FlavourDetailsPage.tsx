import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'
import { useFlavour } from '../hooks/useFlavour'
import { useTodayMenu } from '../hooks/useTodayMenu'

function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export default function FlavourDetailsPage() {
  const add = useCartStore((s) => s.add)
  const { id } = useParams<{ id: string }>()

  const { data: flavour, isPending, isError } = useFlavour(id)
  const { data: todayMenu } = useTodayMenu()

  const todayIds = useMemo(() => {
    return new Set((todayMenu ?? []).map((f) => f.id))
  }, [todayMenu])

  const canAdd = !!flavour && todayIds.has(flavour.id)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-stone-500">
        <Link to="/flavours" className="hover:underline">
          ← Back to flavours
        </Link>
      </p>

      {isPending && <p className="mt-6 text-stone-500">Loading…</p>}

      {isError && (
        <p className="mt-6 text-red-600">
          Could not load this flavour. Ensure `whiskers-api` is running.
        </p>
      )}

      {flavour && (
        <div className="mt-6 rounded-lg border border-stone-200 p-5 dark:border-stone-700">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                {flavour.name}
              </h1>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                {formatUsd(flavour.priceCents)}
              </p>

              {flavour.description && (
                <p className="mt-4 whitespace-pre-wrap text-sm text-stone-700 dark:text-stone-200">
                  {flavour.description}
                </p>
              )}

              {flavour.imageUrl && (
                <div className="mt-4">
                  <img
                    src={flavour.imageUrl}
                    alt={flavour.name}
                    className="h-56 w-full rounded-lg object-cover"
                  />
                </div>
              )}

              {flavour.categories?.length ? (
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {flavour.categories.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full bg-stone-100 px-3 py-1 text-stone-700 dark:bg-stone-800 dark:text-stone-200"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="w-full max-w-xs">
              <button
                type="button"
                disabled={!canAdd}
                className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() =>
                  add({
                    flavourId: flavour.id,
                    name: flavour.name,
                    unitPriceCents: flavour.priceCents,
                    quantity: 1,
                  })
                }
              >
                {canAdd ? 'Add to cart' : 'Not available for today'}
              </button>

              <p className="mt-3 text-xs text-stone-500">
                {canAdd
                  ? 'Ready to checkout on this menu.'
                  : 'This flavour exists, but is not currently on today’s menu.'}
              </p>

              <Link
                to="/cart"
                className="mt-4 block text-center text-sm font-medium text-amber-700 hover:underline dark:text-amber-400"
              >
                Go to cart →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

