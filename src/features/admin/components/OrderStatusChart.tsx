"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Clock } from "lucide-react";

interface Props {
  data: Array<{
    status: string;
    count: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  LIBRE: "#10b981",
  OCUPADA: "#f59e0b",
  PIDIENDO: "#06b6d4",
  ESPERANDO: "#f43f5f",
  PAGANDO: "#a855f7",
};

export function OrderStatusChart({ data }: Props) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black italic flex items-center gap-2">
            <Clock size={18} className="text-sky-500" />
            ESTADO DE MESAS
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Distribución actual
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-sky-500">{total}</p>
          <p className="text-xs text-slate-400 font-bold">Total mesas</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
          <XAxis
            dataKey="status"
            stroke="#94a3b8"
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: "12px", fontWeight: "bold" }}
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
            itemStyle={{ color: "#06b6d4" }}
            formatter={(value: number | undefined) =>
              value ? [value, "Mesas"] : [0, "Mesas"]
            }
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[entry.status] || "#64748b"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {data.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[item.status] }}
            />
            <span className="text-xs font-bold text-slate-400 uppercase">
              {item.status} ({item.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
