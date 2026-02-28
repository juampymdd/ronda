"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface Props {
  data: Array<{
    date: string;
    sales: number;
  }>;
}

export function SalesChart({ data }: Props) {
  const total = data.reduce((sum, item) => sum + item.sales, 0);
  const average = data.length > 0 ? total / data.length : 0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black italic flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            VENTAS
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Últimos 7 días
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-emerald-500">
            ${total.toFixed(0)}
          </p>
          <p className="text-xs text-slate-400 font-bold">
            Promedio: ${average.toFixed(0)}/día
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            style={{ fontSize: "12px", fontWeight: "bold" }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: "12px", fontWeight: "bold" }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "12px",
              fontWeight: "bold",
            }}
            labelStyle={{
              color: "#94a3b8",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
            itemStyle={{ color: "#10b981" }}
            formatter={(value: number | undefined) =>
              value ? [`$${value.toFixed(2)}`, "Ventas"] : ["$0", "Ventas"]
            }
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorSales)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
