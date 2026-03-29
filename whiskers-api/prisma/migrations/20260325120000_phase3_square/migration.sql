-- AlterTable
ALTER TABLE "orders" ADD COLUMN "square_order_id" TEXT;
ALTER TABLE "orders" ADD COLUMN "square_payment_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_square_order_id_key" ON "orders"("square_order_id");
