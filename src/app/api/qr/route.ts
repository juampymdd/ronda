import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Tables with needsAttention = true
    const attentionTables = await prisma.table.findMany({
      where: { needsAttention: true },
      select: { id: true, number: true, zone: { select: { name: true, color: true } } },
      orderBy: { number: "asc" },
    });

    // Pending QR orders from active rondas
    const pendingQROrders = await prisma.order.findMany({
      where: {
        source: "QR",
        status: "PENDIENTE",
        ronda: { isActive: true },
      },
      include: {
        ronda: {
          include: {
            table: {
              select: {
                id: true,
                number: true,
                zone: { select: { name: true, color: true } },
              },
            },
          },
        },
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        attentionTables,
        pendingQROrders: pendingQROrders.map((o) => ({
          id: o.id,
          createdAt: o.createdAt,
          tableId: o.ronda.table?.id ?? null,
          tableNumber: o.ronda.table?.number ?? null,
          zoneName: o.ronda.table?.zone?.name ?? null,
          zoneColor: o.ronda.table?.zone?.color ?? "#a855f7",
          items: o.items.map((i) => ({
            id: i.id,
            productName: i.product.name,
            quantity: i.quantity,
            notes: i.notes,
            priceAtSnapshot: Number(i.priceAtSnapshot),
          })),
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/qr error:", error);
    return NextResponse.json({ success: false, error: "Error al cargar pedidos QR" }, { status: 500 });
  }
}
