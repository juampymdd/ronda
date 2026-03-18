import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      include: {
        zone: true,
        tableGroup: true,
        rondas: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            createdAt: true,
            orders: {
              select: { status: true },
            },
          },
        },
      },
      orderBy: [{ number: "asc" }],
    });

    // Flatten: expose openedAt + orderStatusSummary at top level
    const data = tables.map(({ rondas, ...rest }) => {
      const activeRonda = rondas[0] ?? null;
      const orders = activeRonda?.orders ?? [];

      const orderStatusSummary = {
        listo: orders.filter((o) => o.status === "LISTO").length,
        preparando: orders.filter((o) => o.status === "PREPARANDO").length,
        pendiente: orders.filter((o) => o.status === "PENDIENTE").length,
        entregado: orders.filter((o) => o.status === "ENTREGADO").length,
      };

      return {
        ...rest,
        openedAt: activeRonda?.createdAt ?? null,
        orderStatusSummary,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tables" },
      { status: 500 },
    );
  }
}
