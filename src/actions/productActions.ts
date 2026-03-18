"use server";

import { prisma } from "@/lib/prisma";
import { error, success, type Result } from "@/lib/utils";
import { ProductType } from "@prisma/client";
import { z } from "zod";

// ==================== GET PRODUCTS ====================
export async function getProductsAction(): Promise<Result<any>> {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: { category: true },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    });
    return success(
      products.map((p) => ({ ...p, price: p.price.toNumber() })),
    );
  } catch (e) {
    console.error("Get products error:", e);
    return error("Error al cargar productos");
  }
}

// ==================== GET ALL PRODUCTS (admin, incluye archivados) ====================
export async function getAllProductsAction(): Promise<Result<any>> {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: [{ deletedAt: "asc" }, { category: { name: "asc" } }, { name: "asc" }],
    });
    return success(
      products.map((p) => ({
        ...p,
        price: p.price.toNumber(),
        deletedAt: p.deletedAt?.toISOString() ?? null,
      })),
    );
  } catch (e) {
    console.error("Get all products error:", e);
    return error("Error al cargar productos");
  }
}

// ==================== CREATE PRODUCT ====================
const CreateProductSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  price: z.number().positive(),
  type: z.nativeEnum(ProductType),
});

export async function createProductAction(
  rawData: z.infer<typeof CreateProductSchema>,
): Promise<Result<any>> {
  try {
    const data = CreateProductSchema.parse(rawData);

    const product = await prisma.product.create({
      data,
      include: { category: true },
    });

    return success({ ...product, price: product.price.toNumber() });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error("Datos de producto inválidos");
    }
    console.error("Create product error:", e);
    return error("Error interno al crear producto");
  }
}

// ==================== UPDATE PRODUCT ====================
const UpdateProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  type: z.nativeEnum(ProductType).optional(),
});

export async function updateProductAction(
  rawData: z.infer<typeof UpdateProductSchema>,
): Promise<Result<any>> {
  try {
    const { id, ...updateData } = UpdateProductSchema.parse(rawData);

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return success({ ...product, price: product.price.toNumber() });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error("Datos de producto inválidos");
    }
    console.error("Update product error:", e);
    return error("Error interno al actualizar producto");
  }
}

// ==================== DELETE PRODUCT (soft delete) ====================
export async function deleteProductAction(
  productId: string,
): Promise<Result<any>> {
  try {
    // Soft delete: setea deletedAt en vez de borrar la fila
    // Si ya está archivado, no hace nada (idempotente)
    await prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });
    return success({ message: "Producto archivado correctamente" });
  } catch (e) {
    console.error("Delete product error:", e);
    return error("Error interno al archivar producto");
  }
}

// ==================== FIND SIMILAR ARCHIVED PRODUCTS ====================

/** Distancia de Levenshtein normalizada [0–1]. 0 = idéntico, 1 = sin relación. */
function levenshteinSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const m = s1.length;
  const n = s2.length;
  if (m === 0 || n === 0) return m === n ? 1 : 0;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        s1[i - 1] === s2[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return 1 - dp[m][n] / Math.max(m, n);
}

/**
 * Devuelve los productos archivados cuyo nombre es similar al dado.
 * Umbral: similaridad >= 0.6 (60% de caracteres en común aprox.)
 */
export async function findSimilarArchivedProductsAction(
  name: string,
): Promise<Result<any>> {
  try {
    const archived = await prisma.product.findMany({
      where: { deletedAt: { not: null } },
      include: { category: true },
    });

    const THRESHOLD = 0.6;
    const similar = archived
      .map((p) => ({
        ...p,
        price: p.price.toNumber(),
        deletedAt: p.deletedAt?.toISOString() ?? null,
        similarity: levenshteinSimilarity(name, p.name),
      }))
      .filter((p) => p.similarity >= THRESHOLD)
      .sort((a, b) => b.similarity - a.similarity);

    return success(similar);
  } catch (e) {
    console.error("Find similar archived products error:", e);
    return error("Error al buscar productos similares");
  }
}

// ==================== RESTORE PRODUCT ====================
export async function restoreProductAction(
  productId: string,
): Promise<Result<any>> {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { deletedAt: null },
    });
    return success({ message: "Producto restaurado correctamente" });
  } catch (e) {
    console.error("Restore product error:", e);
    return error("Error interno al restaurar producto");
  }
}
