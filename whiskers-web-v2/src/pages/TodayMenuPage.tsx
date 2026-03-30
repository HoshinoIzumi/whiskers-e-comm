import { Link } from 'react-router-dom'
import { useTodayMenu } from '../hooks/useTodayMenu'
import { useCartStore } from '../stores/cartStore'

function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export default function TodayMenuPage() {
  const add = useCartStore((s) => s.add)
  const { data, isPending, isError } = useTodayMenu()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Today’s menu
      </h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        These are the flavours currently available for checkout.
      </p>

      {isPending && <p className="mt-6 text-stone-500">Loading…</p>}

      {isError && (
        <p className="mt-6 text-red-600">
          Could not reach API. Ensure `whiskers-api` is running and{' '}
          <code>VITE_API_URL</code> is set.
        </p>
      )}

      {data && (
        <>
          {data.length === 0 ? (
            <p className="mt-6 text-stone-500">
              No items on today’s menu. Staff can set it in admin.
            </p>
          ) : (
            <ul className="mt-6 space-y-2 text-left">
              {data.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 px-4 py-3 dark:border-stone-700"
                >
                  <div>
                    <span className="font-medium">{f.name}</span>
                    <span className="ml-2 text-stone-500">
                      {formatUsd(f.priceCents)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500"
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

      <p className="mt-2 text-sm text-stone-500">
        <Link
          to="/flavours"
          className="font-medium text-amber-700 hover:underline dark:text-amber-400"
        >
          Browse all flavours
        </Link>
      </p>
    </div>
  )
}

