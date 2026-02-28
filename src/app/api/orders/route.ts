import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get all orders from active rondas
    const orders = await prisma.order.findMany({
      where: {
        ronda: {
          isActive: true,
        },
      },
      include: {
        mozo: {
          select: {
            id: true,
            name: true,
          },
        },
        ronda: {
          include: {
            table: {
              include: {
                zone: {
                  select: {
                    name: true,
                    color: true,
                  },
                },
              },
            },
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar los pedidos",
      },
      { status: 500 },
    );
  }
}
