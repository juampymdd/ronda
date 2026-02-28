import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReservationStatus, TableStatus } from "@prisma/client";

// PATCH /api/reservations/[id]/status - Update reservation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reservationId } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!Object.values(ReservationStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: "Estado de reserva inválido" },
        { status: 400 },
      );
    }

    // Get current reservation
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

    // Update reservation
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status },
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

    // Handle table status updates based on reservation status
    if (status === ReservationStatus.CANCELLED || status === ReservationStatus.NO_SHOW) {
      // Check if there are other active reservations for this table
      const otherActiveReservations = await prisma.reservation.findMany({
        where: {
          tableId: reservation.tableId,
          id: { not: reservationId },
          status: {
            in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.SEATED],
          },
        },
      });

      // If no other active reservations, set table to LIBRE
      if (otherActiveReservations.length === 0 && reservation.table.status === TableStatus.RESERVADA) {
        await prisma.table.update({
          where: { id: reservation.tableId },
          data: { status: TableStatus.LIBRE },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedReservation,
    });
  } catch (error) {
    console.error("Error updating reservation status:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la reserva" },
      { status: 500 },
    );
  }
}
