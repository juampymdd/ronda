import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rondaId } = await params;
    const body = await request.json();
    const { paymentMethod } = body;

    // Close the ronda
    const closedRonda = await prisma.ronda.update({
      where: { id: rondaId },
      data: {
        isActive: false,
      },
      include: {
        table: true,
      },
    });

    // Calculate total
    const orders = await prisma.order.findMany({
      where: { rondaId },
      include: {
        items: true,
      },
    });

    const total = orders.reduce((sum, order) => {
      return (
        sum +
        order.items.reduce((orderSum, item) => {
          return orderSum + Number(item.priceAtSnapshot) * item.quantity;
        }, 0)
      );
    }, 0);

    // TODO: Create payment record in database
    // For now, just log it
    console.log(
      `Ronda ${rondaId} closed. Total: $${total}. Method: ${paymentMethod}`,
    );

    return NextResponse.json({
      success: true,
      data: {
        ronda: closedRonda,
        total,
        paymentMethod,
      },
    });
  } catch (error) {
    console.error("Error closing ronda:", error);
    return NextResponse.json(
      { success: false, error: "Failed to close ronda" },
      { status: 500 },
    );
  }
}
