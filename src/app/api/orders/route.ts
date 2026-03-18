import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get pagination params
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      ronda: {
        isActive: true,
      },
    };

    // Add status filter if provided
    if (status && status !== "TODOS") {
      where.status = status;
    }

    // Add date range filter if provided
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    // Get total count for pagination
    const totalOrders = await prisma.order.count({ where });

    // Get all orders from active rondas with pagination
    const orders = await prisma.order.findMany({
      where,
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
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalOrders / limit);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
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
