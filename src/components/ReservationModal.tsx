"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, Users, Phone, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Table {
  id: string;
  number: number;
  capacity: number;
  zone: {
    name: string;
    color: string;
  } | null;
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: Table | null;
  userId: string; // The user creating the reservation
  onSuccess?: () => void;
}

export function ReservationModal({
  isOpen,
  onClose,
  selectedTable,
  userId,
  onSuccess,
}: ReservationModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [duration, setDuration] = useState(120); // Default 2 hours
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !selectedTable) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Combine date and time
      const reservationDateTime = new Date(
        `${reservationDate}T${reservationTime}`,
      );

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId: selectedTable.id,
          customerName,
          customerPhone: customerPhone || null,
          partySize,
          reservationTime: reservationDateTime.toISOString(),
          duration,
          notes: notes || null,
          createdById: userId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Error al crear la reserva");
        return;
      }

      // Success
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Error creating reservation:", err);
      setError("Error al crear la reserva");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCustomerName("");
    setCustomerPhone("");
    setPartySize(2);
    setReservationDate("");
    setReservationTime("");
    setDuration(120);
    setNotes("");
    setError("");
    onClose();
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-white/20">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter">
              NUEVA RESERVA
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Mesa {selectedTable.number} -{" "}
              {selectedTable.zone?.name || "Sin zona"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
              <User size={16} />
              Nombre del cliente *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
              <Phone size={16} />
              Teléfono
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Ej: +54 9 11 1234-5678"
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          {/* Party Size */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
              <Users size={16} />
              Cantidad de personas *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPartySize(size)}
                  className={cn(
                    "flex-1 py-3 rounded-lg font-bold transition-all",
                    partySize === size
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10",
                    size > selectedTable.capacity && "opacity-50",
                  )}
                  disabled={size > selectedTable.capacity}
                >
                  {size}
                </button>
              ))}
            </div>
            {partySize > selectedTable.capacity && (
              <p className="text-amber-400 text-sm mt-2">
                ⚠️ La mesa tiene capacidad para {selectedTable.capacity}{" "}
                personas
              </p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
                <Calendar size={16} />
                Fecha *
              </label>
              <input
                type="date"
                required
                min={today}
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
                <Clock size={16} />
                Hora *
              </label>
              <input
                type="time"
                required
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
              <Clock size={16} />
              Duración estimada
            </label>
            <div className="flex gap-2">
              {[60, 90, 120, 150, 180].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={cn(
                    "flex-1 py-2 rounded-lg font-bold transition-all text-sm",
                    duration === mins
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10",
                  )}
                >
                  {mins / 60}h
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
              <FileText size={16} />
              Notas adicionales
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Cumpleaños, alergias, preferencias..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-bold uppercase tracking-wider bg-slate-800/50 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || partySize > selectedTable.capacity}
              className="flex-1 px-6 py-3 rounded-lg font-bold uppercase tracking-wider bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando..." : "Crear Reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
