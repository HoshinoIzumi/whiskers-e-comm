import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createOrder, createPaymentLink } from '../lib/api'
import { useCartStore } from '../stores/cartStore'

function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const clear = useCartStore((s) => s.clear)
  const total = useCartStore((s) => s.getTotalCents)()
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const payMutation = useMutation({
    mutationFn: async () => {
      setError(null)
      const order = await createOrder({
        items: items.map((i) => ({
          flavourId: i.flavourId,
          quantity: i.quantity,
        })),
        guestEmail: guestEmail.trim() || undefined,
        guestPhone: guestPhone.trim() || undefined,
      })
      const { checkoutUrl } = await createPaymentLink(order.id)
      clear()
      window.location.assign(checkoutUrl)
    },
    onError: (e: unknown) => {
      if (axios.isAxiosError(e)) {
        const d = e.response?.data as
          | { message?: string | string[]; error?: string }
          | undefined
        const piece = Array.isArray(d?.message)
          ? d.message.join(', ')
          : d?.message ?? d?.error
        setError(
          piece ??
            e.message ??
            'Could not start checkout. Is the API running and is today’s menu set?',
        )
        return
      }
      setError('Could not start checkout.')
    },
  })

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
          Checkout
        </h1>
        <p className="mt-4 text-stone-600 dark:text-stone-400">
          Your cart is empty.{' '}
          <Link
            to="/cart"
            className="font-medium text-amber-700 hover:underline dark:text-amber-400"
          >
            Back to cart
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Checkout
      </h1>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        Guest checkout — you’ll be redirected to Square Sandbox to pay.
      </p>

      <div className="mt-6 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900/40">
        <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
          Order summary
        </p>
        <ul className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-400">
          {items.map((i) => (
            <li key={i.flavourId} className="flex justify-between gap-4">
              <span>
                {i.name} × {i.quantity}
              </span>
              <span className="tabular-nums">
                {formatUsd(i.unitPriceCents * i.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-stone-200 pt-3 text-stone-900 dark:border-stone-600 dark:text-stone-100">
          <span className="font-medium">Total</span>
          <span className="tabular-nums font-semibold">{formatUsd(total)}</span>
        </div>
      </div>

      <form
        className="mt-8 space-y-4"
        onSubmit={(ev) => {
          ev.preventDefault()
          payMutation.mutate()
        }}
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            Phone (optional)
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={payMutation.isPending}
          className="inline-flex w-full items-center justify-center rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:opacity-60"
        >
          {payMutation.isPending ? 'Starting checkout…' : 'Pay with Square'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-stone-500">
        <Link to="/cart" className="hover:text-amber-700 dark:hover:text-amber-400">
          ← Back to cart
        </Link>
      </p>
    </div>
  )
}
