"use client";

import React, { useState } from "react";
import { X, UtensilsCrossed } from "lucide-react";
import { openTableAction } from "@/actions/tableActions";

interface Zone {
  id: string;
  name: string;
}

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: string;
  zone: Zone | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  onSuccess?: () => void;
}

export function OpenTableModal({ isOpen, onClose, table, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenTable = async () => {
    if (!table) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await openTableAction({ tableId: table.id });

      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setErrorMsg(result.error ?? "Error al abrir la mesa");
      }
    } catch (e) {
      console.error("Error opening table:", e);
      setErrorMsg("Error inesperado al abrir la mesa");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !table) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-600/20 to-blue-600/20">
          <h2 className="text-2xl font-black italic text-white">
            ABRIR MESA {table.number}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Table info */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                Mesa
              </span>
              <span className="text-white font-black text-xl">
                {table.number}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                Capacidad
              </span>
              <span className="text-white font-bold">
                {table.capacity} personas
              </span>
            </div>
            {table.zone && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                  Zona
                </span>
                <span className="text-white font-bold">{table.zone.name}</span>
              </div>
            )}
          </div>

          <p className="text-slate-400 text-sm text-center">
            Se creará una nueva ronda y la mesa quedará marcada como ocupada.
          </p>

          {errorMsg && (
            <div className="glass-card border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-300 text-sm font-bold text-center">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 space-y-3">
          <button
            onClick={handleOpenTable}
            disabled={loading}
            className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-500 rounded-xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white"
          >
            <UtensilsCrossed className="w-6 h-6" />
            {loading ? "Abriendo..." : "Abrir Mesa"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-3 px-6 glass-card hover:bg-white/10 rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
