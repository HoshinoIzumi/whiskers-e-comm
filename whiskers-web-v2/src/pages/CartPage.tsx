import { Link } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'

function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const remove = useCartStore((s) => s.remove)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const total = useCartStore((s) => s.getTotalCents)()

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Cart
      </h1>
      {items.length === 0 ? (
        <p className="mt-6 text-stone-600 dark:text-stone-400">
          Your cart is empty.{' '}
          <Link
            to="/flavours"
            className="font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
          >
            Browse flavours
          </Link>
        </p>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {items.map((line) => (
              <li
                key={line.flavourId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 px-4 py-3 dark:border-stone-700"
              >
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">
                    {line.name}
                  </p>
                  <p className="text-sm text-stone-500">
                    {formatUsd(line.unitPriceCents)} each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`qty-${line.flavourId}`}>
                    Quantity
                  </label>
                  <input
                    id={`qty-${line.flavourId}`}
                    type="number"
                    min={1}
                    className="w-16 rounded border border-stone-300 bg-white px-2 py-1 text-sm dark:border-stone-600 dark:bg-stone-900"
                    value={line.quantity}
                    onChange={(e) =>
                      setQuantity(line.flavourId, Number(e.target.value) || 0)
                    }
                  />
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:underline dark:text-red-400"
                    onClick={() => remove(line.flavourId)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-4 dark:border-stone-700">
            <span className="font-medium text-stone-800 dark:text-stone-200">
              Total
            </span>
            <span className="text-lg font-semibold tabular-nums text-stone-900 dark:text-stone-100">
              {formatUsd(total)}
            </span>
          </div>
          <Link
            to="/checkout"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500"
          >
            Checkout
          </Link>
        </>
      )}
    </div>
  )
}
