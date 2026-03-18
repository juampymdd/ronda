"use client";

import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, QrCode, Search, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableInfo {
  id: string;
  number: number;
  capacity: number;
  status: string;
  zoneName: string | null;
  zoneColor: string;
}

interface Props {
  tables: TableInfo[];
}

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export default function QRPanel({ tables }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = tables.filter((t) =>
    search === "" ||
    String(t.number).includes(search) ||
    (t.zoneName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const baseUrl = getBaseUrl();

  const handlePrintAll = () => {
    window.print();
  };

  const handleDownloadPNG = (table: TableInfo) => {
    const svgEl = document.getElementById(`qr-svg-${table.id}`)?.querySelector("svg");
    if (!svgEl) return;

    const scale = 8; // 140px × 8 = 1120px — alta resolución para imprimir
    const size = 140 * scale;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(svgUrl);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mesa-${table.number}-qr.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = svgUrl;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter flex items-center gap-3">
            <QrCode size={36} className="text-purple-400" />
            CÓDIGOS QR
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
            {tables.length} mesas — escaneá para acceder a la carta
          </p>
        </div>
        <button
          onClick={handlePrintAll}
          className="glass-card px-6 py-3 flex items-center gap-3 hover:bg-purple-600/20 transition-colors font-bold text-sm"
        >
          <Printer size={18} className="text-purple-400" />
          IMPRIMIR TODOS
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar mesa o zona..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {/* QR Grid */}
      <div
        ref={printRef}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 print:grid-cols-4 print:gap-4"
      >
        {filtered.map((table) => {
          const url = `${baseUrl}/mesa/${table.id}`;
          return (
            <div
              key={table.id}
              className={cn(
                "glass-card p-5 flex flex-col items-center gap-4 cursor-pointer transition-all print:break-inside-avoid print:border print:border-slate-700",
                selectedId === table.id && "ring-2 ring-purple-500"
              )}
              onClick={() => setSelectedId(selectedId === table.id ? null : table.id)}
            >
              {/* QR Code */}
              <div
                id={`qr-svg-${table.id}`}
                className="bg-white p-3 rounded-xl"
              >
                <QRCodeSVG
                  value={url}
                  size={140}
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* Table info */}
              <div className="text-center w-full">
                <p className="text-2xl font-black italic">Mesa {table.number}</p>
                {table.zoneName && (
                  <p
                    className="text-xs font-bold uppercase tracking-widest mt-0.5"
                    style={{ color: table.zoneColor }}
                  >
                    {table.zoneName}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">{table.capacity} personas</p>
              </div>

              {/* URL → link abrir en nueva pestaña (hidden on print) */}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full glass-card py-2 flex items-center justify-center gap-2 font-bold text-xs hover:bg-emerald-600/20 transition-colors text-emerald-400 print:hidden"
              >
                <ExternalLink size={13} />
                Abrir mesa
              </a>

              {/* Download button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadPNG(table);
                }}
                className="w-full glass-card py-2 flex items-center justify-center gap-2 font-bold text-xs hover:bg-purple-600/20 transition-colors text-purple-400 print:hidden"
              >
                <Download size={13} />
                Descargar PNG
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-500 italic">
          No se encontraron mesas.
        </div>
      )}

      {/* Print styles injected inline */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
        }
      `}</style>
    </div>
  );
}
