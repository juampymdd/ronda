import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get stats
    const [
      totalTables,
      occupiedTables,
      activeRondas,
      todayOrders,
      todayRevenue,
      recentOrders,
    ] = await Promise.all([
      prisma.table.count(),
      prisma.table.count({ where: { status: { not: "LIBRE" } } }),
      prisma.ronda.count({ where: { isActive: true } }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.orderItem.aggregate({
        _sum: { priceAtSnapshot: true },
        where: {
          order: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          mozo: { select: { name: true } },
          ronda: {
            include: {
              table: { select: { number: true } },
            },
          },
          items: true,
        },
      }),
    ]);

    // Get sales data for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const salesData = await Promise.all(
      last7Days.map(async (date) => {
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const revenue = await prisma.orderItem.aggregate({
          _sum: { priceAtSnapshot: true },
          where: {
            order: {
              createdAt: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
          },
        });

        return {
          date: startOfDay
            .toLocaleDateString("es-AR", { weekday: "short" })
            .toUpperCase(),
          sales: Number(revenue._sum.priceAtSnapshot || 0),
        };
      }),
    );

    // Get table status distribution
    const tablesByStatus = await prisma.table.groupBy({
      by: ["status"],
      _count: true,
    });

    const statusData = tablesByStatus.map((item) => ({
      status: item.status,
      count: item._count,
    }));

    // Get top 5 tables by revenue
    const topTables = await prisma.table.findMany({
      include: {
        rondas: {
          include: {
            orders: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });

    const tablesWithRevenue = topTables
      .map((table) => {
        const totalRevenue = table.rondas.reduce((sum, ronda) => {
          return (
            sum +
            ronda.orders.reduce((orderSum, order) => {
              return (
                orderSum +
                order.items.reduce((itemSum, item) => {
                  return itemSum + Number(item.priceAtSnapshot) * item.quantity;
                }, 0)
              );
            }, 0)
          );
        }, 0);

        return {
          table: `Mesa ${table.number}`,
          orders: table.rondas.reduce(
            (sum, ronda) => sum + ronda.orders.length,
            0,
          ),
          revenue: totalRevenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      stats: {
        totalTables,
        occupiedTables,
        activeRondas,
        todayOrders,
        todayRevenue: Number(todayRevenue._sum.priceAtSnapshot || 0),
        recentOrders,
      },
      chartData: {
        salesData,
        statusData,
        topTablesData: tablesWithRevenue,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
