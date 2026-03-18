"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Trash2, Tag } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/actions/categoryActions";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  onSuccess: () => void;
}

const PRESET_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#8b5cf6",
];

const FOOD_ICONS: { name: string; label: string }[] = [
  { name: "Beer", label: "Cerveza" },
  { name: "Wine", label: "Vino" },
  { name: "Coffee", label: "Café" },
  { name: "Milk", label: "Lácteo" },
  { name: "GlassWater", label: "Agua / Trago" },
  { name: "CupSoda", label: "Gaseosa" },
  { name: "Grape", label: "Frutado" },
  { name: "Apple", label: "Fruta" },
  { name: "Pizza", label: "Pizza" },
  { name: "Sandwich", label: "Sandwich" },
  { name: "Beef", label: "Carne" },
  { name: "Fish", label: "Pescado" },
  { name: "Salad", label: "Ensalada" },
  { name: "Soup", label: "Sopas" },
  { name: "Egg", label: "Desayuno" },
  { name: "Croissant", label: "Panadería" },
  { name: "Cookie", label: "Postre" },
  { name: "IceCream", label: "Helado" },
  { name: "Candy", label: "Golosinas" },
  { name: "Popcorn", label: "Snacks" },
  { name: "Drumstick", label: "Pollo" },
  { name: "Ham", label: "Fiambre" },
  { name: "Citrus", label: "Jugo" },
  { name: "Flame", label: "Parrilla" },
  { name: "Leaf", label: "Vegano" },
  { name: "Wheat", label: "Pasta" },
  { name: "ChefHat", label: "Especial chef" },
  { name: "UtensilsCrossed", label: "Cocina" },
  { name: "Tag", label: "Genérico" },
];

type LucideIcon = React.ComponentType<{
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}>;

function DynamicIcon({
  name,
  size = 20,
  className,
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[name];
  if (!Icon) return <Tag size={size} className={className} style={style} />;
  return <Icon size={size} className={className} style={style} />;
}

export function CategoryModal({ isOpen, onClose, category, onSuccess }: Props) {
  const [formData, setFormData] = useState({ name: "", color: "#a855f7", icon: "Beer" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({ name: category.name, color: category.color, icon: category.icon ?? "Beer" });
    } else {
      setFormData({ name: "", color: "#a855f7", icon: "Beer" });
    }
    setErrorMsg("");
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = category
        ? await updateCategoryAction({ id: category.id, ...formData })
        : await createCategoryAction(formData);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.error || "Error al guardar categoría");
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    setConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!category) return;
    setConfirmOpen(false);
    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await deleteCategoryAction(category.id);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.error || "Error al eliminar categoría");
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-2xl font-black italic">
            {category ? "EDITAR CATEGORÍA" : "NUEVA CATEGORÍA"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Nombre de la Categoría
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Ej: Cervezas"
              required
            />
          </div>

          {/* Ícono */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Ícono
            </label>
            <div className="grid grid-cols-7 gap-2">
              {FOOD_ICONS.map(({ name, label }) => (
                <button
                  key={name}
                  type="button"
                  title={label}
                  onClick={() => setFormData({ ...formData, icon: name })}
                  className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${
                    formData.icon === name
                      ? "scale-110"
                      : "border-white/10 hover:border-white/30 bg-white/5"
                  }`}
                  style={
                    formData.icon === name
                      ? {
                          backgroundColor: `${formData.color}30`,
                          borderColor: formData.color,
                        }
                      : {}
                  }
                >
                  <DynamicIcon
                    name={name}
                    size={18}
                    style={{ color: formData.icon === name ? formData.color : undefined }}
                    className={formData.icon === name ? undefined : "text-slate-400"}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Color
            </label>
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
            <div className="flex gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-12 bg-slate-950 border border-white/10 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="#a855f7"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
              />
            </div>
          </div>

          {/* Preview */}
          <div
            className="glass-card p-4 border-2"
            style={{ borderColor: `${formData.color}40` }}
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Vista Previa
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${formData.color}25` }}
              >
                <DynamicIcon name={formData.icon} size={24} style={{ color: formData.color }} />
              </div>
              <span
                className="font-black text-lg px-3 py-1 rounded-lg"
                style={{
                  backgroundColor: `${formData.color}25`,
                  color: formData.color,
                }}
              >
                {formData.name || "Nombre categoría"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {category && (
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
              {isLoading ? "Guardando..." : category ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="ELIMINAR CATEGORÍA"
        message={`¿Estás seguro que querés eliminar "${category?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
