"use server";

import { prisma } from "@/lib/prisma";
import { error, success, type Result } from "@/lib/utils";
import { z } from "zod";
import { OrderStatus, TableStatus } from "@prisma/client";

const OrderItemSchema = z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    notes: z.string().optional(),
});

const ProcessOrderSchema = z.object({
    tableId: z.string(),
    mozoId: z.string(),
    items: z.array(OrderItemSchema).min(1),
});

export async function processOrderAction(
    rawData: z.infer<typeof ProcessOrderSchema>
): Promise<Result<any>> {
    try {
        const { tableId, mozoId, items } = ProcessOrderSchema.parse(rawData);

        return await prisma.$transaction(async (tx) => {
            // 1. Find or create an active Ronda for the table
            let ronda = await tx.ronda.findFirst({
                where: { tableId, isActive: true },
            });

            if (!ronda) {
                ronda = await tx.ronda.create({
                    data: { tableId, isActive: true },
                });
            }

            // 2. Fetch products to get current prices for snapshots
            const productIds = items.map((i) => i.productId);
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
            });

            const productPriceMap = new Map(products.map((p) => [p.id, p.price]));

            // 3. Create the Order
            const order = await tx.order.create({
                data: {
                    rondaId: ronda.id,
                    mozoId: mozoId,
                    status: OrderStatus.PENDIENTE,
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            notes: item.notes,
                            priceAtSnapshot: productPriceMap.get(item.productId) || 0,
                        })),
                    },
                },
            });

            // 4. Update Table status
            await tx.table.update({
                where: { id: tableId },
                data: { status: TableStatus.ESPERANDO },
            });

            // TODO: Trigger Realtime Event (Supabase / WebSockets)
            // console.log("Realtime event: ORDER_CREATED", order.id);

            return success(order);
        });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return error("Invalid order data: " + e.issues.map((oe) => oe.message).join(", "));
        }
        console.error("Order processing error:", e);
        return error("Internal server error during order processing");
    }
}
