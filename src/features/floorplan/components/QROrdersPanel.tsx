"use client";

import React, { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  QrCode,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  BellOff,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import { approveQROrderAction, rejectQROrderAction, dismissAttentionAction } from "@/actions/qrActions";

interface AttentionTable {
  id: string;
  number: number;
  zone: { name: string; color: string } | null;
}

interface QROrderItem {
  id: string;
  productName: string;
  quantity: number;
  notes: string | null;
  priceAtSnapshot: number;
}

interface QROrder {
  id: string;
  createdAt: string;
  tableId: string | null;
  tableNumber: number | null;
  zoneName: string | null;
  zoneColor: string;
  items: QROrderItem[];
}

interface QRData {
  attentionTables: AttentionTable[];
  pendingQROrders: QROrder[];
}

async function fetchQRData(): Promise<QRData> {
  const res = await fetch("/api/qr");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Error cargando datos QR");
  return json.data;
}

interface Toast { id: number; message: string; type: "success" | "error" }
let toastId = 0;

export default function QROrdersPanel() {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: "success" | "error") => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["qr-orders"],
    queryFn: fetchQRData,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["qr-orders"] });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={28} className="animate-spin text-purple-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-rose-400">
        <p className="font-bold">Error cargando pedidos QR</p>
        <button onClick={() => refetch()} className="mt-3 text-sm underline">Reintentar</button>
      </div>
    );
  }

  const { attentionTables = [], pendingQROrders = [] } = data ?? {};
  const hasAnything = attentionTables.length > 0 || pendingQROrders.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic flex items-center gap-2">
          <QrCode size={24} className="text-purple-400" />
          PEDIDOS QR
          {pendingQROrders.length > 0 && (
            <span className="bg-amber-400 text-slate-950 text-xs font-black rounded-full px-2 py-0.5 ml-1">
              {pendingQROrders.length}
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
          No hay pedidos QR ni llamadas pendientes.
        </div>
      )}

      {/* Attention alerts */}
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
                      <p className="text-xs font-bold" style={{ color: t.zone.color }}>
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

      {/* Pending QR orders */}
      {pendingQROrders.length > 0 && (
        <section>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Pedidos pendientes de aprobación
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
                  {/* Order header */}
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

                  {/* Order items */}
                  <div className="px-5 py-3 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-sm">
                        <div>
                          <span className="font-bold">
                            {item.quantity}× {item.productName}
                          </span>
                          {item.notes && (
                            <p className="text-xs text-slate-400 italic mt-0.5">{item.notes}</p>
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

                  {/* Actions */}
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

      {/* Toast notifications */}
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
