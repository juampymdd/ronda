"use client";

import React from "react";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  UserX,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { ReservationStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string | null;
  partySize: number;
  reservationTime: Date;
  duration: number;
  status: ReservationStatus;
  notes: string | null;
  table: {
    id: string;
    number: number;
    capacity: number;
    zone: {
      name: string;
      color: string;
    } | null;
  };
  createdBy: {
    id: string;
    name: string | null;
  };
  createdAt: Date;
}

interface ReservationCardProps {
  reservation: Reservation;
  onStatusChange?: (id: string, status: ReservationStatus) => void;
  onSeat?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusConfig = {
  PENDING: {
    label: "Pendiente",
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/50",
    icon: AlertCircle,
  },
  CONFIRMED: {
    label: "Confirmada",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/50",
    icon: CheckCircle2,
  },
  SEATED: {
    label: "Sentada",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/50",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelada",
    color: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/50",
    icon: XCircle,
  },
  NO_SHOW: {
    label: "No Show",
    color: "text-slate-400",
    bg: "bg-slate-500/20",
    border: "border-slate-500/50",
    icon: UserX,
  },
};

export function ReservationCard({
  reservation,
  onStatusChange,
  onSeat,
  onDelete,
}: ReservationCardProps) {
  const config = statusConfig[reservation.status];
  const Icon = config.icon;
  const reservationDate = new Date(reservation.reservationTime);
  const now = new Date();
  const isPast = reservationDate < now;
  const isToday =
    reservationDate.toDateString() === now.toDateString();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div
      className={cn(
        "glass-card p-5 border-2 transition-all hover:scale-[1.01]",
        config.border,
        isPast && reservation.status === ReservationStatus.PENDING && "opacity-60",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg"
            style={{
              backgroundColor: reservation.table.zone?.color || "#6b7280",
            }}
          >
            {reservation.table.number}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {reservation.table.zone?.name || "Sin zona"}
            </p>
            <p className="text-lg font-bold text-white">Mesa {reservation.table.number}</p>
          </div>
        </div>
        <div className={cn("px-3 py-1.5 rounded-lg flex items-center gap-1.5", config.bg)}>
          <Icon size={14} className={config.color} />
          <span className={cn("text-xs font-bold uppercase tracking-wider", config.color)}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-white">
          <User size={16} className="text-slate-400" />
          <span className="font-bold">{reservation.customerName}</span>
        </div>
        {reservation.customerPhone && (
          <div className="flex items-center gap-2 text-slate-300">
            <Phone size={16} className="text-slate-400" />
            <span className="text-sm">{reservation.customerPhone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-slate-300">
          <Users size={16} className="text-slate-400" />
          <span className="text-sm">{reservation.partySize} personas</span>
        </div>
      </div>

      {/* Date and Time */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-purple-400" />
          <span className={cn("text-sm font-bold", isToday ? "text-purple-400" : "text-slate-300")}>
            {isToday ? "Hoy" : formatDate(reservationDate)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-purple-400" />
          <span className="text-sm font-bold text-slate-300">
            {formatTime(reservationDate)} ({reservation.duration} min)
          </span>
        </div>
      </div>

      {/* Notes */}
      {reservation.notes && (
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-white/10">
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-bold">Notas:</p>
          <p className="text-sm text-slate-300">{reservation.notes}</p>
        </div>
      )}

      {/* Actions */}
      {(reservation.status === ReservationStatus.PENDING ||
        reservation.status === ReservationStatus.CONFIRMED) && (
        <div className="flex gap-2">
          {reservation.status === ReservationStatus.PENDING && (
            <button
              onClick={() => onStatusChange?.(reservation.id, ReservationStatus.CONFIRMED)}
              className="flex-1 px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all"
            >
              Confirmar
            </button>
          )}
          {reservation.status === ReservationStatus.CONFIRMED && (
            <button
              onClick={() => onSeat?.(reservation.id)}
              className="flex-1 px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              Sentar Cliente
              <ChevronRight size={16} />
            </button>
          )}
          <button
            onClick={() => onStatusChange?.(reservation.id, ReservationStatus.CANCELLED)}
            className="px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/50 transition-all"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
        <span>Por {reservation.createdBy.name || "Usuario"}</span>
        <span>
          {formatDistanceToNow(new Date(reservation.createdAt), {
            addSuffix: true,
            locale: es,
          })}
        </span>
      </div>
    </div>
  );
}
