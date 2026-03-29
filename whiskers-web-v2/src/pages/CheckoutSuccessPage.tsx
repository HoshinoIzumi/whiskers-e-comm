import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { getOrder } from '../lib/api'

function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export default function CheckoutSuccessPage() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId!),
    enabled: !!orderId,
    refetchInterval: (query) =>
      query.state.data?.status === 'PENDING' ? 4000 : false,
  })

  if (!orderId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="text-stone-600 dark:text-stone-400">Missing order id.</p>
        <Link
          to="/"
          className="mt-4 inline-block text-amber-700 hover:underline dark:text-amber-400"
        >
          Home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Thank you
      </h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        Order <span className="font-mono text-sm">{orderId}</span>
      </p>

      {isPending && (
        <p className="mt-6 text-stone-500">Loading order status…</p>
      )}
      {isError && (
        <p className="mt-6 text-red-600">
          Could not load the order.{' '}
          <button
            type="button"
            className="underline"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </p>
      )}
      {data && (
        <div className="mt-6 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900/40">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">Status</span>
            <span className="font-semibold uppercase tracking-wide text-stone-900 dark:text-stone-100">
              {data.status}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-stone-500">Total</span>
            <span className="tabular-nums font-medium">
              {formatUsd(data.totalCents)}
            </span>
          </div>
          {data.status === 'PENDING' && (
            <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
              Waiting for payment confirmation. This page refreshes while the
              order is pending. If you already paid in Square Sandbox, the
              webhook may take a few seconds.
            </p>
          )}
          {data.status === 'PAID' && (
            <p className="mt-4 text-sm text-emerald-800 dark:text-emerald-400/90">
              Payment received. We’ll prepare your order.
            </p>
          )}
        </div>
      )}

      <Link
        to="/flavours"
        className="mt-8 inline-block text-sm font-medium text-amber-700 hover:underline dark:text-amber-400"
      >
        Continue shopping
      </Link>
    </div>
  )
}
