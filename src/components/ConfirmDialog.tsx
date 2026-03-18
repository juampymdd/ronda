"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  const accentColor =
    variant === "danger"
      ? {
          icon: "text-red-400",
          iconBg: "bg-red-500/10",
          iconBorder: "border-red-500/20",
          btn: "bg-red-600 hover:bg-red-700",
        }
      : {
          icon: "text-amber-400",
          iconBg: "bg-amber-500/10",
          iconBorder: "border-amber-500/20",
          btn: "bg-amber-600 hover:bg-amber-700",
        };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${accentColor.iconBg} ${accentColor.iconBorder}`}
            >
              <AlertTriangle size={18} className={accentColor.icon} />
            </div>
            <h2 className="text-lg font-black">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 glass-card px-4 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider hover:bg-white/10 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider transition-colors text-white ${accentColor.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
