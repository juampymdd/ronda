"use server";

import { prisma } from "@/lib/prisma";
import { error, success, type Result } from "@/lib/utils";
import { z } from "zod";
import { TableStatus } from "@prisma/client";

const CloseTableSchema = z.object({
    tableId: z.string(),
    paymentMethod: z.string(), // EFECTIVO, TARJETA, etc.
    splitType: z.string().default("SINGLE"),
});

export async function closeTableAction(
    rawData: z.infer<typeof CloseTableSchema>
): Promise<Result<any>> {
    try {
        const { tableId, paymentMethod, splitType } = CloseTableSchema.parse(rawData);

        return await prisma.$transaction(async (tx) => {
            // 1. Find active Ronda
            const ronda = await tx.ronda.findFirst({
                where: { tableId, isActive: true },
                include: {
                    orders: {
                        include: {
                            items: true,
                        },
                    },
                },
            });

            if (!ronda) {
                return error("No active ronda found for this table");
            }

            // 2. Calculate Total
            let total = 0;
            ronda.orders.forEach((order) => {
                order.items.forEach((item) => {
                    total += Number(item.priceAtSnapshot) * item.quantity;
                });
            });

            // 3. Create Payment record
            const payment = await tx.payment.create({
                data: {
                    rondaId: ronda.id,
                    amount: total,
                    method: paymentMethod,
                    splitType: splitType,
                },
            });

            // 4. Deactivate Ronda
            await tx.ronda.update({
                where: { id: ronda.id },
                data: { isActive: false },
            });

            // 5. Release Table
            await tx.table.update({
                where: { id: tableId },
                data: { status: TableStatus.LIBRE },
            });

            return success({ paymentId: payment.id, total });
        });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return error("Invalid closure data");
        }
        console.error("Table closure error:", e);
        return error("Internal server error during table closure");
    }
}
