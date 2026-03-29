import { OrderStatus } from '@prisma/client';

export type OrderLineInput = {
  unitPriceCents: number;
  quantity: number;
};

/** Sum of line totals; prices must come from server-side flavour rows. */
export function computeOrderTotalCents(lines: OrderLineInput[]): number {
  let total = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error('INVALID_QUANTITY');
    }
    if (!Number.isInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
      throw new Error('INVALID_UNIT_PRICE');
    }
    total += line.unitPriceCents * line.quantity;
  }
  return total;
}

/** Coupon hook for Phase 3+ — returns subtotal unchanged for MVP. */
export function applyCouponSubtotal(
  subtotalCents: number,
  _couponCode: string | undefined,
): number {
  if (_couponCode) {
    // TODO: apply coupon rules when coupon module ships
  }
  return subtotalCents;
}

const forward: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  if (to === OrderStatus.CANCELLED) {
    return from !== OrderStatus.COMPLETED && from !== OrderStatus.CANCELLED;
  }
  const next = forward[from];
  return next?.includes(to) ?? false;
}

/** Square `Payment.status` values that mean funds are successfully captured for MVP. */
export function isSuccessfulSquarePaymentStatus(
  status: string | undefined,
): boolean {
  if (!status) return false;
  const u = status.toUpperCase();
  return u === 'COMPLETED' || u === 'APPROVED';
}
