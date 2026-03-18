import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

/**
 * POST /api/orders/close-stale
 * Marks all orders from previous days that are still PENDIENTE or PREPARANDO as INCOMPLETO.
 * Called automatically by the midnight cron job and manually from the admin dashboard.
 */
export async function POST() {
  try {
    // Start of today (midnight local — using UTC boundary)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = await prisma.order.updateMany({
      where: {
        createdAt: { lt: startOfToday },
        status: { in: [OrderStatus.PENDIENTE, OrderStatus.PREPARANDO] },
      },
      data: { status: OrderStatus.INCOMPLETO },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      message: `${result.count} pedido(s) marcado(s) como INCOMPLETO`,
    });
  } catch (error) {
    console.error("Error closing stale orders:", error);
    return NextResponse.json(
      { success: false, error: "Error al cerrar pedidos del día anterior" },
      { status: 500 },
    );
  }
}
