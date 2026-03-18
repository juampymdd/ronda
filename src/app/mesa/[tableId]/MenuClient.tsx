"use client";

import React, { useState, useTransition, useEffect, useCallback, useRef } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Bell,
  Receipt,
  X,
  CheckCircle,
  Loader2,
  Pizza,
  Clock,
  ChefHat,
  PackageCheck,
  CircleDot,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ElementType } from "react";
import { cn, formatMoney } from "@/lib/utils";
import {
  createOrderFromQR,
  callWaiterAction,
  requestBillAction,
} from "@/actions/qrActions";

function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = (LucideIcons as unknown as Record<string, ElementType>)[name];
  if (!Icon) return null;
  return <Icon {...props} />;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  price: number;
  type: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  products: Product[];
}

interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}

interface ActiveOrderItem {
  id: string;
  quantity: number;
  priceAtSnapshot: string | number;
  product: { name: string };
}

interface ActiveOrder {
  id: string;
  status: "PENDIENTE" | "PREPARANDO" | "LISTO" | "ENTREGADO";
  source: string;
  createdAt: string;
  items: ActiveOrderItem[];
}

interface Props {
  tableId: string;
  tableNumber: number;
  tableStatus: string;
  categories: Category[];
}

type Toast = { id: number; message: string; type: "success" | "error" };

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDIENTE: {
    label: "Esperando aprobación",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    Icon: Clock,
  },
  PREPARANDO: {
    label: "En preparación",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
    Icon: ChefHat,
  },
  LISTO: {
    label: "¡Listo para servir!",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
    Icon: PackageCheck,
  },
  ENTREGADO: {
    label: "Entregado",
    color: "text-slate-400",
    bg: "bg-slate-400/10 border-slate-400/20",
    Icon: CheckCircle,
  },
} as const;

let toastId = 0;

// ─── Component ────────────────────────────────────────────────────────────────

export default function MenuClient({
  tableId,
  tableNumber,
  categories,
}: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "pedidos">("menu");
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id ?? null
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isPending, startTransition] = useTransition();
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [billRequested, setBillRequested] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // ── Polling de pedidos activos ─────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/tables/${tableId}/active-ronda`);
      const json = await res.json();
      if (json.success && json.data) {
        setActiveOrders(json.data.orders ?? []);
      }
    } catch {
      // silencioso — no interrumpir la experiencia del cliente
    }
  }, [tableId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const addToast = (message: string, type: "success" | "error") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // ── Carrito ────────────────────────────────────────────────────────────────
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      return [...prev, { product, quantity: 1, notes: "" }];
    });
  };

  const removeOne = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((i) => i.product.id !== productId);
      return prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  };

  const removeItem = (productId: string) =>
    setCart((prev) => prev.filter((i) => i.product.id !== productId));

  const updateNotes = (productId: string, notes: string) =>
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, notes } : i))
    );

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // ── Acciones ───────────────────────────────────────────────────────────────
  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    startTransition(async () => {
      const result = await createOrderFromQR({
        tableId,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
      });
      if (result.success) {
        setCart([]);
        setCartOpen(false);
        // Refetch inmediato para mostrar el nuevo pedido
        await fetchOrders();
        setActiveTab("pedidos");
        addToast("¡Pedido enviado! El mozo lo está revisando.", "success");
      } else {
        addToast(result.error, "error");
      }
    });
  };

  const handleCallWaiter = () => {
    startTransition(async () => {
      const result = await callWaiterAction(tableId);
      if (result.success) {
        setWaiterCalled(true);
        addToast("¡Mozo avisado! Ya va para tu mesa.", "success");
        setTimeout(() => setWaiterCalled(false), 30_000);
      } else {
        addToast(result.error, "error");
      }
    });
  };

  const handleRequestBill = () => {
    startTransition(async () => {
      const result = await requestBillAction(tableId);
      if (result.success) {
        setBillRequested(true);
        addToast("Cuenta solicitada. El mozo la trae en breve.", "success");
      } else {
        addToast(result.error, "error");
      }
    });
  };

  // ── Contadores de pedidos activos ──────────────────────────────────────────
  const pendingOrLiveOrders = activeOrders.filter(
    (o) => o.status !== "ENTREGADO"
  );

  return (
    <div className="max-w-2xl mx-auto pb-28">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header ref={headerRef} className="px-4 pt-8 pb-3 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2.5 rounded-xl">
              <Pizza size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tight">CARTA</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                Mesa {tableNumber}
              </p>
            </div>
          </div>

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative bg-purple-600 hover:bg-purple-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 ? (
              <span>{formatMoney(cartTotal)}</span>
            ) : (
              <span className="text-purple-200">Carrito</span>
            )}
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center pointer-events-none">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Tabs: Menu / Mis pedidos */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-3">
          <button
            onClick={() => setActiveTab("menu")}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all",
              activeTab === "menu"
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:text-white"
            )}
          >
            Carta
          </button>
          <div className="relative flex-1">
            <button
              onClick={() => setActiveTab("pedidos")}
              className={cn(
                "w-full py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all",
                activeTab === "pedidos"
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Mis pedidos
            </button>
            {pendingOrLiveOrders.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center pointer-events-none">
                {pendingOrLiveOrders.length}
              </span>
            )}
          </div>
        </div>

        {/* Category tabs — only visible on Carta tab */}
        {activeTab === "menu" && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  const el = document.getElementById(`cat-${cat.id}`);
                  if (!el) return;
                  const headerHeight = headerRef.current?.offsetHeight ?? 160;
                  const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
                  window.scrollTo({ top, behavior: "smooth" });
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all border",
                  activeCategory === cat.id
                    ? "text-white border-transparent"
                    : "border-white/10 text-slate-400 hover:text-white bg-transparent"
                )}
                style={
                  activeCategory === cat.id
                    ? { backgroundColor: cat.color, borderColor: cat.color }
                    : {}
                }
              >
                <DynamicIcon name={cat.icon} size={12} />
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Tab: Carta ─────────────────────────────────────────────────────── */}
      {activeTab === "menu" && (
        <>
          {/* Product sections */}
          <div className="px-4 mt-5 isolate space-y-0">
            {categories.map((cat) => (
              <section key={cat.id} id={`cat-${cat.id}`} className="pt-8 first:pt-0">
                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/5">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: cat.color + "22" }}>
                    <DynamicIcon name={cat.icon} size={18} style={{ color: cat.color }} />
                  </div>
                  <h2
                    className="text-lg font-black italic uppercase tracking-tight"
                    style={{ color: cat.color }}
                  >
                    {cat.name}
                  </h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <div className="space-y-2">
                  {cat.products.map((product) => {
                    const inCart = cart.find((i) => i.product.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className="glass-card flex items-center justify-between px-4 py-3 gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{product.name}</p>
                          <p className="text-xs font-black" style={{ color: cat.color }}>
                            {formatMoney(product.price)}
                          </p>
                        </div>

                        {inCart ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => removeOne(product.id)}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-black text-sm w-5 text-center">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => addToCart(product)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ backgroundColor: cat.color }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0"
                            style={{ backgroundColor: cat.color + "33" }}
                          >
                            <Plus size={16} style={{ color: cat.color }} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {/* ── Tab: Mis pedidos ───────────────────────────────────────────────── */}
      {activeTab === "pedidos" && (
        <div className="px-4 mt-5 space-y-4">
          {activeOrders.length === 0 ? (
            <div className="text-center py-20 text-slate-500 space-y-2">
              <CircleDot size={36} className="mx-auto opacity-30" />
              <p className="italic text-sm">No hay pedidos activos todavía.</p>
              <button
                onClick={() => setActiveTab("menu")}
                className="mt-2 text-purple-400 font-bold text-sm underline"
              >
                Ir a la carta
              </button>
            </div>
          ) : (
            activeOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.status];
              const StatusIcon = cfg.Icon;
              const orderTotal = order.items.reduce(
                (sum, i) => sum + Number(i.priceAtSnapshot) * i.quantity,
                0
              );
              const minutesAgo = Math.floor(
                (Date.now() - new Date(order.createdAt).getTime()) / 60_000
              );

              return (
                <div
                  key={order.id}
                  className={cn("glass-card overflow-hidden border", cfg.bg)}
                >
                  {/* Status bar */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className={cn("flex items-center gap-2 font-bold text-sm", cfg.color)}>
                      <StatusIcon size={16} />
                      {cfg.label}
                    </div>
                    <span className="text-xs text-slate-500">
                      {minutesAgo === 0 ? "ahora" : `hace ${minutesAgo} min`}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="px-4 pb-3 space-y-1.5 border-t border-white/5 pt-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="font-bold">
                          {item.quantity}× {item.product.name}
                        </span>
                        <span className="text-slate-400 font-bold text-xs">
                          {formatMoney(Number(item.priceAtSnapshot) * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-white/5 flex justify-between">
                      <span className="text-xs text-slate-500 uppercase tracking-wide font-bold">Total</span>
                      <span className="font-black text-sm">{formatMoney(orderTotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Bottom action bar: Llamar mozo + Pedir cuenta ──────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-slate-950/95 backdrop-blur-sm border-t border-white/5 flex gap-3 z-40">
        <button
          onClick={handleCallWaiter}
          disabled={isPending || waiterCalled}
          className={cn(
            "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors border",
            waiterCalled
              ? "bg-amber-500/20 border-amber-500/40 text-amber-300 opacity-70"
              : "glass-card border-transparent hover:bg-amber-500/20 hover:border-amber-500/30 text-amber-400"
          )}
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Bell size={16} />
          )}
          {waiterCalled ? "Mozo avisado" : "Llamar mozo"}
        </button>

        <button
          onClick={handleRequestBill}
          disabled={isPending || billRequested}
          className={cn(
            "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors border",
            billRequested
              ? "bg-blue-500/20 border-blue-500/40 text-blue-300 opacity-70"
              : "glass-card border-transparent hover:bg-blue-500/20 hover:border-blue-500/30 text-blue-400"
          )}
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Receipt size={16} />
          )}
          {billRequested ? "Cuenta pedida" : "Pedir cuenta"}
        </button>
      </div>

      {/* ── Cart Drawer (bottom sheet) ─────────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          {/* Sheet */}
          <div className="relative w-full bg-slate-900 rounded-t-2xl flex flex-col max-h-[85dvh]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black italic flex items-center gap-2">
                <ShoppingCart size={20} className="text-purple-400" />
                TU PEDIDO
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
              {cart.length === 0 ? (
                <p className="text-slate-500 italic text-center mt-12">
                  Tu carrito está vacío.
                </p>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="glass-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm">{item.product.name}</p>
                        <p className="text-xs text-purple-400 font-black">
                          {formatMoney(item.product.price * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeOne(item.product.id)}
                          className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-black text-sm w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item.product)}
                          className="w-6 h-6 rounded-md bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="w-6 h-6 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 flex items-center justify-center transition-colors ml-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Notas (sin sal, sin cebolla...)"
                      value={item.notes}
                      onChange={(e) => updateNotes(item.product.id, e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Footer — siempre visible */}
            <div className="px-6 pt-4 pb-8 border-t border-white/10 space-y-3 shrink-0 bg-slate-900">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold text-sm">TOTAL</span>
                <span className="text-xl font-black">{formatMoney(cartTotal)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={cart.length === 0 || isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-black text-base tracking-wide transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                ENVIAR PEDIDO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toasts ─────────────────────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "px-4 py-3 rounded-xl text-sm font-bold shadow-xl pointer-events-auto",
              t.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
