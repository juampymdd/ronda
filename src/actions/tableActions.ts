"use server";

import { prisma } from "@/lib/prisma";
import { error, success, type Result } from "@/lib/utils";
import { z } from "zod";
import { TableStatus } from "@prisma/client";

// ==================== GET TABLES ====================
export async function getTablesAction(): Promise<Result<any>> {
  try {
    const tables = await prisma.table.findMany({
      include: {
        zone: true,
      },
      orderBy: [{ number: "asc" }],
    });
    return success(tables);
  } catch (e) {
    console.error("Get tables error:", e);
    return error("Error loading tables");
  }
}

// ==================== CREATE TABLE ====================
const CreateTableSchema = z.object({
  number: z.number().int().positive(),
  capacity: z.number().int().positive(),
  zoneId: z.string().min(1),
  x: z.number(),
  y: z.number(),
});

export async function createTableAction(
  rawData: z.infer<typeof CreateTableSchema>,
): Promise<Result<any>> {
  try {
    const data = CreateTableSchema.parse(rawData);

    // Check if table number already exists
    const existing = await prisma.table.findUnique({
      where: { number: data.number },
    });

    if (existing) {
      return error("Table number already exists");
    }

    const table = await prisma.table.create({
      data: {
        ...data,
        status: TableStatus.LIBRE,
      },
      include: {
        zone: true,
      },
    });

    return success(table);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error("Invalid table data");
    }
    console.error("Create table error:", e);
    return error("Internal server error creating table");
  }
}

// ==================== UPDATE TABLE ====================
const UpdateTableSchema = z.object({
  id: z.string(),
  number: z.number().int().positive().optional(),
  capacity: z.number().int().positive().optional(),
  zoneId: z.string().min(1).optional(),
  status: z.nativeEnum(TableStatus).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

export async function updateTableAction(
  rawData: z.infer<typeof UpdateTableSchema>,
): Promise<Result<any>> {
  try {
    const { id, ...updateData } = UpdateTableSchema.parse(rawData);

    // If updating number, check it doesn't conflict
    if (updateData.number) {
      const existing = await prisma.table.findFirst({
        where: {
          number: updateData.number,
          id: { not: id },
        },
      });

      if (existing) {
        return error("Table number already exists");
      }
    }

    const table = await prisma.table.update({
      where: { id },
      data: updateData,
      include: {
        zone: true,
      },
    });

    return success(table);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error("Invalid table data");
    }
    console.error("Update table error:", e);
    return error("Internal server error updating table");
  }
}

// ==================== DELETE TABLE ====================
export async function deleteTableAction(tableId: string): Promise<Result<any>> {
  try {
    // Check if table has active rondas
    const activeRonda = await prisma.ronda.findFirst({
      where: {
        tableId,
        isActive: true,
      },
    });

    if (activeRonda) {
      return error("Cannot delete table with active orders");
    }

    await prisma.table.delete({
      where: { id: tableId },
    });

    return success({ message: "Table deleted successfully" });
  } catch (e) {
    console.error("Delete table error:", e);
    return error("Internal server error deleting table");
  }
}

// ==================== UPDATE TABLE POSITION ====================
const UpdatePositionSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
});

export async function updateTablePositionAction(
  rawData: z.infer<typeof UpdatePositionSchema>,
): Promise<Result<any>> {
  try {
    const { id, x, y } = UpdatePositionSchema.parse(rawData);

    const table = await prisma.table.update({
      where: { id },
      data: { x, y },
      include: {
        zone: true,
      },
    });

    return success(table);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error("Invalid position data");
    }
    console.error("Update position error:", e);
    return error("Internal server error updating position");
  }
}

// ==================== CLOSE TABLE ====================
const CloseTableSchema = z.object({
  tableId: z.string(),
  paymentMethod: z.string(), // EFECTIVO, TARJETA, etc.
  splitType: z.string().default("SINGLE"),
});

export async function closeTableAction(
  rawData: z.infer<typeof CloseTableSchema>,
): Promise<Result<any>> {
  try {
    const { tableId, paymentMethod, splitType } =
      CloseTableSchema.parse(rawData);

    return await prisma.$transaction(async (tx) => {
      // 1. Find active Ronda
      const ronda = await tx.ronda.findFirst({
        where: { tableId, isActive: true },
        include: {
          orders: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!ronda) {
        return error("No active ronda found for this table");
      }

      // 2. Calculate Total
      let total = 0;
      ronda.orders.forEach((order) => {
        order.items.forEach((item) => {
          total += Number(item.priceAtSnapshot) * item.quantity;
        });
      });

      // 3. Create Payment record
      const payment = await tx.payment.create({
        data: {
          rondaId: ronda.id,
          amount: total,
          method: paymentMethod,
          splitType: splitType,
        },
      });

      // 4. Deactivate Ronda
      await tx.ronda.update({
        where: { id: ronda.id },
        data: { isActive: false },
      });

      // 5. Release Table
      await tx.table.update({
        where: { id: tableId },
        data: { status: TableStatus.LIBRE },
      });

      return success({ paymentId: payment.id, total });
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error("Invalid closure data");
    }
    console.error("Table closure error:", e);
    return error("Internal server error during table closure");
  }
}
