"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Receipt,
  CreditCard,
  Printer,
  DollarSign,
  Trash2,
  Plus,
  Minus,
  Search,
  Sparkles,
  Banknote,
} from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  priceAtSnapshot: number;
  product: {
    id?: string;
    name: string;
  };
}

interface Order {
  id: string;
  items: OrderItem[];
  createdAt: Date;
}

interface Ronda {
  id: string;
  orders: Order[];
}

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: string;
  rondas?: Ronda[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  onSuccess?: () => void;
}

export function CloseTableModal({ isOpen, onClose, table, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [rondaData, setRondaData] = useState<Ronda | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TARJETA">(
    "EFECTIVO",
  );
  const [editedItems, setEditedItems] = useState<
    Map<string, { quantity: number; deleted: boolean }>
  >(new Map());
  const [newItems, setNewItems] = useState<
    Array<{ productId: string; productName: string; quantity: number; price: number }>
  >([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen && table) {
      loadRondaData();
      loadProducts();
      setEditedItems(new Map());
      setNewItems([]);
      setShowProductSearch(false);
      setSearchQuery("");
    }
  }, [isOpen, table]);

  const loadRondaData = async () => {
    if (!table) return;

    try {
      const response = await fetch(`/api/tables/${table.id}/active-ronda`);
      const result = await response.json();

      if (result.success && result.data) {
        setRondaData(result.data);
      }
    } catch (error) {
      console.error("Error loading ronda:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const result = await res.json();
      if (result.success && result.data) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const calculateTotal = () => {
    if (!rondaData?.orders) return 0;

    const existingTotal = rondaData.orders.reduce((total, order) => {
      return (
        total +
        order.items.reduce((orderTotal, item) => {
          const edited = editedItems.get(item.id);
          if (edited?.deleted) return orderTotal;

          const quantity = edited?.quantity ?? item.quantity;
          return orderTotal + Number(item.priceAtSnapshot) * quantity;
        }, 0)
      );
    }, 0);

    const newItemsTotal = newItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return existingTotal + newItemsTotal;
  };

  const getItemQuantity = (itemId: string, originalQuantity: number) => {
    const edited = editedItems.get(itemId);
    return edited?.quantity ?? originalQuantity;
  };

  const isItemDeleted = (itemId: string) => {
    return editedItems.get(itemId)?.deleted ?? false;
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setEditedItems(
      new Map(editedItems.set(itemId, { quantity: newQuantity, deleted: false })),
    );
  };

  const deleteItem = (itemId: string) => {
    const currentQuantity = editedItems.get(itemId)?.quantity ?? 0;
    setEditedItems(
      new Map(editedItems.set(itemId, { quantity: currentQuantity, deleted: true })),
    );
  };

  const restoreItem = (itemId: string, originalQuantity: number) => {
    setEditedItems(
      new Map(editedItems.set(itemId, { quantity: originalQuantity, deleted: false })),
    );
  };

  const addNewItem = (product: Product) => {
    setNewItems([
      ...newItems,
      {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: Number(product.price),
      },
    ]);
    setShowProductSearch(false);
    setSearchQuery("");
  };

  const updateNewItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const updated = [...newItems];
    updated[index].quantity = quantity;
    setNewItems(updated);
  };

  const removeNewItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCloseTable = async () => {
    if (!table || !rondaData) return;

    setLoading(true);
    try {
      const itemEdits = Array.from(editedItems.entries()).map(
        ([itemId, edit]) => ({
          itemId,
          quantity: edit.quantity,
          deleted: edit.deleted,
        }),
      );

      const response = await fetch(`/api/rondas/${rondaData.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          itemEdits: itemEdits.length > 0 ? itemEdits : undefined,
          newItems: newItems.length > 0 ? newItems : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetch(`/api/tables/${table.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "LIBRE" }),
        });

        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error("Error closing table:", error);
      alert("Error al cerrar la mesa");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !table) return null;

  const total = calculateTotal();
  const hasEdits = editedItems.size > 0 || newItems.length > 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-600/20 to-purple-600/20">
          <h2 className="text-2xl font-black text-white">
            CERRAR MESA {table.number}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Orders Summary */}
          <div className="space-y-4">
            {!rondaData?.orders || rondaData.orders.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-slate-500">
                  No hay órdenes activas en esta mesa
                </p>
              </div>
            ) : (
              <>
                {rondaData.orders.map((order) => (
                  <div key={order.id} className="space-y-2">
                    <div className="text-xs text-slate-500">
                      Orden {new Date(order.createdAt).toLocaleString("es-AR", { 
                        day: "numeric", 
                        month: "numeric", 
                        year: "numeric", 
                        hour: "2-digit", 
                        minute: "2-digit" 
                      })}
                    </div>
                    {order.items.map((item) => {
                      const isDeleted = isItemDeleted(item.id);
                      const quantity = getItemQuantity(item.id, item.quantity);
                      const itemTotal = Number(item.priceAtSnapshot) * quantity;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "glass-card p-4 flex justify-between items-center gap-3",
                            isDeleted && "opacity-50 bg-red-500/10",
                          )}
                        >
                          <div className="flex-1">
                            <div className="text-white font-medium">{item.product.name}</div>
                            <div className="text-sm text-slate-400">{formatMoney(Number(item.priceAtSnapshot))} c/u</div>
                          </div>

                          {!isDeleted ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateItemQuantity(item.id, quantity - 1)}
                                disabled={quantity <= 1}
                                className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-30"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-mono">{quantity}</span>
                              <button
                                onClick={() => updateItemQuantity(item.id, quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="ml-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-bold"
                              >
                                Eliminar
                              </button>
                              <div className="ml-2 font-semibold text-lg text-white">
                                {formatMoney(itemTotal)}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => restoreItem(item.id, item.quantity)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-bold"
                            >
                              Restaurar
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* New Items */}
                {newItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      PRODUCTOS AGREGADOS
                    </div>
                    {newItems.map((item, index) => {
                      const itemTotal = item.price * item.quantity;
                      return (
                        <div
                          key={index}
                          className="glass-card p-4 flex justify-between items-center gap-3 border-emerald-500/50"
                        >
                          <div className="flex-1">
                            <div className="text-white font-medium">{item.productName}</div>
                            <div className="text-sm text-slate-400">{formatMoney(item.price)} c/u</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateNewItemQuantity(index, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 flex items-center justify-center bg-emerald-700 hover:bg-emerald-600 rounded disabled:opacity-30"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-mono text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateNewItemQuantity(index, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center bg-emerald-700 hover:bg-emerald-600 rounded"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeNewItem(index)}
                              className="ml-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-bold"
                            >
                              Quitar
                            </button>
                            <div className="ml-2 font-semibold text-lg text-emerald-400">
                              {formatMoney(itemTotal)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Add Product */}
            {!showProductSearch ? (
              <button
                onClick={() => setShowProductSearch(true)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-white"
              >
                <Plus className="w-5 h-5" />
                Agregar Producto
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar producto..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowProductSearch(false);
                      setSearchQuery("");
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {searchQuery && (
                  <div className="max-h-60 overflow-y-auto bg-slate-800 rounded-lg border border-white/10">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">
                        No se encontraron productos
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addNewItem(product)}
                          className="w-full p-3 hover:bg-slate-700 transition-colors text-left flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium text-white">{product.name}</div>
                            <div className="text-xs text-slate-400">{product.category}</div>
                          </div>
                          <div className="font-bold text-emerald-400">
                            {formatMoney(Number(product.price))}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="glass-card p-6 border-2 border-blue-500/50">
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-2">TOTAL</div>
              <div className="text-5xl font-black text-blue-400">
                {formatMoney(total)}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod("EFECTIVO")}
              className={cn(
                "py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2",
                paymentMethod === "EFECTIVO"
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "glass-card text-slate-400 hover:text-white",
              )}
            >
              <Banknote className="w-5 h-5" />
              Efectivo
            </button>
            <button
              onClick={() => setPaymentMethod("TARJETA")}
              className={cn(
                "py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2",
                paymentMethod === "TARJETA"
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "glass-card text-slate-400 hover:text-white",
              )}
            >
              <CreditCard className="w-5 h-5" />
              Tarjeta
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 space-y-3">
          <button
            onClick={() => window.print()}
            disabled={!rondaData || rondaData.orders.length === 0}
            className="w-full py-3 px-6 glass-card hover:bg-white/10 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Imprimir
          </button>

          <button
            onClick={handleCloseTable}
            disabled={loading || !rondaData || rondaData.orders.length === 0}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white"
          >
            <CreditCard className="w-6 h-6" />
            {loading ? "Procesando..." : "Cobrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
