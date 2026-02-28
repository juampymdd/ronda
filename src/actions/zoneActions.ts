"use server";

import { prisma } from "@/lib/prisma";
import { error, success, type Result } from "@/lib/utils";
import { z } from "zod";

// ==================== GET ZONES ====================
export async function getZonesAction(): Promise<Result<any>> {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        _count: {
          select: {
            tables: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    return success(zones);
  } catch (e) {
    console.error("Get zones error:", e);
    return error("Error loading zones");
  }
}

// ==================== CREATE ZONE ====================
const CreateZoneSchema = z.object({
  name: z.string().min(1).toUpperCase(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  capacity: z.number().int().min(1).max(100).default(20),
  width: z.number().min(400).max(1200).default(600),
  height: z.number().min(300).max(800).default(400),
});

export async function createZoneAction(
  rawData: z.infer<typeof CreateZoneSchema>,
): Promise<Result<any>> {
  try {
    const data = CreateZoneSchema.parse(rawData);

    // Check if zone name already exists
    const existing = await prisma.zone.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return error("Zone name already exists");
    }

    const zone = await prisma.zone.create({
      data,
    });

    return success(zone);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error("Invalid zone data");
    }
    console.error("Create zone error:", e);
    return error("Internal server error creating zone");
  }
}

// ==================== UPDATE ZONE ====================
const UpdateZoneSchema = z.object({
  id: z.string(),
  name: z.string().min(1).toUpperCase().optional(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional(),
  capacity: z.number().int().min(1).max(100).optional(),
  width: z.number().min(400).max(1200).optional(),
  height: z.number().min(300).max(800).optional(),
});

export async function updateZoneAction(
  rawData: z.infer<typeof UpdateZoneSchema>,
): Promise<Result<any>> {
  try {
    const { id, ...updateData } = UpdateZoneSchema.parse(rawData);

    // If updating name, check it doesn't conflict
    if (updateData.name) {
      const existing = await prisma.zone.findFirst({
        where: {
          name: updateData.name,
          id: { not: id },
        },
      });

      if (existing) {
        return error("Zone name already exists");
      }
    }

    const zone = await prisma.zone.update({
      where: { id },
      data: updateData,
    });

    return success(zone);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error("Invalid zone data");
    }
    console.error("Update zone error:", e);
    return error("Internal server error updating zone");
  }
}

// ==================== DELETE ZONE ====================
export async function deleteZoneAction(zoneId: string): Promise<Result<any>> {
  try {
    // Check if zone has tables
    const tablesCount = await prisma.table.count({
      where: { zoneId },
    });

    if (tablesCount > 0) {
      return error(`Cannot delete zone with ${tablesCount} tables`);
    }

    await prisma.zone.delete({
      where: { id: zoneId },
    });

    return success({ message: "Zone deleted successfully" });
  } catch (e) {
    console.error("Delete zone error:", e);
    return error("Internal server error deleting zone");
  }
}
