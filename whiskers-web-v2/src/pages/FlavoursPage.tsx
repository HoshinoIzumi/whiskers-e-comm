import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useCartStore } from '../stores/cartStore'

type FlavourRow = {
  id: string
  name: string
  priceCents: number
}

type MenuResponse = {
  items: { sortOrder: number; flavour: FlavourRow }[]
}

export default function FlavoursPage() {
  const add = useCartStore((s) => s.add)

  const { data, isPending, isError } = useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      const { data } = await api.get<MenuResponse>('/menu')
      return data
    },
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Today’s menu
      </h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        From{' '}
        <code className="rounded bg-stone-200 px-1 dark:bg-stone-800">
          GET /menu
        </code>
        — only these flavours can be ordered at checkout.
      </p>
      {isPending && <p className="mt-6 text-stone-500">Loading…</p>}
      {isError && (
        <p className="mt-6 text-red-600">
          Could not reach API. Ensure `whiskers-api` is running and{' '}
          <code>VITE_API_URL</code> is set.
        </p>
      )}
      {data && (
        <ul className="mt-6 space-y-2 text-left">
          {data.items.length === 0 && (
            <li className="text-stone-500">
              No items on today’s menu. Staff can set it in admin.
            </li>
          )}
          {data.items.map(({ flavour: f }) => (
            <li
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 px-4 py-3 dark:border-stone-700"
            >
              <div>
                <span className="font-medium">{f.name}</span>
                <span className="ml-2 text-stone-500">
                  ${(f.priceCents / 100).toFixed(2)}
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
