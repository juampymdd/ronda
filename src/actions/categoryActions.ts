"use server";

import { prisma } from "@/lib/prisma";
import { error, success, type Result } from "@/lib/utils";
import { z } from "zod";

// ==================== GET CATEGORIES ====================
export async function getCategoriesAction(): Promise<Result<any>> {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return success(categories);
  } catch (e) {
    console.error("Get categories error:", e);
    return error("Error al cargar categorías");
  }
}

// ==================== CREATE CATEGORY ====================
const CreateCategorySchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  icon: z.string().min(1).default("Tag"),
});

export async function createCategoryAction(
  rawData: z.infer<typeof CreateCategorySchema>,
): Promise<Result<any>> {
  try {
    const data = CreateCategorySchema.parse(rawData);

    const existing = await prisma.category.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return error("Ya existe una categoría con ese nombre");
    }

    const category = await prisma.category.create({ data });
    return success(category);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error("Datos de categoría inválidos");
    }
    console.error("Create category error:", e);
    return error("Error interno al crear categoría");
  }
}

// ==================== UPDATE CATEGORY ====================
const UpdateCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional(),
  icon: z.string().min(1).optional(),
});

export async function updateCategoryAction(
  rawData: z.infer<typeof UpdateCategorySchema>,
): Promise<Result<any>> {
  try {
    const { id, ...updateData } = UpdateCategorySchema.parse(rawData);

    if (updateData.name) {
      const existing = await prisma.category.findFirst({
        where: { name: updateData.name, id: { not: id } },
      });
      if (existing) {
        return error("Ya existe una categoría con ese nombre");
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });
    return success(category);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error("Datos de categoría inválidos");
    }
    console.error("Update category error:", e);
    return error("Error interno al actualizar categoría");
  }
}

// ==================== DELETE CATEGORY ====================
export async function deleteCategoryAction(
  categoryId: string,
): Promise<Result<any>> {
  try {
    const productsCount = await prisma.product.count({
      where: { categoryId },
    });

    if (productsCount > 0) {
      return error(
        `No se puede eliminar: la categoría tiene ${productsCount} producto(s) asociado(s)`,
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });
    return success({ message: "Categoría eliminada correctamente" });
  } catch (e) {
    console.error("Delete category error:", e);
    return error("Error interno al eliminar categoría");
  }
}
