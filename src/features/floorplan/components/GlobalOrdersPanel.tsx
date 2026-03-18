"use client";

import React, { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingBag,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  BellOff,
  Loader2,
  RefreshCw,
  QrCode,
  ChefHat,
  Hourglass,
  CheckCheck,
} from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import {
  approveQROrderAction,
  rejectQROrderAction,
  dismissAttentionAction,
} from "@/actions/qrActions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttentionTable {
  id: string;
  number: number;
  zone: { name: string; color: string } | null;
}

interface ActiveOrderItem {
  id: string;
  productName: string;
  quantity: number;
  notes: string | null;
  priceAtSnapshot: number;
}

interface ActiveOrder {
  id: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  rondaId: string;
  tableId: string | null;
  tableNumber: number | null;
  zoneName: string | null;
  zoneColor: string;
  mozo: { id: string; name: string | null } | null;
  items: ActiveOrderItem[];
}

interface QRData {
  attentionTables: AttentionTable[];
  pendingQROrders: { id: string }[]; // used only to count
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchActiveOrders(): Promise<ActiveOrder[]> {
  const res = await fetch("/api/orders/active");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Error cargando pedidos");
  return json.data;
}

async function fetchQRData(): Promise<QRData> {
  const res = await fetch("/api/qr");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Error cargando datos QR");
  return json.data;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; iconClass: string; Icon: React.ElementType }
> = {
  LISTO: {
    label: "LISTO",
    badgeClass: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    iconClass: "text-emerald-400",
    Icon: CheckCheck,
  },
  PREPARANDO: {
    label: "PREP.",
    badgeClass: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
    iconClass: "text-sky-400",
    Icon: ChefHat,
  },
  PENDIENTE: {
    label: "PEND.",
    badgeClass: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    iconClass: "text-amber-400",
    Icon: Hourglass,
  },
  INCOMPLETO: {
    label: "INC.",
    badgeClass: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
    iconClass: "text-rose-400",
    Icon: XCircle,
  },
};

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}
let toastId = 0;

// ─── Component ────────────────────────────────────────────────────────────────

export default function GlobalOrdersPanel() {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: "success" | "error") => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const {
    data: activeOrders = [],
    isLoading: loadingOrders,
    isError: errorOrders,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["active-orders"],
    queryFn: fetchActiveOrders,
    refetchInterval: 12_000,
    refetchIntervalInBackground: false,
  });

  const { data: qrData } = useQuery({
    queryKey: ["qr-orders"],
    queryFn: fetchQRData,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  const attentionTables = qrData?.attentionTables ?? [];
  const pendingQROrders = activeOrders.filter(
    (o) => o.source === "QR" && o.status === "PENDIENTE"
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["active-orders"] });
    queryClient.invalidateQueries({ queryKey: ["qr-orders"] });
  };

  const handleApprove = (orderId: string) => {
    startTransition(async () => {
      const result = await approveQROrderAction(orderId);
      if (result.success) {
        addToast("Pedido aprobado — enviado a cocina/barra", "success");
        refresh();
      } else {
        addToast(result.error, "error");
      }
    });
  };

  const handleReject = (orderId: string) => {
    startTransition(async () => {
      const result = await rejectQROrderAction(orderId);
      if (result.success) {
        addToast("Pedido rechazado", "success");
        refresh();
      } else {
        addToast(result.error, "error");
      }
    });
  };

  const handleDismissAttention = (tableId: string, tableNumber: number) => {
    startTransition(async () => {
      const result = await dismissAttentionAction(tableId);
      if (result.success) {
        addToast(`Mesa ${tableNumber}: alerta eliminada`, "success");
        refresh();
      } else {
        addToast(result.error, "error");
      }
    });
  };

  if (loadingOrders) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={28} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  if (errorOrders) {
    return (
      <div className="text-center py-16 text-rose-400">
        <p className="font-bold">Error cargando pedidos</p>
        <button
          onClick={() => refetchOrders()}
          className="mt-3 text-sm underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Active orders excluding QR-pending (those are shown in their own section below)
  const nonQRPendingOrders = activeOrders.filter(
    (o) => !(o.source === "QR" && o.status === "PENDIENTE")
  );

  const hasAnything =
    attentionTables.length > 0 ||
    pendingQROrders.length > 0 ||
    nonQRPendingOrders.length > 0;

  // Group non-QR-pending orders by status for section headers
  const listoOrders = nonQRPendingOrders.filter((o) => o.status === "LISTO");
  const inProgressOrders = nonQRPendingOrders.filter(
    (o) => o.status === "PREPARANDO" || o.status === "PENDIENTE" || o.status === "INCOMPLETO"
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic flex items-center gap-3">
          <ShoppingBag size={24} className="text-brand-primary" />
          PEDIDOS ACTIVOS
          {activeOrders.length > 0 && (
            <span className="bg-brand-primary text-white text-xs font-black rounded-full px-2 py-0.5">
              {activeOrders.length}
            </span>
          )}
          {pendingQROrders.length > 0 && (
            <span className="bg-amber-400 text-slate-950 text-xs font-black rounded-full px-2 py-0.5 flex items-center gap-1">
              <QrCode size={10} />
              {pendingQROrders.length} QR
            </span>
          )}
        </h2>
        <button
          onClick={refresh}
          disabled={isPending}
          className="glass-card px-4 py-2 flex items-center gap-2 text-sm font-bold hover:bg-white/10 transition-colors"
        >
          <RefreshCw size={14} className={cn(isPending && "animate-spin")} />
          Actualizar
        </button>
      </div>

      {!hasAnything && (
        <div className="text-center py-16 text-slate-500 italic">
          No hay pedidos activos en el salón.
        </div>
      )}

      {/* ── Attention alerts ────────────────────────────────────────────── */}
      {attentionTables.length > 0 && (
        <section>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Llamadas de atención
          </p>
          <div className="space-y-3">
            {attentionTables.map((t) => (
              <div
                key={t.id}
                className="glass-card px-5 py-4 flex items-center justify-between border border-amber-500/30 bg-amber-500/10"
              >
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-amber-400 animate-pulse" />
                  <div>
                    <p className="font-bold">Mesa {t.number}</p>
                    {t.zone && (
                      <p
                        className="text-xs font-bold"
                        style={{ color: t.zone.color }}
                      >
                        {t.zone.name}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDismissAttention(t.id, t.number)}
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs transition-colors"
                >
                  <BellOff size={14} />
                  Atendido
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── QR orders pending approval ───────────────────────────────────── */}
      {pendingQROrders.length > 0 && (
        <section>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <QrCode size={12} className="text-purple-400" />
            Pedidos QR — pendientes de aprobación
          </p>
          <div className="space-y-4">
            {pendingQROrders.map((order) => {
              const total = order.items.reduce(
                (sum, i) => sum + i.priceAtSnapshot * i.quantity,
                0
              );
              const minutesAgo = Math.floor(
                (Date.now() - new Date(order.createdAt).getTime()) / 60_000
              );
              return (
                <div key={order.id} className="glass-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-purple-600/30 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                        QR
                      </span>
                      <span className="font-bold">
                        Mesa {order.tableNumber ?? "?"}
                      </span>
                      {order.zoneName && (
                        <span
                          className="text-xs font-bold"
                          style={{ color: order.zoneColor }}
                        >
                          {order.zoneName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={12} />
                      {minutesAgo === 0 ? "ahora" : `hace ${minutesAgo} min`}
                    </div>
                  </div>
                  <div className="px-5 py-3 space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-start text-sm"
                      >
                        <div>
                          <span className="font-bold">
                            {item.quantity}× {item.productName}
                          </span>
                          {item.notes && (
                            <p className="text-xs text-slate-400 italic mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-slate-400 font-bold text-xs shrink-0 ml-3">
                          {formatMoney(item.priceAtSnapshot * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                        Total
                      </span>
                      <span className="font-black">{formatMoney(total)}</span>
                    </div>
                  </div>
                  <div className="px-5 pb-4 flex gap-3">
                    <button
                      onClick={() => handleApprove(order.id)}
                      disabled={isPending}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <CheckCircle size={16} />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(order.id)}
                      disabled={isPending}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 disabled:opacity-50 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <XCircle size={16} />
                      Rechazar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── LISTO — needs pickup ─────────────────────────────────────────── */}
      {listoOrders.length > 0 && (
        <section>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <CheckCheck size={12} />
            Listos para entregar
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {listoOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </section>
      )}

      {/* ── In progress (PREPARANDO / PENDIENTE / INCOMPLETO) ────────────── */}
      {inProgressOrders.length > 0 && (
        <section>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <ChefHat size={12} />
            En preparación / pendientes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {inProgressOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </section>
      )}

      {/* Toast notifications */}
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

// ─── OrderCard subcomponent ───────────────────────────────────────────────────

function OrderCard({ order }: { order: ActiveOrder }) {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG["PENDIENTE"];
  const StatusIcon = cfg.Icon;
  const minutesAgo = Math.floor(
    (Date.now() - new Date(order.updatedAt).getTime()) / 60_000
  );
  const total = order.items.reduce(
    (sum, i) => sum + i.priceAtSnapshot * i.quantity,
    0
  );

  return (
    <div
      className={cn(
        "glass-card overflow-hidden",
        order.status === "LISTO" && "ring-1 ring-emerald-500/40"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {order.source === "QR" && (
            <span className="bg-purple-600/30 text-purple-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
              QR
            </span>
          )}
          <span className="font-black text-base leading-none">
            Mesa {order.tableNumber ?? "?"}
          </span>
          {order.zoneName && (
            <span
              className="text-[10px] font-bold truncate"
              style={{ color: order.zoneColor }}
            >
              {order.zoneName}
            </span>
          )}
          {order.mozo?.name && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-brand-primary/20 text-brand-primary uppercase tracking-wider shrink-0 truncate max-w-[60px]">
              {order.mozo.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider",
              cfg.badgeClass,
              order.status === "LISTO" && "animate-pulse"
            )}
          >
            <StatusIcon size={9} />
            {cfg.label}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Clock size={10} />
            {minutesAgo === 0 ? "ahora" : `${minutesAgo}m`}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-1.5">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-start text-sm gap-2"
          >
            <div className="min-w-0">
              <span className="font-bold">
                {item.quantity}× {item.productName}
              </span>
              {item.notes && (
                <p className="text-xs text-slate-400 italic mt-0.5 truncate">
                  {item.notes}
                </p>
              )}
            </div>
            <span className="text-slate-400 font-bold text-xs shrink-0">
              {formatMoney(item.priceAtSnapshot * item.quantity)}
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-white/5 flex justify-between items-center">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">
            Total
          </span>
          <span className="font-black text-sm">{formatMoney(total)}</span>
        </div>
      </div>
    </div>
  );
}
