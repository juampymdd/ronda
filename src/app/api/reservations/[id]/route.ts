import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReservationStatus, TableStatus } from "@prisma/client";

// DELETE /api/reservations/[id] - Cancel/delete reservation
export async function DELETE(
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

    // Cannot delete a seated reservation (must close the ronda first)
    if (reservation.status === ReservationStatus.SEATED) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se puede eliminar una reserva ya sentada. Cierre la ronda primero.",
        },
        { status: 400 },
      );
    }

    // Delete reservation
    await prisma.reservation.delete({
      where: { id: reservationId },
    });

    // Check if there are other active reservations for this table
    const otherActiveReservations = await prisma.reservation.findMany({
      where: {
        tableId: reservation.tableId,
        status: {
          in: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.SEATED,
          ],
        },
      },
    });

    // If no other active reservations and table is RESERVADA, set to LIBRE
    if (
      otherActiveReservations.length === 0 &&
      reservation.table.status === TableStatus.RESERVADA
    ) {
      await prisma.table.update({
        where: { id: reservation.tableId },
        data: { status: TableStatus.LIBRE },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Reserva eliminada correctamente",
    });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar la reserva" },
      { status: 500 },
    );
  }
}
