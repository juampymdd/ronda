import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TableStatus } from "@prisma/client";

// GET /api/table-groups - List active table groups
export async function GET(req: NextRequest) {
  try {
    const tableGroups = await prisma.tableGroup.findMany({
      where: {
        isActive: true,
      },
      include: {
        tables: {
          include: {
            zone: {
              select: {
                name: true,
                color: true,
              },
            },
          },
        },
        rondas: {
          where: {
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: tableGroups,
    });
  } catch (error) {
    console.error("Error fetching table groups:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar los grupos de mesas",
      },
      { status: 500 },
    );
  }
}

// POST /api/table-groups - Create a new table group
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableIds, name } = body;

    // Validate required fields
    if (!tableIds || !Array.isArray(tableIds) || tableIds.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Debe seleccionar al menos 2 mesas para crear un grupo",
        },
        { status: 400 },
      );
    }

    // Check if all tables exist and are available
    const tables = await prisma.table.findMany({
      where: {
        id: {
          in: tableIds,
        },
      },
      include: {
        tableGroup: true,
        rondas: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (tables.length !== tableIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Una o más mesas no existen",
        },
        { status: 404 },
      );
    }

    // Check if any table already belongs to a group
    const tablesInGroup = tables.filter((t) => t.tableGroupId !== null);
    if (tablesInGroup.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Las mesas ${tablesInGroup.map((t) => t.number).join(", ")} ya pertenecen a un grupo`,
        },
        { status: 400 },
      );
    }

    // Check if any table has an active ronda
    const tablesWithRonda = tables.filter((t) => t.rondas.length > 0);
    if (tablesWithRonda.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Las mesas ${tablesWithRonda.map((t) => t.number).join(", ")} tienen rondas activas. Cierre las rondas antes de agrupar`,
        },
        { status: 400 },
      );
    }

    // Generate default name if not provided
    const groupName =
      name ||
      `Mesa ${tables
        .map((t) => t.number)
        .sort((a, b) => a - b)
        .join("+")}`;

    // Create table group and update tables
    const tableGroup = await prisma.$transaction(async (tx) => {
      // Create group
      const group = await tx.tableGroup.create({
        data: {
          name: groupName,
          isActive: true,
        },
      });

      // Update all tables to belong to this group
      await tx.table.updateMany({
        where: {
          id: {
            in: tableIds,
          },
        },
        data: {
          tableGroupId: group.id,
          status: TableStatus.OCUPADA, // Mark as occupied when grouped
        },
      });

      // Fetch the complete group with tables
      return await tx.tableGroup.findUnique({
        where: { id: group.id },
        include: {
          tables: {
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
      });
    });

    return NextResponse.json({
      success: true,
      data: tableGroup,
    });
  } catch (error) {
    console.error("Error creating table group:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear el grupo de mesas",
      },
      { status: 500 },
    );
  }
}
