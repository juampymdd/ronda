import React from "react";

export default function MesaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {children}
    </div>
  );
}
