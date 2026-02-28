"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  User,
  Utensils,
  CheckCircle2,
  ChefHat,
  AlertCircle,
} from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface OrderItem {
  id: string;
  quantity: number;
  priceAtSnapshot: number;
  product: {
    id: string;
    name: string;
    category: string;
  };
}

interface Order {
  id: string;
  status: OrderStatus;
  createdAt: Date;
  mozo: {
    id: string;
    name: string;
  };
  ronda: {
    id: string;
    table: {
      id: string;
      number: number;
      zone: {
        name: string;
        color: string;
      } | null;
    };
  };
  items: OrderItem[];
}

const statusConfig = {
  PENDIENTE: {
    label: "Pendiente",
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/50",
    icon: AlertCircle,
  },
  PREPARANDO: {
    label: "Preparando",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/50",
    icon: ChefHat,
  },
  LISTO: {
    label: "Listo",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/50",
    icon: CheckCircle2,
  },
  ENTREGADO: {
    label: "Entregado",
    color: "text-slate-400",
    bg: "bg-slate-500/20",
    border: "border-slate-500/50",
    icon: CheckCircle2,
  },
};

export function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "TODOS">(
    "TODOS",
  );

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const result = await response.json();
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(
    (order) => filterStatus === "TODOS" || order.status === filterStatus,
  );

  const getOrderTotal = (items: OrderItem[]) => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.priceAtSnapshot,
      0,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus("TODOS")}
          className={cn(
            "px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-all",
            filterStatus === "TODOS"
              ? "bg-purple-600 text-white shadow-lg"
              : "bg-slate-800/50 text-slate-400 hover:text-white border border-white/10",
          )}
        >
          Todos ({orders.length})
        </button>
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = orders.filter((o) => o.status === status).length;
          const Icon = config.icon;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status as OrderStatus)}
              className={cn(
                "px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-all flex items-center gap-2",
                filterStatus === status
                  ? `${config.bg} ${config.color} ${config.border} border-2 shadow-lg`
                  : "bg-slate-800/50 text-slate-400 hover:text-white border border-white/10",
              )}
            >
              <Icon size={16} />
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Utensils className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">
            No hay pedidos{" "}
            {filterStatus !== "TODOS" &&
              `en estado ${statusConfig[filterStatus as OrderStatus].label.toLowerCase()}`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const config = statusConfig[order.status];
            const Icon = config.icon;
            const total = getOrderTotal(order.items);

            return (
              <div
                key={order.id}
                className={cn(
                  "glass-card p-5 border-2 transition-all hover:scale-[1.02]",
                  config.border,
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg"
                      style={{
                        backgroundColor:
                          order.ronda.table.zone?.color || "#6b7280",
                      }}
                    >
                      {order.ronda.table.number}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {order.ronda.table.zone?.name || "Sin zona"}
                      </p>
                      <p className="text-sm font-bold text-white">
                        Mesa {order.ronda.table.number}
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "px-3 py-1.5 rounded-lg flex items-center gap-1.5",
                      config.bg,
                    )}
                  >
                    <Icon size={14} className={config.color} />
                    <span
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        config.color,
                      )}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Mozo */}
                <div className="flex items-center gap-2 mb-3 text-slate-300">
                  <User size={14} />
                  <span className="text-sm">{order.mozo.name}</span>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start text-sm"
                    >
                      <div className="flex-1">
                        <span className="text-white font-medium">
                          {item.quantity}x
                        </span>{" "}
                        <span className="text-slate-300">
                          {item.product.name}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">
                          {item.product.category}
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono text-xs">
                        $
                        {(
                          item.quantity * item.priceAtSnapshot
                        ).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Clock size={12} />
                    <span>
                      {formatDistanceToNow(new Date(order.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                      Total
                    </p>
                    <p className="text-lg font-black text-purple-400">
                      ${total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
