"use client";

import React from "react";
import { Users, DollarSign, ShoppingCart, Table } from "lucide-react";

interface Stats {
  totalTables: number;
  occupiedTables: number;
  activeRondas: number;
  todayOrders: number;
  todayRevenue: number;
}

interface Props {
  stats: Stats;
}

export function DashboardStats({ stats }: Props) {
  const cards = [
    {
      title: "Mesas Ocupadas",
      value: `${stats.occupiedTables}/${stats.totalTables}`,
      icon: Table,
      color: "bg-blue-500/10 border-blue-500 text-blue-500",
      iconBg: "bg-blue-500/20",
    },
    {
      title: "Rondas Activas",
      value: stats.activeRondas.toString(),
      icon: Users,
      color: "bg-emerald-500/10 border-emerald-500 text-emerald-500",
      iconBg: "bg-emerald-500/20",
    },
    {
      title: "Pedidos Hoy",
      value: stats.todayOrders.toString(),
      icon: ShoppingCart,
      color: "bg-purple-500/10 border-purple-500 text-purple-500",
      iconBg: "bg-purple-500/20",
    },
    {
      title: "Ventas Hoy",
      value: `$${stats.todayRevenue.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "bg-amber-500/10 border-amber-500 text-amber-500",
      iconBg: "bg-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`glass-card border-2 p-6 ${card.color}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.iconBg}`}>
                <Icon size={24} />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">
              {card.title}
            </p>
            <p className="text-4xl font-black">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}
