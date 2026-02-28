import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReservationStatus, TableStatus } from "@prisma/client";

// POST /api/reservations/[id]/seat - Seat customer (change reservation to SEATED, table to OCUPADA, create ronda)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reservationId } = await params;

    // Get reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        table: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reserva no encontrada" },
        { status: 404 },
      );
    }

    // Validate reservation status
    if (reservation.status === ReservationStatus.SEATED) {
      return NextResponse.json(
        { success: false, error: "Esta reserva ya fue sentada" },
        { status: 400 },
      );
    }

    if (
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.NO_SHOW
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "No se puede sentar una reserva cancelada o no show",
        },
        { status: 400 },
      );
    }

    // Check if table has active ronda
    const activeRonda = await prisma.ronda.findFirst({
      where: {
        tableId: reservation.tableId,
        isActive: true,
      },
    });

    if (activeRonda) {
      return NextResponse.json(
        { success: false, error: "La mesa ya tiene una ronda activa" },
        { status: 400 },
      );
    }

    // Create ronda and update reservation and table in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create ronda
      const ronda = await tx.ronda.create({
        data: {
          tableId: reservation.tableId,
          isActive: true,
        },
      });

      // Update reservation status
      const updatedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.SEATED },
        include: {
          table: {
            include: {
              zone: {
                select: {
                  name: true,
                  color: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update table status
      await tx.table.update({
        where: { id: reservation.tableId },
        data: { status: TableStatus.OCUPADA },
      });

      return { ronda, reservation: updatedReservation };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error seating customer:", error);
    return NextResponse.json(
      { success: false, error: "Error al sentar al cliente" },
      { status: 500 },
    );
  }
}
