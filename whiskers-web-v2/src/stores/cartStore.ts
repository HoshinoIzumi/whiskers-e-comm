import { create } from 'zustand'

export type CartLine = {
  flavourId: string
  name: string
  unitPriceCents: number
  quantity: number
}

type CartState = {
  items: CartLine[]
  add: (line: Omit<CartLine, 'quantity'> & { quantity?: number }) => void
  remove: (flavourId: string) => void
  setQuantity: (flavourId: string, quantity: number) => void
  clear: () => void
  getTotalCents: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  add: (line) =>
    set((s) => {
      const qty = line.quantity ?? 1
      const existing = s.items.find((i) => i.flavourId === line.flavourId)
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.flavourId === line.flavourId
              ? { ...i, quantity: i.quantity + qty }
              : i,
          ),
        }
      }
      return {
        items: [
          ...s.items,
          {
            flavourId: line.flavourId,
            name: line.name,
            unitPriceCents: line.unitPriceCents,
            quantity: qty,
          },
        ],
      }
    }),
  remove: (flavourId) =>
    set((s) => ({
      items: s.items.filter((i) => i.flavourId !== flavourId),
    })),
  setQuantity: (flavourId, quantity) =>
    set((s) => ({
      items:
        quantity <= 0
          ? s.items.filter((i) => i.flavourId !== flavourId)
          : s.items.map((i) =>
              i.flavourId === flavourId ? { ...i, quantity } : i,
            ),
    })),
  clear: () => set({ items: [] }),
  getTotalCents: () => {
    const { items } = get()
    return items.reduce(
      (sum, i) => sum + i.unitPriceCents * i.quantity,
      0,
    )
  },
}))
