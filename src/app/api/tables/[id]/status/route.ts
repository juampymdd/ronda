import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TableStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: tableId } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!Object.values(TableStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid table status" },
        { status: 400 },
      );
    }

    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      data: updatedTable,
    });
  } catch (error) {
    console.error("Error updating table status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update table status" },
      { status: 500 },
    );
  }
}
