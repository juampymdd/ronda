"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Trash2, Tag, Search } from "lucide-react";
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
  // Bebidas
  { name: "Beer", label: "Cerveza" },
  { name: "Wine", label: "Vino" },
  { name: "BottleWine", label: "Botella" },
  { name: "Martini", label: "Cóctel" },
  { name: "Coffee", label: "Café" },
  { name: "Milk", label: "Lácteo" },
  { name: "GlassWater", label: "Agua" },
  { name: "CupSoda", label: "Gaseosa" },
  { name: "Citrus", label: "Jugo" },
  // Carnes y proteínas
  { name: "Beef", label: "Carne" },
  { name: "Hamburger", label: "Hamburguesa" },
  { name: "Drumstick", label: "Pollo" },
  { name: "Ham", label: "Fiambre" },
  { name: "Shrimp", label: "Mariscos" },
  { name: "Fish", label: "Pescado" },
  { name: "Egg", label: "Huevo" },
  { name: "EggFried", label: "Frito" },
  // Platos principales
  { name: "Pizza", label: "Pizza" },
  { name: "Slice", label: "Porción" },
  { name: "Sandwich", label: "Sandwich" },
  { name: "Soup", label: "Sopas" },
  { name: "Salad", label: "Ensalada" },
  { name: "CookingPot", label: "Guiso" },
  // Desayuno / panadería
  { name: "Croissant", label: "Panadería" },
  // Frutas y verduras
  { name: "Apple", label: "Fruta" },
  { name: "Banana", label: "Banana" },
  { name: "Cherry", label: "Cereza" },
  { name: "Grape", label: "Uva" },
  { name: "Carrot", label: "Verduras" },
  { name: "LeafyGreen", label: "Vegetariano" },
  { name: "Leaf", label: "Vegano" },
  { name: "Nut", label: "Frutos secos" },
  // Postres
  { name: "IceCream", label: "Helado" },
  { name: "IceCream2", label: "Helado 2" },
  { name: "IceCreamCone", label: "Helado cono" },
  { name: "IceCreamBowl", label: "Helado taza" },
  { name: "Donut", label: "Donas" },
  { name: "CakeSlice", label: "Torta" },
  { name: "Cake", label: "Cumpleaños" },
  { name: "Cookie", label: "Galleta" },
  { name: "Candy", label: "Golosinas" },
  // Snacks
  { name: "Popcorn", label: "Snacks" },
  // Cocina / general
  { name: "Flame", label: "Parrilla" },
  { name: "Microwave", label: "Calentar" },
  { name: "ForkKnife", label: "Menú" },
  { name: "ForkKnifeCrossed", label: "Sin TACC" },
  { name: "Utensils", label: "Cubiertos" },
  { name: "UtensilsCrossed", label: "Cocina" },
  { name: "ChefHat", label: "Especial chef" },
  { name: "Wheat", label: "Pasta / Cereal" },
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
  const [iconSearch, setIconSearch] = useState("");

  useEffect(() => {
    if (category) {
      setFormData({ name: category.name, color: category.color, icon: category.icon ?? "Beer" });
    } else {
      setFormData({ name: "", color: "#a855f7", icon: "Beer" });
    }
    setErrorMsg("");
    setIconSearch("");
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
            {/* Buscador */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder="Buscar ícono..."
                className="w-full bg-slate-950 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
              {iconSearch && (
                <button
                  type="button"
                  onClick={() => setIconSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            {/* Grid filtrado */}
            {(() => {
              const filtered = FOOD_ICONS.filter(({ label, name }) =>
                label.toLowerCase().includes(iconSearch.toLowerCase()) ||
                name.toLowerCase().includes(iconSearch.toLowerCase())
              );
              return filtered.length > 0 ? (
                <div className="grid grid-cols-7 gap-2">
                  {filtered.map(({ name, label }) => (
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
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Sin resultados</p>
              );
            })()}
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
