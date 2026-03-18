import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rondas = await prisma.ronda.findMany({
      where: { isActive: true },
      include: {
        table: {
          select: {
            id: true,
            number: true,
            zone: { select: { name: true, color: true } },
          },
        },
        orders: {
          where: {
            status: { not: "ENTREGADO" },
          },
          orderBy: { createdAt: "asc" },
          include: {
            mozo: { select: { id: true, name: true } },
            items: {
              include: {
                product: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Status priority for sorting: LISTO first, then PREPARANDO, then PENDIENTE
    const statusPriority: Record<string, number> = {
      LISTO: 0,
      PREPARANDO: 1,
      PENDIENTE: 2,
      INCOMPLETO: 3,
      ENTREGADO: 4,
    };

    // Flatten all orders with table/zone context
    const orders = rondas
      .flatMap((ronda) =>
        ronda.orders.map((order) => ({
          id: order.id,
          status: order.status,
          source: order.source,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          rondaId: ronda.id,
          tableId: ronda.table?.id ?? null,
          tableNumber: ronda.table?.number ?? null,
          zoneName: ronda.table?.zone?.name ?? null,
          zoneColor: ronda.table?.zone?.color ?? "#6b7280",
          mozo: order.mozo ? { id: order.mozo.id, name: order.mozo.name } : null,
          items: order.items.map((item) => ({
            id: item.id,
            productName: item.product.name,
            quantity: item.quantity,
            notes: item.notes,
            priceAtSnapshot: Number(item.priceAtSnapshot),
          })),
        }))
      )
      .sort(
        (a, b) =>
          (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99)
      );

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching active orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch active orders" },
      { status: 500 }
    );
  }
}
