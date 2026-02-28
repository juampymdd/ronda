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
} from "recharts";
import { Award } from "lucide-react";

interface Props {
  data: Array<{
    table: string;
    orders: number;
    revenue: number;
  }>;
}

export function TopTablesChart({ data }: Props) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black italic flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            TOP MESAS
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Las 5 más activas
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-amber-500">
            ${totalRevenue.toFixed(0)}
          </p>
          <p className="text-xs text-slate-400 font-bold">Revenue total</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
          <XAxis
            type="number"
            stroke="#94a3b8"
            style={{ fontSize: "12px", fontWeight: "bold" }}
            tickFormatter={(value) => `$${value}`}
          />
          <YAxis
            dataKey="table"
            type="category"
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
            formatter={(
              value: number | undefined,
              name: string | undefined,
            ) => {
              if (!value) return ["$0", name || ""];
              if (name === "revenue")
                return [`$${value.toFixed(2)}`, "Revenue"];
              return [value, "Órdenes"];
            }}
          />
          <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Details List */}
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div
            key={item.table}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="font-black text-amber-500 text-lg w-6">
                #{index + 1}
              </span>
              <span className="font-bold text-slate-300">{item.table}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 font-bold">
                {item.orders} órdenes
              </span>
              <span className="font-black text-amber-500">
                ${item.revenue.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
