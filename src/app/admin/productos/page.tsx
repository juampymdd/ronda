"use client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil, ShoppingBag, Tag, Archive, ArchiveRestore } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  getAllProductsAction,
  deleteProductAction,
  restoreProductAction,
} from "@/actions/productActions";
import { ProductModal } from "@/features/admin/components/ProductModal";
import { formatMoney } from "@/lib/utils";
import { ProductType } from "@prisma/client";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
  category: Category;
  price: number;
  type: ProductType;
  deletedAt: string | null;
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

const typeConfig: Record<
  ProductType,
  { label: string; color: string; bg: string; border: string }
> = {
  BARRRA: {
    label: "BARRA",
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500",
  },
  COCINA: {
    label: "COCINA",
    color: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500",
  },
};

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);

  // Confirm dialog state (used for both archive and restore)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionProduct, setActionProduct] = useState<Product | null>(null);
  const [pendingAction, setPendingAction] = useState<"archive" | "restore">("archive");
  const [actionError, setActionError] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    const result = await getAllProductsAction();
    if (result.success) {
      setProducts(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleArchiveClick = (product: Product) => {
    setActionProduct(product);
    setPendingAction("archive");
    setActionError("");
    setConfirmOpen(true);
  };

  const handleRestoreClick = (product: Product) => {
    setActionProduct(product);
    setPendingAction("restore");
    setActionError("");
    setConfirmOpen(true);
  };

  const executeAction = async () => {
    if (!actionProduct) return;
    setConfirmOpen(false);
    const result =
      pendingAction === "archive"
        ? await deleteProductAction(actionProduct.id)
        : await restoreProductAction(actionProduct.id);
    if (result.success) {
      loadProducts();
    } else {
      setActionError(result.error || "Error al procesar la acción");
    }
    setActionProduct(null);
  };

  const activeProducts = products.filter((p) => p.deletedAt === null);
  const archivedProducts = products.filter((p) => p.deletedAt !== null);

  // Category options only from active products
  const categoryOptions = Array.from(
    new Map(activeProducts.map((p) => [p.category.id, p.category])).values(),
  );

  const filteredActive =
    categoryFilter === "all"
      ? activeProducts
      : activeProducts.filter((p) => p.category.id === categoryFilter);

  const totalBarra = activeProducts.filter((p) => p.type === ProductType.BARRRA).length;
  const totalCocina = activeProducts.filter((p) => p.type === ProductType.COCINA).length;

  const renderProductCard = (product: Product, archived = false) => {
    const type = typeConfig[product.type];
    return (
      <div
        key={product.id}
        className={`glass-card p-6 border-2 transition-all group ${
          archived
            ? "border-white/5 opacity-50 hover:opacity-70"
            : "border-white/5 hover:border-purple-500/50"
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: archived ? "#1e293b" : `${product.category.color}25` }}
            >
              <DynamicIcon
                name={product.category.icon ?? "Tag"}
                size={24}
                style={{ color: archived ? "#64748b" : product.category.color }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black leading-tight">{product.name}</h3>
                {archived && (
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-700 text-slate-400 border border-slate-600">
                    ARCHIVADO
                  </span>
                )}
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-md mt-0.5 inline-block"
                style={{
                  backgroundColor: archived ? "#1e293b" : `${product.category.color}25`,
                  color: archived ? "#64748b" : product.category.color,
                }}
              >
                {product.category.name}
              </span>
            </div>
          </div>
        </div>

        {/* Price + Type */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-2xl font-black ${archived ? "text-slate-500" : "text-emerald-400"}`}>
            {formatMoney(product.price)}
          </span>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-black border ${
              archived
                ? "bg-slate-700/30 text-slate-500 border-slate-600"
                : `${type.bg} ${type.color} ${type.border}`
            }`}
          >
            {type.label}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-white/10">
          {!archived && (
            <button
              onClick={() => {
                setEditingProduct(product);
                setModalOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors font-bold"
            >
              <Pencil size={16} />
              Editar
            </button>
          )}
          {archived ? (
            <button
              onClick={() => handleRestoreClick(product)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors font-bold"
            >
              <ArchiveRestore size={16} />
              Restaurar
            </button>
          ) : (
            <button
              onClick={() => handleArchiveClick(product)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors font-bold"
            >
              <Archive size={16} />
              Archivar
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter">PRODUCTOS</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
            Gestiona el menú y precios
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setModalOpen(true);
          }}
          className="glass-card px-6 py-3 flex items-center gap-3 hover:bg-purple-600 hover:border-purple-600 transition-all"
        >
          <Plus size={20} />
          <span className="font-bold text-sm">NUEVO PRODUCTO</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 border-2 border-purple-500/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Activos</p>
          <p className="text-3xl font-black mt-2">{activeProducts.length}</p>
        </div>
        <div className="glass-card p-4 border-2 border-amber-500/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">De Barra</p>
          <p className="text-3xl font-black mt-2">{totalBarra}</p>
        </div>
        <div className="glass-card p-4 border-2 border-red-500/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">De Cocina</p>
          <p className="text-3xl font-black mt-2">{totalCocina}</p>
        </div>
        {archivedProducts.length > 0 && (
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="glass-card p-4 border-2 border-slate-600/50 hover:border-slate-500 transition-all text-left"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Archivados</p>
            <p className="text-3xl font-black mt-2 text-slate-500">{archivedProducts.length}</p>
            <p className="text-xs text-slate-500 mt-1">{showArchived ? "Ocultar" : "Ver"}</p>
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
            categoryFilter === "all"
              ? "bg-purple-600 text-white"
              : "glass-card text-slate-400 hover:text-white"
          }`}
        >
          Todos
          <span className="ml-2 text-xs opacity-60">({activeProducts.length})</span>
        </button>
        {categoryOptions.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              categoryFilter === cat.id
                ? "text-white"
                : "glass-card text-slate-400 hover:text-white"
            }`}
            style={
              categoryFilter === cat.id
                ? { backgroundColor: cat.color, borderColor: cat.color }
                : {}
            }
          >
            {cat.name}
            <span className="ml-2 text-xs opacity-60">
              ({activeProducts.filter((p) => p.category.id === cat.id).length})
            </span>
          </button>
        ))}
      </div>

      {/* Active Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-500 col-span-full text-center py-12">Cargando...</p>
        ) : filteredActive.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center">
            <ShoppingBag size={64} className="mx-auto text-purple-500 mb-4 opacity-50" />
            <h3 className="text-xl font-black mb-2">
              {activeProducts.length === 0
                ? "No hay productos cargados"
                : "Sin productos en esta categoría"}
            </h3>
            <p className="text-slate-400 mb-6">
              {activeProducts.length === 0
                ? "Crea tu primer producto para armar el menú"
                : "Probá con otra categoría o creá uno nuevo"}
            </p>
            {activeProducts.length === 0 && (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setModalOpen(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Crear Primer Producto
              </button>
            )}
          </div>
        ) : (
          filteredActive.map((product) => renderProductCard(product, false))
        )}
      </div>

      {/* Archived Products (collapsible) */}
      {showArchived && archivedProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Archive size={18} className="text-slate-500" />
            <h2 className="text-lg font-black text-slate-500 uppercase tracking-widest">
              Archivados ({archivedProducts.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedProducts.map((product) => renderProductCard(product, true))}
          </div>
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editingProduct}
        onSuccess={loadProducts}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        title={pendingAction === "archive" ? "ARCHIVAR PRODUCTO" : "RESTAURAR PRODUCTO"}
        message={
          pendingAction === "archive"
            ? `¿Archivar "${actionProduct?.name}"? Va a desaparecer del menú pero lo podés restaurar cuando quieras.`
            : `¿Restaurar "${actionProduct?.name}"? Va a volver a aparecer en el menú.`
        }
        confirmLabel={pendingAction === "archive" ? "Archivar" : "Restaurar"}
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={executeAction}
        onCancel={() => {
          setConfirmOpen(false);
          setActionProduct(null);
        }}
      />

      {actionError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-2xl z-50 flex items-center gap-4">
          {actionError}
          <button onClick={() => setActionError("")} className="underline text-sm">
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
