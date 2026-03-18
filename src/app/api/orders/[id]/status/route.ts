import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

// Allowed transitions — only forward, mozo can only set ENTREGADO from LISTO
const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  PENDIENTE: ["PREPARANDO"],
  PREPARANDO: ["LISTO"],
  LISTO: ["ENTREGADO"],
  ENTREGADO: [],
  INCOMPLETO: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !(status in ALLOWED_TRANSITIONS)) {
      return NextResponse.json(
        { success: false, error: "Estado inválido" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(status as OrderStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede pasar de ${order.status} a ${status}`,
        },
        { status: 422 }
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al actualizar el pedido" },
      { status: 500 }
    );
  }
}
