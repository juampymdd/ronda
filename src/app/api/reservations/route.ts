import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReservationStatus, TableStatus } from "@prisma/client";

// GET /api/reservations - List reservations with filters
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date"); // YYYY-MM-DD format
    const status = searchParams.get("status");
    const tableId = searchParams.get("tableId");

    const where: any = {};

    // Filter by date (reservations for a specific day)
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.reservationTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Filter by status
    if (status && status !== "ALL") {
      where.status = status as ReservationStatus;
    }

    // Filter by table
    if (tableId) {
      where.tableId = tableId;
    }

    const reservations = await prisma.reservation.findMany({
      where,
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
      orderBy: {
        reservationTime: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar las reservas",
      },
      { status: 500 },
    );
  }
}

// POST /api/reservations - Create new reservation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tableId,
      customerName,
      customerPhone,
      partySize,
      reservationTime,
      duration,
      notes,
      createdById,
    } = body;

    // Validate required fields
    if (!tableId || !customerName || !partySize || !reservationTime || !createdById) {
      return NextResponse.json(
        {
          success: false,
          error: "Faltan campos requeridos",
        },
        { status: 400 },
      );
    }

    // Check if table exists and has sufficient capacity
    const table = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      return NextResponse.json(
        {
          success: false,
          error: "Mesa no encontrada",
        },
        { status: 404 },
      );
    }

    if (table.capacity < partySize) {
      return NextResponse.json(
        {
          success: false,
          error: `La mesa ${table.number} tiene capacidad para ${table.capacity} personas, pero la reserva es para ${partySize}`,
        },
        { status: 400 },
      );
    }

    // Check for conflicting reservations
    const reservationDateTime = new Date(reservationTime);
    const durationMinutes = duration || 120;
    const endTime = new Date(reservationDateTime.getTime() + durationMinutes * 60000);

    const conflictingReservations = await prisma.reservation.findMany({
      where: {
        tableId,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.SEATED],
        },
        AND: [
          {
            reservationTime: {
              lt: endTime,
            },
          },
          {
            reservationTime: {
              gte: new Date(reservationDateTime.getTime() - 120 * 60000), // 2 hours before
            },
          },
        ],
      },
    });

    if (conflictingReservations.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Ya existe una reserva para esta mesa en ese horario",
        },
        { status: 409 },
      );
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        tableId,
        customerName,
        customerPhone,
        partySize,
        reservationTime: reservationDateTime,
        duration: durationMinutes,
        notes,
        createdById,
        status: ReservationStatus.PENDING,
      },
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

    // Update table status to RESERVADA if not already occupied
    if (table.status === TableStatus.LIBRE) {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: TableStatus.RESERVADA },
      });
    }

    return NextResponse.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear la reserva",
      },
      { status: 500 },
    );
  }
}
