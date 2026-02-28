"use client";

import React from "react";
import { Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Order {
  id: string;
  createdAt: Date;
  status: string;
  mozo: { name: string | null };
  ronda: {
    table: { number: number };
  };
  items: Array<{ id: string }>;
}

interface Props {
  orders: Order[];
}

export function RecentActivity({ orders }: Props) {
  return (
    <div className="glass-card p-6 h-full">
      <h2 className="text-xl font-black italic mb-6">ACTIVIDAD RECIENTE</h2>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <p className="text-slate-500 text-center py-8 italic">
            No hay actividad reciente
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="border-l-4 border-purple-500 bg-white/5 p-4 rounded-r-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black">
                    Mesa {order.ronda.table.number}
                  </span>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-bold">
                    {order.items.length} items
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>{order.mozo.name || "Sin asignar"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>
                    {formatDistanceToNow(new Date(order.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
