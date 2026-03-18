"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

interface Props {
  openedAt: Date | string;
  /** Umbral en minutos a partir del cual el timer se pone en rojo. Default: 90 */
  warnAfterMinutes?: number;
}

function calcElapsed(openedAt: Date | string): string {
  const diffMs = Date.now() - new Date(openedAt).getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function TableTimer({ openedAt, warnAfterMinutes = 90 }: Props) {
  const [elapsed, setElapsed] = useState(() => calcElapsed(openedAt));

  useEffect(() => {
    // Recalculate on mount (handles stale initial value)
    setElapsed(calcElapsed(openedAt));

    const id = setInterval(() => {
      setElapsed(calcElapsed(openedAt));
    }, 1000);

    return () => clearInterval(id);
  }, [openedAt]);

  const diffMinutes =
    (Date.now() - new Date(openedAt).getTime()) / 60000;
  const isWarning = diffMinutes >= warnAfterMinutes;

  return (
    <span
      className={
        isWarning
          ? "flex items-center gap-1 font-mono font-bold text-red-400"
          : "flex items-center gap-1 font-mono font-medium"
      }
    >
      <Timer className="w-3.5 h-3.5 shrink-0" />
      {elapsed}
    </span>
  );
}
