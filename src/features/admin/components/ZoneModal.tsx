"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";
import {
  createZoneAction,
  updateZoneAction,
  deleteZoneAction,
} from "@/actions/zoneActions";

interface Zone {
  id: string;
  name: string;
  color: string;
  capacity: number;
  width: number;
  height: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  zone?: Zone | null;
  onSuccess: () => void;
}

const PRESET_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#a855f7", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#8b5cf6", // violet
];

export function ZoneModal({ isOpen, onClose, zone, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    capacity: 20,
    width: 600,
    height: 400,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name,
        color: zone.color,
        capacity: zone.capacity,
        width: zone.width,
        height: zone.height,
      });
    } else {
      setFormData({
        name: "",
        color: "#3b82f6",
        capacity: 20,
        width: 600,
        height: 400,
      });
    }
    setErrorMsg("");
  }, [zone, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      let result;
      if (zone) {
        result = await updateZoneAction({
          id: zone.id,
          ...formData,
        });
      } else {
        result = await createZoneAction(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.error || "Error saving zone");
      }
    } catch (error) {
      setErrorMsg("Unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!zone) return;

    if (!confirm(`¿Eliminar zona ${zone.name}?`)) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await deleteZoneAction(zone.id);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.error || "Error deleting zone");
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
            {zone ? "EDITAR ZONA" : "NUEVA ZONA"}
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
              Nombre de la Zona
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value.toUpperCase() })
              }
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500 transition-colors uppercase"
              placeholder="Ej: TERRAZA"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Capacidad (personas)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Ancho (px)
              </label>
              <input
                type="number"
                min="400"
                max="1200"
                step="50"
                value={formData.width}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    width: parseInt(e.target.value) || 400,
                  })
                }
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Alto (px)
            </label>
            <input
              type="number"
              min="300"
              max="800"
              step="50"
              value={formData.height}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  height: parseInt(e.target.value) || 300,
                })
              }
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Color
            </label>

            {/* Preset Colors */}
            <div className="grid grid-cols-8 gap-2 mb-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    formData.color === color
                      ? "border-white scale-110"
                      : "border-white/10 hover:border-white/30"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Custom Color Picker */}
            <div className="flex gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-16 h-12 bg-slate-950 border border-white/10 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="#3b82f6"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
              />
            </div>
          </div>

          {/* Preview */}
          <div
            className="glass-card p-4 border-2"
            style={{ borderColor: `${formData.color}40` }}
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Vista Previa
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl"
                  style={{ backgroundColor: `${formData.color}30` }}
                />
                <div>
                  <span
                    className="font-black text-lg block"
                    style={{ color: formData.color }}
                  >
                    {formData.name || "NOMBRE ZONA"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formData.capacity} personas · {formData.width}x
                    {formData.height}px
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {zone && (
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
              className="flex-1 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {isLoading ? "Guardando..." : zone ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
