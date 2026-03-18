import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rondaId } = await params;
    const body = await request.json();
    const { paymentMethod, itemEdits, newItems } = body;

    // Get the ronda to find the first order (we'll add new items to it)
    const ronda = await prisma.ronda.findUnique({
      where: { id: rondaId },
      include: {
        orders: {
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ronda || ronda.orders.length === 0) {
      return NextResponse.json(
        { success: false, error: "Ronda not found" },
        { status: 404 },
      );
    }

    // Add new items if provided
    if (newItems && Array.isArray(newItems)) {
      for (const newItem of newItems) {
        await prisma.orderItem.create({
          data: {
            orderId: ronda.orders[0].id,
            productId: newItem.productId,
            quantity: newItem.quantity,
            priceAtSnapshot: newItem.price,
          },
        });
      }
    }

    // Apply item edits if provided
    if (itemEdits && Array.isArray(itemEdits)) {
      for (const edit of itemEdits) {
        if (edit.deleted) {
          // Delete the item
          await prisma.orderItem.delete({
            where: { id: edit.itemId },
          });
        } else if (edit.quantity) {
          // Update the quantity
          await prisma.orderItem.update({
            where: { id: edit.itemId },
            data: { quantity: edit.quantity },
          });
        }
      }
    }

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
