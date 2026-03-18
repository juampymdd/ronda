"use client";

import React, {
  useState,
  useTransition,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle,
  Loader2,
  Pizza,
  Clock,
  ChefHat,
  PackageCheck,
  CircleDot,
  Search,
  ArrowLeft,
  XCircle,
  Bike,
  AlertTriangle,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ElementType } from "react";
import { cn, formatMoney } from "@/lib/utils";
import { processOrderAction } from "@/actions/orderActions";
import { CloseTableModal } from "@/features/floorplan/components/CloseTableModal";

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
  product: Product & { categoryId: string; categoryColor: string };
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
  mozo: { id: string; name: string | null } | null;
  items: ActiveOrderItem[];
}

interface Props {
  tableId: string;
  tableNumber: number;
  tableStatus: string;
  mozoId: string;
  categories: Category[];
}

type Toast = { id: number; message: string; type: "success" | "error" };

// ─── SLA en minutos por estado — cuándo se considera "demorado" ───────────────
const SLA: Record<string, number> = {
  PENDIENTE: 3,   // si no entró a preparación en 3 min → alerta
  PREPARANDO: 12, // si no está listo en 12 min → alerta
  LISTO: 5,       // si no fue entregado en 5 min → alerta
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDIENTE: {
    label: "Enviado a cocina",
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

// ─── Elapsed time hook — re-renders every 30 s ───────────────────────────────

function useElapsedMinutes(createdAt: string): number {
  const [mins, setMins] = useState(() =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000)
  );
  useEffect(() => {
    const id = setInterval(
      () =>
        setMins(
          Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000)
        ),
      30_000
    );
    return () => clearInterval(id);
  }, [createdAt]);
  return mins;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MozoMenuClient({
  tableId,
  tableNumber,
  tableStatus,
  mozoId,
  categories,
}: Props) {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "pedidos">("menu");
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id ?? null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isPending, startTransition] = useTransition();
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [closeTableOpen, setCloseTableOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const tableForModal = {
    id: tableId,
    number: tableNumber,
    capacity: 0,
    status: tableStatus,
  };

  // ── Polling de pedidos activos ──────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/tables/${tableId}/active-ronda`);
      const json = await res.json();
      if (json.success && json.data) {
        setActiveOrders(json.data.orders ?? []);
      }
    } catch {
      // silencioso
    }
  }, [tableId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ── Toast ───────────────────────────────────────────────────────────────────
  const addToast = (message: string, type: "success" | "error") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000
    );
  };

  // ── Carrito ─────────────────────────────────────────────────────────────────
  const addToCart = (product: Product, cat: Category) => {
    const enriched = { ...product, categoryId: cat.id, categoryColor: cat.color };
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      return [...prev, { product: enriched, quantity: 1, notes: "" }];
    });
  };

  const removeOne = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1)
        return prev.filter((i) => i.product.id !== productId);
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

  // ── Enviar pedido ───────────────────────────────────────────────────────────
  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    startTransition(async () => {
      const result = await processOrderAction({
        tableId,
        mozoId,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
      });
      if (result.success) {
        setCart([]);
        setCartOpen(false);
        await fetchOrders();
        setActiveTab("pedidos");
        addToast("Pedido enviado a cocina.", "success");
      } else {
        addToast(result.error, "error");
      }
    });
  };

  // ── Marcar como entregado ───────────────────────────────────────────────────
  const handleDeliver = async (orderId: string) => {
    setDeliveringId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ENTREGADO" }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchOrders();
        addToast("Pedido marcado como entregado.", "success");
      } else {
        addToast(json.error ?? "Error al marcar como entregado.", "error");
      }
    } catch {
      addToast("Error de conexión.", "error");
    } finally {
      setDeliveringId(null);
    }
  };

  // ── Búsqueda ────────────────────────────────────────────────────────────────
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = normalizedQuery
    ? categories.flatMap((cat) =>
        cat.products
          .filter((p) => p.name.toLowerCase().includes(normalizedQuery))
          .map((p) => ({ product: p, cat }))
      )
    : [];

  // ── Contadores ──────────────────────────────────────────────────────────────
  const pendingOrLiveOrders = activeOrders.filter(
    (o) => o.status !== "ENTREGADO"
  );
  const readyOrders = activeOrders.filter((o) => o.status === "LISTO");

  return (
    <div className="max-w-2xl mx-auto pb-28 bg-slate-950 min-h-screen">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        ref={headerRef}
        className="px-4 pt-6 pb-3 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-40"
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/mozo")}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
              aria-label="Volver al salón"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="bg-brand-primary p-2.5 rounded-xl shrink-0">
              <Pizza size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black italic tracking-tight truncate">
                MESA {tableNumber}
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                Panel mozo
              </p>
            </div>
          </div>

          {/* "Listos" badge — llama la atención del mozo */}
          {readyOrders.length > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-black animate-pulse shrink-0">
              <PackageCheck size={14} />
              {readyOrders.length} LISTO{readyOrders.length > 1 ? "S" : ""}
            </div>
          )}

          {/* Cart button */}
          {cartCount > 0 && (
            <button
              onClick={() => setCartOpen(true)}
              className="relative bg-brand-primary hover:bg-brand-primary/80 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shrink-0"
            >
              <ShoppingCart size={18} />
              <span>{formatMoney(cartTotal)}</span>
              <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center pointer-events-none">
                {cartCount}
              </span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-3">
          <button
            onClick={() => setActiveTab("menu")}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all",
              activeTab === "menu"
                ? "bg-brand-primary text-white"
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
                  ? "bg-brand-primary text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Pedidos
            </button>
            {pendingOrLiveOrders.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center pointer-events-none">
                {pendingOrLiveOrders.length}
              </span>
            )}
          </div>
        </div>

        {/* Search bar */}
        {activeTab === "menu" && (
          <div className="relative mb-2">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-brand-primary/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <XCircle size={15} />
              </button>
            )}
          </div>
        )}

        {/* Category pills */}
        {activeTab === "menu" && !normalizedQuery && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  const el = document.getElementById(`cat-${cat.id}`);
                  if (!el) return;
                  const headerHeight = headerRef.current?.offsetHeight ?? 180;
                  const top =
                    el.getBoundingClientRect().top +
                    window.scrollY -
                    headerHeight -
                    8;
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

      {/* ── Tab: Carta ──────────────────────────────────────────────────────── */}
      {activeTab === "menu" && (
        <div className="px-4 mt-5 isolate space-y-0">
          {normalizedQuery ? (
            searchResults.length === 0 ? (
              <div className="text-center py-16 text-slate-500 space-y-2">
                <Search size={32} className="mx-auto opacity-30" />
                <p className="italic text-sm">
                  Sin resultados para "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map(({ product, cat }) => {
                  const inCart = cart.find((i) => i.product.id === product.id);
                  return (
                    <ProductRow
                      key={product.id}
                      product={product}
                      cat={cat}
                      inCart={inCart}
                      onAdd={() => addToCart(product, cat)}
                      onRemove={() => removeOne(product.id)}
                      showCategoryBadge
                    />
                  );
                })}
              </div>
            )
          ) : (
            categories.map((cat) => (
              <section key={cat.id} id={`cat-${cat.id}`} className="pt-8 first:pt-0">
                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/5">
                  <div
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: cat.color + "22" }}
                  >
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
                      <ProductRow
                        key={product.id}
                        product={product}
                        cat={cat}
                        inCart={inCart}
                        onAdd={() => addToCart(product, cat)}
                        onRemove={() => removeOne(product.id)}
                      />
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* ── Tab: Pedidos ────────────────────────────────────────────────────── */}
      {activeTab === "pedidos" && (
        <div className="px-4 mt-5 space-y-4">
          {activeOrders.length === 0 ? (
            <div className="text-center py-20 text-slate-500 space-y-2">
              <CircleDot size={36} className="mx-auto opacity-30" />
              <p className="italic text-sm">No hay pedidos activos todavía.</p>
              <button
                onClick={() => setActiveTab("menu")}
                className="mt-2 text-brand-primary font-bold text-sm underline"
              >
                Ir a la carta
              </button>
            </div>
          ) : (
            activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isDelivering={deliveringId === order.id}
                onDeliver={handleDeliver}
              />
            ))
          )}
        </div>
      )}

      {/* ── Bottom bar ──────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-slate-950/95 backdrop-blur-sm border-t border-white/5 flex gap-3 z-40">
        {cartCount > 0 && (
          <button
            onClick={() => setCartOpen(true)}
            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors bg-brand-primary hover:bg-brand-primary/80 text-white"
          >
            <ShoppingCart size={16} />
            VER CARRITO ({cartCount})
          </button>
        )}
        <button
          onClick={() => setCloseTableOpen(true)}
          className={cn(
            "py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors border glass-card border-rose-500/30 hover:bg-rose-500/20 text-rose-400",
            cartCount > 0 ? "px-4" : "flex-1"
          )}
        >
          CERRAR MESA
        </button>
      </div>

      {/* ── Cart Drawer ──────────────────────────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div className="relative w-full bg-slate-900 rounded-t-2xl flex flex-col max-h-[85dvh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black italic flex items-center gap-2">
                <ShoppingCart size={20} className="text-brand-primary" />
                PEDIDO MESA {tableNumber}
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
              {cart.length === 0 ? (
                <p className="text-slate-500 italic text-center mt-12">
                  El carrito está vacío.
                </p>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="glass-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm">{item.product.name}</p>
                        <p
                          className="text-xs font-black"
                          style={{ color: item.product.categoryColor }}
                        >
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
                          onClick={() => {
                            const cat = categories.find(
                              (c) => c.id === item.product.categoryId
                            );
                            if (cat) addToCart(item.product, cat);
                          }}
                          className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                          style={{ backgroundColor: item.product.categoryColor }}
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
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs placeholder-slate-500 focus:outline-none focus:border-brand-primary/50 transition-colors"
                    />
                  </div>
                ))
              )}
            </div>
            <div className="px-6 pt-4 pb-8 border-t border-white/10 space-y-3 shrink-0 bg-slate-900">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold text-sm">TOTAL</span>
                <span className="text-xl font-black">{formatMoney(cartTotal)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={cart.length === 0 || isPending}
                className="w-full bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-black text-base tracking-wide transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                ENVIAR A COCINA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Close Table Modal ────────────────────────────────────────────────── */}
      <CloseTableModal
        isOpen={closeTableOpen}
        onClose={() => setCloseTableOpen(false)}
        table={tableForModal}
        mozoId={mozoId}
        onSuccess={() => {
          setCloseTableOpen(false);
          router.push("/mozo");
        }}
      />

      {/* ── Toasts ──────────────────────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "px-4 py-3 rounded-xl text-sm font-bold shadow-xl pointer-events-auto",
              t.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OrderCard — muestra un pedido con contador y botón Entregado ─────────────

interface OrderCardProps {
  order: ActiveOrder;
  isDelivering: boolean;
  onDeliver: (id: string) => void;
}

function OrderCard({ order, isDelivering, onDeliver }: OrderCardProps) {
  const elapsedMins = useElapsedMinutes(order.createdAt);
  const sla = SLA[order.status] ?? 999;
  const isDelayed = elapsedMins > sla;
  const cfg = STATUS_CONFIG[order.status];
  const StatusIcon = cfg.Icon;

  const orderTotal = order.items.reduce(
    (sum, i) => sum + Number(i.priceAtSnapshot) * i.quantity,
    0
  );

  // Contador: colores según urgencia
  const timerColor =
    order.status === "ENTREGADO"
      ? "text-slate-500"
      : isDelayed
      ? "text-rose-400"
      : elapsedMins >= sla * 0.75
      ? "text-amber-400"
      : "text-slate-400";

  const timerLabel =
    elapsedMins === 0 ? "ahora mismo" : `${elapsedMins} min`;

  return (
    <div
      className={cn(
        "glass-card overflow-hidden border transition-all",
        order.status === "LISTO"
          ? "border-emerald-500/50 shadow-emerald-500/10 shadow-lg"
          : isDelayed && order.status !== "ENTREGADO"
          ? "border-rose-500/40"
          : cfg.bg
      )}
    >
      {/* Status bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className={cn("flex items-center gap-2 font-bold text-sm", cfg.color)}>
          <StatusIcon size={16} />
          {cfg.label}
        </div>

        <div className="flex items-center gap-2">
          {/* Mozo creador */}
          {order.mozo ? (
            <span className="text-[10px] font-black bg-brand-primary/20 text-orange-300 border border-brand-primary/30 px-2 py-0.5 rounded-full uppercase truncate max-w-[100px]">
              {order.mozo.name ?? "Mozo"}
            </span>
          ) : order.source === "QR" ? null : (
            <span className="text-[10px] font-black bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2 py-0.5 rounded-full uppercase">
              Mozo
            </span>
          )}

          {/* Source badge */}
          {order.source === "QR" && (
            <span className="text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase">
              QR
            </span>
          )}

          {/* Delay warning */}
          {isDelayed && order.status !== "ENTREGADO" && (
            <AlertTriangle size={14} className="text-rose-400" />
          )}

          {/* Elapsed time counter */}
          <span className={cn("text-xs font-bold flex items-center gap-1", timerColor)}>
            <Clock size={11} />
            {timerLabel}
          </span>
        </div>
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
          <span className="text-xs text-slate-500 uppercase tracking-wide font-bold">
            Total
          </span>
          <span className="font-black text-sm">{formatMoney(orderTotal)}</span>
        </div>
      </div>

      {/* Deliver button — only for LISTO orders */}
      {order.status === "LISTO" && (
        <button
          onClick={() => onDeliver(order.id)}
          disabled={isDelivering}
          className="w-full py-3 flex items-center justify-center gap-2 font-black text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-white"
        >
          {isDelivering ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Bike size={16} />
          )}
          MARCAR ENTREGADO
        </button>
      )}
    </div>
  );
}

// ─── ProductRow ───────────────────────────────────────────────────────────────

interface ProductRowProps {
  product: Product;
  cat: Category;
  inCart: CartItem | undefined;
  onAdd: () => void;
  onRemove: () => void;
  showCategoryBadge?: boolean;
}

function ProductRow({
  product,
  cat,
  inCart,
  onAdd,
  onRemove,
  showCategoryBadge = false,
}: ProductRowProps) {
  return (
    <div className="glass-card flex items-center justify-between px-4 py-3 gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-sm truncate">{product.name}</p>
          {showCategoryBadge && (
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: cat.color + "22", color: cat.color }}
            >
              {cat.name}
            </span>
          )}
        </div>
        <p className="text-xs font-black" style={{ color: cat.color }}>
          {formatMoney(product.price)}
        </p>
      </div>

      {inCart ? (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="font-black text-sm w-5 text-center">
            {inCart.quantity}
          </span>
          <button
            onClick={onAdd}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: cat.color }}
          >
            <Plus size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={onAdd}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0"
          style={{ backgroundColor: cat.color + "33" }}
        >
          <Plus size={16} style={{ color: cat.color }} />
        </button>
      )}
    </div>
  );
}
