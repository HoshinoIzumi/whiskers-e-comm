import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createFlavour,
  deleteFlavour,
  patchTodayMenu,
  updateFlavour,
  type Flavour,
  type PublicOrder,
} from '../lib/api'
import { useAdminOrders, useUpdateOrderStatus } from '../hooks/useOrders'
import { useFlavours } from '../hooks/useFlavours'
import { useTodayMenu } from '../hooks/useTodayMenu'
import { useAuthStore } from '../stores/authStore'

function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function orderTargets(current: string) {
  switch (current) {
    case 'PENDING':
      return ['CANCELLED']
    case 'PAID':
      return ['PREPARING', 'CANCELLED']
    case 'PREPARING':
      return ['READY', 'CANCELLED']
    case 'READY':
      return ['COMPLETED', 'CANCELLED']
    case 'COMPLETED':
    case 'CANCELLED':
    default:
      return []
  }
}

export default function AdminPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const { data: flavourList, isPending: flavoursPending } = useFlavours({
    page: 1,
    limit: 200,
  })
  const flavours = flavourList?.data ?? []

  const { data: todayMenu, isPending: todayPending } = useTodayMenu()

  const [flavourDraftName, setFlavourDraftName] = useState('')
  const [flavourDraftPrice, setFlavourDraftPrice] = useState<string>('')
  const [flavourDraftDescription, setFlavourDraftDescription] = useState('')
  const [flavourDraftImageUrl, setFlavourDraftImageUrl] = useState('')
  const [adminMessage, setAdminMessage] = useState<string | null>(null)
  const [adminError, setAdminError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (dto: Parameters<typeof createFlavour>[0]) => createFlavour(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flavours'] })
      setAdminMessage('Flavour created.')
      setAdminError(null)
      setFlavourDraftName('')
      setFlavourDraftPrice('')
      setFlavourDraftDescription('')
      setFlavourDraftImageUrl('')
    },
    onError: (e: unknown) => {
      setAdminError(extractError(e))
    },
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState<string>('')
  const [editDescription, setEditDescription] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)

  const startEdit = (f: Flavour) => {
    setEditingId(f.id)
    setEditName(f.name)
    setEditPrice(String(f.priceCents))
    setEditDescription(f.description ?? '')
    setEditImageUrl(f.imageUrl ?? '')
    setEditIsActive(f.isActive)
  }

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; dto: Parameters<typeof updateFlavour>[1] }) =>
      updateFlavour(args.id, args.dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flavours'] })
      setAdminMessage('Flavour updated.')
      setAdminError(null)
      setEditingId(null)
    },
    onError: (e: unknown) => {
      setAdminError(extractError(e))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFlavour(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flavours'] })
      setAdminMessage('Flavour deleted.')
      setAdminError(null)
    },
    onError: (e: unknown) => {
      setAdminError(extractError(e))
    },
  })

  const patchTodayMutation = useMutation({
    mutationFn: (flavourIds: string[]) => patchTodayMenu(flavourIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-menu'] })
      setAdminMessage('Today’s menu updated.')
      setAdminError(null)
    },
    onError: (e: unknown) => {
      setAdminError(extractError(e))
    },
  })

  // Orders management
  const [adminOrdersPage, setAdminOrdersPage] = useState(1)
  const { data: adminOrders, isPending: ordersPending } = useAdminOrders({
    page: adminOrdersPage,
    limit: 20,
  })
  const orders = adminOrders?.data ?? []
  const updateOrderStatus = useUpdateOrderStatus()

  const handleUpdateOrderStatus = (
    order: PublicOrder,
    nextStatus: string,
  ) => {
    if (nextStatus === order.status) return
    setAdminError(null)
    updateOrderStatus.mutate(
      { orderId: order.id, status: nextStatus },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
          setAdminMessage(`Order ${order.id} → ${nextStatus}`)
        },
        onError: (e: unknown) => {
          setAdminError(extractError(e))
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Admin
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Signed in as <code>{user?.email}</code> ({user?.role})
          </p>
        </div>
      </div>

      {adminError && (
        <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {adminError}
        </div>
      )}
      {adminMessage && (
        <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {adminMessage}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-stone-200 p-5 dark:border-stone-700">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Flavours CRUD
          </h2>

          {flavoursPending && <p className="mt-3 text-stone-500">Loading…</p>}

          <div className="mt-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm font-medium text-stone-600 dark:text-stone-400">
                Name
              </label>
              <label className="text-sm font-medium text-stone-600 dark:text-stone-400">
                Price (cents)
              </label>
              <input
                value={flavourDraftName}
                onChange={(e) => setFlavourDraftName(e.target.value)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              />
              <input
                value={flavourDraftPrice}
                onChange={(e) => setFlavourDraftPrice(e.target.value)}
                type="number"
                min={0}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm font-medium text-stone-600 dark:text-stone-400">
                Description
              </label>
              <label className="text-sm font-medium text-stone-600 dark:text-stone-400">
                Image URL
              </label>
              <input
                value={flavourDraftDescription}
                onChange={(e) => setFlavourDraftDescription(e.target.value)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              />
              <input
                value={flavourDraftImageUrl}
                onChange={(e) => setFlavourDraftImageUrl(e.target.value)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              />
            </div>
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => {
                const priceCents = Number(flavourDraftPrice)
                if (!flavourDraftName.trim() || !Number.isFinite(priceCents)) {
                  setAdminError('Name and valid price (cents) are required.')
                  return
                }
                createMutation.mutate({
                  name: flavourDraftName.trim(),
                  priceCents,
                  description: normalOptionalString(flavourDraftDescription),
                  imageUrl: normalOptionalString(flavourDraftImageUrl),
                })
              }}
              className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:opacity-60"
            >
              {createMutation.isPending ? 'Creating…' : 'Create flavour'}
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-md font-semibold">Existing flavours</h3>
              <span className="text-sm text-stone-500">
                {flavours.length} item(s)
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {flavours.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 dark:bg-stone-900/30"
                >
                  <div className="min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-900 dark:text-stone-100">
                        {f.name}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          f.isActive
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                            : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-200'
                        }`}
                      >
                        {f.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
                      {formatUsd(f.priceCents)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(f)}
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={updateMutation.isPending && editingId === f.id}
                      onClick={() => {
                        updateMutation.mutate({
                          id: f.id,
                          dto: { isActive: !f.isActive },
                        })
                      }}
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
                    >
                      {f.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`Delete ${f.name}?`)) return
                        deleteMutation.mutate(f.id)
                      }}
                      className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {editingId && (
              <div className="mt-6 rounded-lg border border-stone-200 p-4 dark:border-stone-700">
                <h3 className="text-md font-semibold text-stone-900 dark:text-stone-100">
                  Edit flavour
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-stone-600 dark:text-stone-400">
                      Name
                    </label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-600 dark:text-stone-400">
                      Price (cents)
                    </label>
                    <input
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-stone-600 dark:text-stone-400">
                      Description
                    </label>
                    <input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-stone-600 dark:text-stone-400">
                      Image URL
                    </label>
                    <input
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-stone-600 dark:text-stone-400">
                      Active
                      <input
                        type="checkbox"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        className="ml-2"
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          const priceCents = Number(editPrice)
                          if (!editName.trim() || !Number.isFinite(priceCents)) {
                            setAdminError('Valid name and price (cents) are required.')
                            return
                          }
                          updateMutation.mutate({
                            id: editingId,
                            dto: {
                              name: editName.trim(),
                              priceCents,
                              description: normalOptionalString(editDescription),
                              imageUrl: normalOptionalString(editImageUrl),
                              isActive: editIsActive,
                            },
                          })
                        }}
                        className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:opacity-60"
                      >
                        {updateMutation.isPending ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 p-5 dark:border-stone-700">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Today’s menu
          </h2>

          {todayPending ? (
            <p className="mt-3 text-stone-500">Loading…</p>
          ) : (
            <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
              Set which flavours are available for checkout (and their order).
            </p>
          )}

          <TodayMenuEditor
            key={(todayMenu ?? []).map((f) => f.id).join('|')}
            todayMenu={todayMenu ?? []}
            flavours={flavours}
            isSaving={patchTodayMutation.isPending}
            onSave={(ids) => patchTodayMutation.mutate(ids)}
          />

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Orders status
            </h2>
            {ordersPending && <p className="mt-3 text-stone-500">Loading…</p>}

            {!ordersPending && (
              <>
                {orders.length === 0 ? (
                  <p className="mt-3 text-sm text-stone-500">
                    No orders found.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {orders.map((o) => (
                      <OrderRow
                        key={o.id}
                        order={o}
                        onChangeStatus={(next) =>
                          handleUpdateOrderStatus(o, next)
                        }
                      />
                    ))}
                  </div>
                )}

                {adminOrders && adminOrders.meta.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={adminOrdersPage <= 1}
                      onClick={() =>
                        setAdminOrdersPage((p) => Math.max(1, p - 1))
                      }
                      className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
                    >
                      Prev
                    </button>
                    <span className="text-sm text-stone-500">
                      Page {adminOrders.meta.page} / {adminOrders.meta.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={adminOrdersPage >= adminOrders.meta.totalPages}
                      onClick={() =>
                        setAdminOrdersPage((p) =>
                          Math.min(adminOrders.meta.totalPages, p + 1),
                        )
                      }
                      className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function TodayMenuEditor({
  todayMenu,
  flavours,
  isSaving,
  onSave,
}: {
  todayMenu: Flavour[]
  flavours: Flavour[]
  isSaving: boolean
  onSave: (flavourIds: string[]) => void
}) {
  const [draftIds, setDraftIds] = useState<string[]>(
    () => todayMenu.map((f) => f.id),
  )
  const [availableToAddId, setAvailableToAddId] = useState('')

  const availableToAdd = useMemo(() => {
    const draft = new Set(draftIds)
    return flavours.filter((f) => !draft.has(f.id))
  }, [flavours, draftIds])

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-lg bg-stone-50 p-3 dark:bg-stone-900/30">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          Current
        </h3>
        {draftIds.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No flavours selected.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {draftIds.map((id, idx) => {
              const f = flavours.find((x) => x.id === id)
              if (!f) return null
              return (
                <div
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white px-3 py-2 dark:bg-stone-800/20"
                >
                  <div className="min-w-[220px]">
                    <div className="font-medium">{f.name}</div>
                    <div className="text-xs text-stone-500">
                      {formatUsd(f.priceCents)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        setDraftIds((arr) => {
                          const copy = [...arr]
                          const tmp = copy[idx - 1]
                          copy[idx - 1] = copy[idx]
                          copy[idx] = tmp
                          return copy
                        })
                      }}
                      className="rounded-md border border-stone-300 px-2 py-1 text-xs font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={idx === draftIds.length - 1}
                      onClick={() => {
                        setDraftIds((arr) => {
                          const copy = [...arr]
                          const tmp = copy[idx + 1]
                          copy[idx + 1] = copy[idx]
                          copy[idx] = tmp
                          return copy
                        })
                      }}
                      className="rounded-md border border-stone-300 px-2 py-1 text-xs font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftIds((arr) => arr.filter((x) => x !== id))
                      }}
                      className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="sm:col-span-2 text-sm font-medium text-stone-600 dark:text-stone-400">
          Add flavour
        </label>
        <div className="sm:col-span-2">
          <select
            value={availableToAddId}
            onChange={(e) => setAvailableToAddId(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          >
            <option value="">Select…</option>
            {availableToAdd.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({formatUsd(f.priceCents)})
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={!availableToAddId}
          onClick={() => {
            setDraftIds((arr) => [...arr, availableToAddId])
            setAvailableToAddId('')
          }}
          className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:opacity-60"
        >
          Add
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setDraftIds([])}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
        >
          Clear
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => onSave(draftIds)}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:opacity-60"
        >
          {isSaving ? 'Updating…' : 'Save today’s menu'}
        </button>
      </div>
    </div>
  )
}

function OrderRow({
  order,
  onChangeStatus,
}: {
  order: PublicOrder
  onChangeStatus: (nextStatus: string) => void
}) {
  const targets = orderTargets(order.status)
  const canUpdate = targets.length > 0

  const guestOrUser =
    order.user?.email ?? order.guestEmail ?? order.guestPhone ?? '—'

  return (
    <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-stone-500">{order.id}</span>
            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700 dark:bg-stone-800/40 dark:text-stone-200">
              {order.status}
            </span>
          </div>
          <div className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {new Date(order.createdAt).toLocaleString()}
          </div>
          <div className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Customer: {guestOrUser}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-stone-600 dark:text-stone-400">Total</div>
          <div className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {formatUsd(order.totalCents)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-stone-500">
          Items: {order.items.map((i) => i.flavour.name).join(', ')}
        </div>
        <div className="flex items-center gap-2">
          <select
            disabled={!canUpdate}
            value={order.status}
            onChange={(e) => onChangeStatus(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          >
            <option value={order.status} disabled>
              Update…
            </option>
            {targets.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function normalOptionalString(v: string) {
  const t = v.trim()
  return t.length ? t : undefined
}

function extractError(e: unknown) {
  if (typeof e !== 'object' || !e) return 'Something went wrong.'
  const maybe = e as {
    response?: { data?: { message?: unknown; error?: unknown } }
    message?: unknown
  }
  const msg =
    maybe.response?.data?.message ??
    maybe.response?.data?.error ??
    maybe.message

  if (typeof msg === 'string') return msg
  if (msg != null) return String(msg)
  return 'Something went wrong.'
}

