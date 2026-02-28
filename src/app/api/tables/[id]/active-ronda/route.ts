import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: tableId } = await params;

    const activeRonda = await prisma.ronda.findFirst({
      where: {
        tableId,
        isActive: true,
      },
      include: {
        orders: {
          include: {
            items: {
              select: {
                id: true,
                quantity: true,
                priceAtSnapshot: true,
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: activeRonda,
    });
  } catch (error) {
    console.error("Error fetching active ronda:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch active ronda" },
      { status: 500 },
    );
  }
}
