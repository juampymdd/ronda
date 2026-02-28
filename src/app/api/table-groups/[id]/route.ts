import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TableStatus } from "@prisma/client";

// DELETE /api/table-groups/[id] - Ungroup tables (separate)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: groupId } = await params;

    // Get the table group
    const tableGroup = await prisma.tableGroup.findUnique({
      where: { id: groupId },
      include: {
        tables: true,
        rondas: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!tableGroup) {
      return NextResponse.json(
        { success: false, error: "Grupo de mesas no encontrado" },
        { status: 404 },
      );
    }

    // Check if there are active rondas
    if (tableGroup.rondas.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No se puede separar el grupo mientras tenga rondas activas. Cierre las rondas primero.",
        },
        { status: 400 },
      );
    }

    // Ungroup tables
    await prisma.$transaction(async (tx) => {
      // Remove tables from group and set them to LIBRE
      await tx.table.updateMany({
        where: {
          tableGroupId: groupId,
        },
        data: {
          tableGroupId: null,
          status: TableStatus.LIBRE,
        },
      });

      // Mark group as inactive
      await tx.tableGroup.update({
        where: { id: groupId },
        data: {
          isActive: false,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Grupo de mesas separado correctamente",
    });
  } catch (error) {
    console.error("Error ungrouping tables:", error);
    return NextResponse.json(
      { success: false, error: "Error al separar el grupo de mesas" },
      { status: 500 },
    );
  }
}
