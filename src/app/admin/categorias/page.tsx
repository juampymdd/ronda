"use client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil, Tag, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { getCategoriesAction, deleteCategoryAction } from "@/actions/categoryActions";
import { CategoryModal } from "@/features/admin/components/CategoryModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SkeletonStatCard, SkeletonCard } from "@/components/skeletons";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  _count: { products: number };
  createdAt: Date;
}

type LucideIcon = React.ComponentType<{
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}>;

function DynamicIcon({
  name,
  size = 24,
  style,
  className,
}: {
  name: string;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[name];
  if (!Icon) return <Tag size={size} style={style} className={className} />;
  return <Icon size={size} style={style} className={className} />;
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    const result = await getCategoriesAction();
    if (result.success) {
      setCategories(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDeleteClick = (cat: Category) => {
    setDeletingCategory(cat);
    setDeleteError("");
    setConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deletingCategory) return;
    setConfirmOpen(false);
    const result = await deleteCategoryAction(deletingCategory.id);
    if (result.success) {
      loadCategories();
    } else {
      setDeleteError(result.error || "Error al eliminar categoría");
    }
    setDeletingCategory(null);
  };

  const totalProducts = categories.reduce(
    (sum, c) => sum + c._count.products,
    0,
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter">
            CATEGORÍAS
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
            Organizá los productos del menú
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCategory(null);
            setModalOpen(true);
          }}
          className="glass-card px-6 py-3 flex items-center gap-3 hover:bg-purple-600 hover:border-purple-600 transition-all"
        >
          <Plus size={20} />
          <span className="font-bold text-sm">NUEVA CATEGORÍA</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          <>
            <SkeletonStatCard borderColor="border-purple-500/30" />
            <SkeletonStatCard borderColor="border-blue-500/30" />
            <SkeletonStatCard borderColor="border-emerald-500/30" />
          </>
        ) : (
          <>
        <div className="glass-card p-4 border-2 border-purple-500/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total Categorías
          </p>
          <p className="text-3xl font-black mt-2">{categories.length}</p>
        </div>
        <div className="glass-card p-4 border-2 border-blue-500/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total Productos
          </p>
          <p className="text-3xl font-black mt-2">{totalProducts}</p>
        </div>
        <div className="glass-card p-4 border-2 border-emerald-500/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Promedio Productos
          </p>
          <p className="text-3xl font-black mt-2">
            {categories.length > 0
              ? (totalProducts / categories.length).toFixed(1)
              : 0}
          </p>
        </div>
          </>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </>
        ) : categories.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center">
            <Tag size={64} className="mx-auto text-purple-500 mb-4 opacity-50" />
            <h3 className="text-xl font-black mb-2">No hay categorías creadas</h3>
            <p className="text-slate-400 mb-6">
              Crea categorías para organizar los productos del menú
            </p>
            <button
              onClick={() => {
                setEditingCategory(null);
                setModalOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Crear Primera Categoría
            </button>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="glass-card p-6 border-2 hover:border-opacity-80 transition-all group"
              style={{ borderColor: `${cat.color}40` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}25` }}
                  >
                    <DynamicIcon name={cat.icon ?? "Tag"} size={24} style={{ color: cat.color }} />
                  </div>
                  <div>
                    <h3
                      className="text-xl font-black"
                      style={{ color: cat.color }}
                    >
                      {cat.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {cat._count.products}{" "}
                      {cat._count.products === 1 ? "producto" : "productos"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Color preview */}
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Color
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-white/10"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-mono text-slate-400">
                    {cat.color}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setEditingCategory(cat);
                    setModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors font-bold"
                >
                  <Pencil size={16} />
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteClick(cat)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors font-bold"
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        category={editingCategory}
        onSuccess={loadCategories}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        title="ELIMINAR CATEGORÍA"
        message={`¿Estás seguro que querés eliminar "${deletingCategory?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => { setConfirmOpen(false); setDeletingCategory(null); }}
      />

      {deleteError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-2xl z-50 flex items-center gap-4">
          {deleteError}
          <button onClick={() => setDeleteError("")} className="underline text-sm">Cerrar</button>
        </div>
      )}
    </div>
  );
}
