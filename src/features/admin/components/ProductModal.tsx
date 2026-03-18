"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Archive, Tag, ArrowRight, ArchiveRestore } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  restoreProductAction,
  findSimilarArchivedProductsAction,
} from "@/actions/productActions";
import { getCategoriesAction } from "@/actions/categoryActions";
import { ProductType } from "@prisma/client";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatMoney } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
  category: Category;
  price: number | string;
  type: ProductType;
  deletedAt?: string | null;
}

interface ArchivedSuggestion {
  id: string;
  name: string;
  category: Category;
  price: number;
  type: ProductType;
  similarity: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: () => void;
}

export function ProductModal({ isOpen, onClose, product, onSuccess }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    price: "",
    type: ProductType.BARRRA as ProductType,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Sugerencias de restauración
  const [suggestions, setSuggestions] = useState<ArchivedSuggestion[]>([]);
  const [showingSuggestions, setShowingSuggestions] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<typeof formData | null>(null);

  useEffect(() => {
    setLoadingCategories(true);
    getCategoriesAction().then((res) => {
      if (res.success) setCategories(res.data);
      setLoadingCategories(false);
    });
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        categoryId: product.categoryId,
        price: String(product.price),
        type: product.type,
      });
    } else {
      setFormData({
        name: "",
        categoryId: categories[0]?.id ?? "",
        price: "",
        type: ProductType.BARRRA,
      });
    }
    setErrorMsg("");
    setSuggestions([]);
    setShowingSuggestions(false);
    setPendingFormData(null);
  }, [product, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg("El precio debe ser un número positivo");
      setIsLoading(false);
      return;
    }

    if (!formData.categoryId) {
      setErrorMsg("Seleccioná una categoría");
      setIsLoading(false);
      return;
    }

    // Solo busca similares al CREAR (no al editar)
    if (!product) {
      const similarResult = await findSimilarArchivedProductsAction(formData.name);
      if (similarResult.success && similarResult.data.length > 0) {
        setSuggestions(similarResult.data);
        setPendingFormData(formData);
        setShowingSuggestions(true);
        setIsLoading(false);
        return;
      }
    }

    await doCreate(formData);
  };

  const doCreate = async (data: typeof formData) => {
    setIsLoading(true);
    setErrorMsg("");
    const priceNum = parseFloat(data.price);

    try {
      let result;
      if (product) {
        result = await updateProductAction({
          id: product.id,
          name: data.name,
          categoryId: data.categoryId,
          price: priceNum,
          type: data.type,
        });
      } else {
        result = await createProductAction({
          name: data.name,
          categoryId: data.categoryId,
          price: priceNum,
          type: data.type,
        });
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.error || "Error al guardar producto");
        setShowingSuggestions(false);
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado");
      setShowingSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreSuggestion = async (suggestionId: string) => {
    setIsLoading(true);
    const result = await restoreProductAction(suggestionId);
    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(result.error || "Error al restaurar producto");
      setShowingSuggestions(false);
    }
    setIsLoading(false);
  };

  const handleIgnoreSuggestions = async () => {
    if (!pendingFormData) return;
    setShowingSuggestions(false);
    setSuggestions([]);
    await doCreate(pendingFormData);
  };

  const handleDelete = async () => {
    if (!product) return;
    setConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!product) return;
    setConfirmOpen(false);
    setIsLoading(true);
    setErrorMsg("");
    try {
      const result = await deleteProductAction(product.id);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.error || "Error al archivar producto");
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // No categories exist — show redirect prompt
  if (!loadingCategories && categories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-2xl font-black italic">NUEVO PRODUCTO</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <Tag size={32} className="text-amber-400" />
            </div>
            <h3 className="text-xl font-black">No hay categorías creadas</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Para crear un producto primero necesitás tener al menos una categoría.
            </p>
            <button
              onClick={() => { onClose(); router.push("/admin/categorias"); }}
              className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 mt-2"
            >
              Ir a Categorías
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedCategory = categories.find((c) => c.id === formData.categoryId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">

        {/* ── PANTALLA DE SUGERENCIAS ── */}
        {showingSuggestions ? (
          <>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-black italic">PRODUCTOS SIMILARES</h2>
                <p className="text-xs text-slate-400 mt-0.5">Encontramos archivados parecidos</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm text-slate-300">
                Antes de crear <span className="font-black text-white">"{pendingFormData?.name}"</span>, ¿querés restaurar alguno de estos?
              </p>

              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="glass-card p-4 border border-white/10 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black truncate">{s.name}</span>
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          backgroundColor: `${s.category.color}25`,
                          color: s.category.color,
                        }}
                      >
                        {s.category.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-emerald-400 font-bold text-sm">{formatMoney(s.price)}</span>
                      <span className="text-slate-500 text-xs">
                        {Math.round(s.similarity * 100)}% similar
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreSuggestion(s.id)}
                    disabled={isLoading}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors font-bold text-sm disabled:opacity-50"
                  >
                    <ArchiveRestore size={15} />
                    Restaurar
                  </button>
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowingSuggestions(false); setSuggestions([]); }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 glass-card font-bold text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Volver al form
                </button>
                <button
                  onClick={handleIgnoreSuggestions}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save size={15} />
                  {isLoading ? "Creando..." : "Crear igual"}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── FORMULARIO NORMAL ── */
          <>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-black italic">
                {product ? "EDITAR PRODUCTO" : "NUEVO PRODUCTO"}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm">
                  {errorMsg}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Ej: IPA Artesanal"
                  required
                />
              </div>

              {/* Categoría + Precio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Categoría
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500 transition-colors"
                    required
                  >
                    <option value="" disabled>Seleccioná...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="4500.00"
                    required
                  />
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Preparado en
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: ProductType.BARRRA })}
                    className={`py-3 rounded-lg font-black text-sm uppercase tracking-wider transition-all border ${
                      formData.type === ProductType.BARRRA
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    Barra
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: ProductType.COCINA })}
                    className={`py-3 rounded-lg font-black text-sm uppercase tracking-wider transition-all border ${
                      formData.type === ProductType.COCINA
                        ? "bg-red-500/20 border-red-500 text-red-400"
                        : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    Cocina
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="glass-card p-4 border-2 border-white/10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Vista Previa
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-lg block">
                      {formData.name || "Nombre del producto"}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-md"
                      style={
                        selectedCategory
                          ? { backgroundColor: `${selectedCategory.color}30`, color: selectedCategory.color }
                          : {}
                      }
                    >
                      {selectedCategory?.name ?? "Categoría"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-400 text-lg block">
                      ${formData.price ? parseFloat(formData.price).toLocaleString("es-AR") : "0"}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        formData.type === ProductType.BARRRA
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {formData.type === ProductType.BARRRA ? "BARRA" : "COCINA"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {product && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex-1 bg-orange-500/10 border border-orange-500 text-orange-400 px-6 py-3 rounded-lg font-black uppercase tracking-wider hover:bg-orange-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Archive size={16} />
                    Archivar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {isLoading ? "Guardando..." : product ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="ARCHIVAR PRODUCTO"
        message={`¿Archivar "${product?.name}"? Va a desaparecer del menú pero lo podés restaurar cuando quieras.`}
        confirmLabel="Archivar"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={executeDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
