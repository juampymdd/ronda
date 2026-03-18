"use server";

import { prisma } from "@/lib/prisma";
import { error, success, type Result } from "@/lib/utils";
import { z } from "zod";
import { OrderStatus, TableStatus } from "@prisma/client";

const QROrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  notes: z.string().optional(),
});

const CreateOrderFromQRSchema = z.object({
  tableId: z.string().min(1),
  items: z.array(QROrderItemSchema).min(1, "El pedido debe tener al menos un ítem"),
});

export async function createOrderFromQR(
  rawData: z.infer<typeof CreateOrderFromQRSchema>
): Promise<Result<{ orderId: string }>> {
  try {
    const { tableId, items } = CreateOrderFromQRSchema.parse(rawData);

    return await prisma.$transaction(async (tx) => {
      // 1. Validate table exists and is occupied (has an active ronda)
      const table = await tx.table.findUnique({ where: { id: tableId } });
      if (!table) return error("Mesa no encontrada");
      if (table.status === TableStatus.LIBRE) {
        return error("Esta mesa no tiene una ronda activa. Solicitá al mozo que abra tu mesa.");
      }

      // 2. Find the active ronda for this table
      let ronda = await tx.ronda.findFirst({
        where: { tableId, isActive: true },
      });

      if (!ronda) {
        // Create a ronda if table is occupied but somehow has none
        ronda = await tx.ronda.create({
          data: { tableId, isActive: true },
        });
      }

      // 3. Fetch product prices for snapshot
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
      });

      if (products.length !== productIds.length) {
        return error("Uno o más productos no están disponibles");
      }

      const priceMap = new Map(products.map((p) => [p.id, p.price]));

      // 4. Create the order with source = "QR" and status = PENDIENTE (awaits waiter approval)
      const order = await tx.order.create({
        data: {
          rondaId: ronda.id,
          mozoId: undefined,
          source: "QR",
          status: OrderStatus.PENDIENTE,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              notes: item.notes,
              priceAtSnapshot: priceMap.get(item.productId)!,
            })),
          },
        },
      });

      return success({ orderId: order.id });
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error(e.issues.map((i) => i.message).join(", "));
    }
    console.error("createOrderFromQR error:", e);
    return error("Error interno al procesar el pedido");
  }
}

export async function callWaiterAction(
  tableId: string
): Promise<Result<void>> {
  try {
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) return error("Mesa no encontrada");

    await prisma.table.update({
      where: { id: tableId },
      data: { needsAttention: true },
    });

    return success(undefined);
  } catch (e) {
    console.error("callWaiterAction error:", e);
    return error("Error al llamar al mozo");
  }
}

export async function requestBillAction(
  tableId: string
): Promise<Result<void>> {
  try {
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) return error("Mesa no encontrada");
    if (table.status === TableStatus.LIBRE) return error("Esta mesa no tiene cuenta pendiente");

    await prisma.table.update({
      where: { id: tableId },
      data: { status: TableStatus.PAGANDO },
    });

    return success(undefined);
  } catch (e) {
    console.error("requestBillAction error:", e);
    return error("Error al solicitar la cuenta");
  }
}

export async function approveQROrderAction(
  orderId: string
): Promise<Result<void>> {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return error("Pedido no encontrado");
    if (order.source !== "QR") return error("Este pedido no es de QR");
    if (order.status !== OrderStatus.PENDIENTE) return error("El pedido ya fue procesado");

    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PREPARANDO },
    });

    return success(undefined);
  } catch (e) {
    console.error("approveQROrderAction error:", e);
    return error("Error al aprobar el pedido");
  }
}

export async function rejectQROrderAction(
  orderId: string
): Promise<Result<void>> {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return error("Pedido no encontrado");
    if (order.source !== "QR") return error("Este pedido no es de QR");
    if (order.status !== OrderStatus.PENDIENTE) return error("El pedido ya fue procesado");

    // We use ENTREGADO as a terminal "done/closed" status for rejected QR orders.
    // Ideally you'd add a RECHAZADO status, but for now ENTREGADO serves as terminal.
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.ENTREGADO },
    });

    return success(undefined);
  } catch (e) {
    console.error("rejectQROrderAction error:", e);
    return error("Error al rechazar el pedido");
  }
}

export async function dismissAttentionAction(
  tableId: string
): Promise<Result<void>> {
  try {
    await prisma.table.update({
      where: { id: tableId },
      data: { needsAttention: false },
    });
    return success(undefined);
  } catch (e) {
    console.error("dismissAttentionAction error:", e);
    return error("Error al desactivar alerta");
  }
}
