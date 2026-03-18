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
          select: { createdAt: true },
        },
      },
      orderBy: [{ number: "asc" }],
    });

    // Flatten: expose openedAt at top level (null when table is free)
    const data = tables.map(({ rondas, ...rest }) => ({
      ...rest,
      openedAt: rondas[0]?.createdAt ?? null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tables" },
      { status: 500 },
    );
  }
}
