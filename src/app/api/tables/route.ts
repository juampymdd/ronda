import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      include: {
        zone: true,
        tableGroup: true,
      },
      orderBy: [{ number: "asc" }],
    });
    return NextResponse.json({ success: true, data: tables });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tables" },
      { status: 500 },
    );
  }
}
