"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Pencil, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createTableAction,
  updateTableAction,
  deleteTableAction,
} from "@/actions/tableActions";
import { getZonesAction } from "@/actions/zoneActions";
import { TableStatus } from "@prisma/client";

interface Zone {
  id: string;
  name: string;
  color: string;
  capacity: number;
  width: number;
  height: number;
}

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  zone: Zone | null;
  x: number;
  y: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  table?: Table | null;
  onSuccess: () => void;
}

export function TableAdminModal({ isOpen, onClose, table, onSuccess }: Props) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [formData, setFormData] = useState({
    number: table?.number || 1,
    capacity: table?.capacity || 2,
    zoneId: table?.zone?.id || "",
    x: table?.x || 100,
    y: table?.y || 100,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load zones on mount
  useEffect(() => {
    const loadZones = async () => {
      const result = await getZonesAction();
      if (result.success && result.data) {
        setZones(result.data);
        // Set default zone if creating new table and zones exist
        if (!table && result.data.length > 0 && !formData.zoneId) {
          setFormData((prev) => ({ ...prev, zoneId: result.data[0].id }));
        }
      }
    };
    loadZones();
  }, []);

  // Update form when table changes
  useEffect(() => {
    if (table) {
      setFormData({
        number: table.number,
        capacity: table.capacity,
        zoneId: table.zone?.id || "",
        x: table.x,
        y: table.y,
      });
    }
  }, [table]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      let result;
      if (table) {
        // Update existing table
        result = await updateTableAction({
          id: table.id,
          ...formData,
        });
      } else {
        // Create new table
        result = await createTableAction(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.error || "Error saving table");
      }
    } catch (error) {
      setErrorMsg("Unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!table) return;

    if (!confirm(`¿Eliminar mesa ${table.number}?`)) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await deleteTableAction(table.id);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.error || "Error deleting table");
      }
    } catch (error) {
      setErrorMsg("Unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-black italic">
            {table ? "EDITAR MESA" : "NUEVA MESA"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Número de Mesa
            </label>
            <input
              type="number"
              min="1"
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: parseInt(e.target.value) })
              }
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-brand-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Capacidad (personas)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: parseInt(e.target.value) })
              }
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-brand-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Zona
            </label>
            <select
              value={formData.zoneId}
              onChange={(e) =>
                setFormData({ ...formData, zoneId: e.target.value })
              }
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-brand-primary transition-colors"
              required
            >
              <option value="">Seleccionar zona</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Posición X
              </label>
              <input
                type="number"
                value={formData.x}
                onChange={(e) =>
                  setFormData({ ...formData, x: parseFloat(e.target.value) })
                }
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-brand-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Posición Y
              </label>
              <input
                type="number"
                value={formData.y}
                onChange={(e) =>
                  setFormData({ ...formData, y: parseFloat(e.target.value) })
                }
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-brand-primary transition-colors"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {table && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 bg-red-500/10 border border-red-500 text-red-500 px-6 py-3 rounded-lg font-black uppercase tracking-wider hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-brand-primary hover:bg-brand-primary/90 px-6 py-3 rounded-lg font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {isLoading ? "Guardando..." : table ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
