"use server";

import { prisma } from "@/lib/prisma";
import { error, success, type Result } from "@/lib/utils";
import { z } from "zod";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// ==================== GET USERS ====================
export async function getUsersAction(): Promise<Result<any>> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return success(users);
  } catch (e) {
    console.error("Get users error:", e);
    return error("Error loading users");
  }
}

// ==================== CREATE USER ====================
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
});

export async function createUserAction(
  rawData: z.infer<typeof CreateUserSchema>,
): Promise<Result<any>> {
  try {
    const data = CreateUserSchema.parse(rawData);

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return error("Email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return success(user);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error("Invalid user data");
    }
    console.error("Create user error:", e);
    return error("Internal server error creating user");
  }
}

// ==================== UPDATE USER ====================
const UpdateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
  password: z.string().min(6).optional(),
});

export async function updateUserAction(
  rawData: z.infer<typeof UpdateUserSchema>,
): Promise<Result<any>> {
  try {
    const { id, password, ...updateData } = UpdateUserSchema.parse(rawData);

    // If updating email, check it doesn't conflict
    if (updateData.email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: id },
        },
      });

      if (existing) {
        return error("Email already exists");
      }
    }

    const dataToUpdate: any = { ...updateData };

    // Hash password if provided
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return success(user);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error("Invalid user data");
    }
    console.error("Update user error:", e);
    return error("Internal server error updating user");
  }
}

// ==================== DELETE USER ====================
export async function deleteUserAction(userId: string): Promise<Result<any>> {
  try {
    // Check if user has orders
    const ordersCount = await prisma.order.count({
      where: { mozoId: userId },
    });

    if (ordersCount > 0) {
      return error(`Cannot delete user with ${ordersCount} orders`);
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return success({ message: "User deleted successfully" });
  } catch (e) {
    console.error("Delete user error:", e);
    return error("Internal server error deleting user");
  }
}
