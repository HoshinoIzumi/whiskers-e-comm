import { useMemo, useState } from 'react'
import type { PublicOrder } from '../lib/api'
import { useOrders } from '../hooks/useOrders'
import { useAuthStore } from '../stores/authStore'

function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function statusTone(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
    case 'READY':
      return 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
    case 'PREPARING':
      return 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
    case 'PAID':
      return 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
    case 'CANCELLED':
      return 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
    case 'PENDING':
    default:
      return 'bg-stone-100 text-stone-700 dark:bg-stone-800/40 dark:text-stone-200'
  }
}

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user)
  const [page, setPage] = useState(1)

  const {
    data,
    isPending,
    isError,
    refetch,
  } = useOrders({ page, limit: 20 })

  const orders = data?.data ?? []

  const hasPending = useMemo(() => {
    return orders.some((o) => o.status === 'PENDING')
  }, [orders])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
          Orders
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            Refresh
          </button>
        </div>
      </div>

      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        Signed in as <code>{user?.email}</code>
      </p>

      {hasPending && (
        <p className="mt-2 text-sm text-stone-500">
          Some orders are pending. Refresh the page if updates take a few
          seconds.
        </p>
      )}

      {isPending && <p className="mt-6 text-stone-500">Loading…</p>}
      {isError && (
        <p className="mt-6 text-red-600">
          Could not load orders. Ensure your session is valid.
        </p>
      )}

      {data && orders.length === 0 && (
        <p className="mt-6 text-stone-500">No orders yet.</p>
      )}

      {data && orders.length > 0 && (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} statusTone={statusTone} />
          ))}
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            Prev
          </button>
          <span className="text-sm text-stone-500">
            Page {data.meta.page} / {data.meta.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function OrderCard({
  order,
  statusTone: tone,
}: {
  order: PublicOrder
  statusTone: (s: string) => string
}) {
  return (
    <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-stone-500">
              {order.id}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase ${tone(
                order.status,
              )}`}
            >
              {order.status}
            </span>
          </div>
          <div className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Total
          </div>
          <div className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {formatUsd(order.totalCents)}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {order.items.map((it, idx) => (
          <div
            key={`${it.flavour.name}-${idx}`}
            className="rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-700 dark:bg-stone-900/30 dark:text-stone-200"
          >
            <div className="font-medium">{it.flavour.name}</div>
            <div className="text-xs text-stone-500">
              Qty {it.quantity} × ${it.unitPriceCents / 100}
            </div>
          </div>
        ))}
      </div>

      {(order.status === 'PENDING' || order.status === 'PAID') && (
        <div className="mt-3 text-xs text-stone-500">
          Status updates come from Square webhooks; refresh if it takes a few
          seconds.
        </div>
      )}
    </div>
  )
}

