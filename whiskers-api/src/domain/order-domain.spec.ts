import { OrderStatus } from '@prisma/client';
import {
  applyCouponSubtotal,
  canTransition,
  computeOrderTotalCents,
  isSuccessfulSquarePaymentStatus,
} from './order-domain';

describe('computeOrderTotalCents', () => {
  it('sums price × quantity', () => {
    expect(
      computeOrderTotalCents([
        { unitPriceCents: 100, quantity: 2 },
        { unitPriceCents: 50, quantity: 1 },
      ]),
    ).toBe(250);
  });

  it('rejects non-positive quantity', () => {
    expect(() =>
      computeOrderTotalCents([{ unitPriceCents: 10, quantity: 0 }]),
    ).toThrow('INVALID_QUANTITY');
  });

  it('rejects negative unit price', () => {
    expect(() =>
      computeOrderTotalCents([{ unitPriceCents: -1, quantity: 1 }]),
    ).toThrow('INVALID_UNIT_PRICE');
  });
});

describe('applyCouponSubtotal', () => {
  it('returns subtotal when coupon placeholder unused', () => {
    expect(applyCouponSubtotal(500, undefined)).toBe(500);
  });
});

describe('canTransition', () => {
  it('allows PENDING → PAID → … → COMPLETED', () => {
    expect(canTransition(OrderStatus.PENDING, OrderStatus.PAID)).toBe(true);
    expect(canTransition(OrderStatus.PAID, OrderStatus.PREPARING)).toBe(true);
    expect(canTransition(OrderStatus.PREPARING, OrderStatus.READY)).toBe(true);
    expect(canTransition(OrderStatus.READY, OrderStatus.COMPLETED)).toBe(true);
  });

  it('rejects PENDING → READY', () => {
    expect(canTransition(OrderStatus.PENDING, OrderStatus.READY)).toBe(false);
  });

  it('allows cancel from non-terminal states', () => {
    expect(canTransition(OrderStatus.PENDING, OrderStatus.CANCELLED)).toBe(
      true,
    );
    expect(canTransition(OrderStatus.PAID, OrderStatus.CANCELLED)).toBe(true);
  });

  it('disallows cancel from COMPLETED', () => {
    expect(canTransition(OrderStatus.COMPLETED, OrderStatus.CANCELLED)).toBe(
      false,
    );
  });
});

describe('isSuccessfulSquarePaymentStatus', () => {
  it('accepts COMPLETED and APPROVED', () => {
    expect(isSuccessfulSquarePaymentStatus('COMPLETED')).toBe(true);
    expect(isSuccessfulSquarePaymentStatus('approved')).toBe(true);
  });

  it('rejects other states', () => {
    expect(isSuccessfulSquarePaymentStatus('PENDING')).toBe(false);
    expect(isSuccessfulSquarePaymentStatus('FAILED')).toBe(false);
    expect(isSuccessfulSquarePaymentStatus(undefined)).toBe(false);
  });
});
