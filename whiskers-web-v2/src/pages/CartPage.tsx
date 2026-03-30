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
      <h1 className="text-2xl font-semibold text-gelato-deep">
        Cart
      </h1>
      {items.length === 0 ? (
        <p className="mt-6 text-foreground/70">
          Your cart is empty.{' '}
          <Link
            to="/today"
            className="font-medium text-gelato-deep underline-offset-2 hover:underline"
          >
            Browse today’s menu
          </Link>
        </p>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {items.map((line) => (
              <li
                key={line.flavourId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/80 bg-white/55 px-4 py-3 shadow-sm backdrop-blur"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {line.name}
                  </p>
                  <p className="text-sm text-foreground/60">
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
                    className="w-16 rounded-xl border border-border/80 bg-white/60 px-2 py-1 text-sm backdrop-blur"
                    value={line.quantity}
                    onChange={(e) =>
                      setQuantity(line.flavourId, Number(e.target.value) || 0)
                    }
                  />
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => remove(line.flavourId)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex items-center justify-between border-t border-border/80 pt-4">
            <span className="font-medium text-foreground">
              Total
            </span>
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {formatUsd(total)}
            </span>
          </div>
          <Link
            to="/checkout"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gelato-deep px-4 py-3 text-sm font-semibold text-gelato-cream shadow-sm transition hover:brightness-95"
          >
            Checkout
          </Link>
        </>
      )}
    </div>
  )
}
