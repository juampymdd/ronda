// Shared skeleton primitives
// All shimmer elements use animate-pulse with bg-white/10 to match the app's
// glass-card dark theme (bg: #020617, cards: bg-white/5 border border-white/10).

/** Base shimmer block — rounded-lg by default */
export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/10 rounded-lg ${className}`} />
  );
}

/** Mimics a `glass-card p-4 border-2` stat card */
export function SkeletonStatCard({
  borderColor = "border-white/10",
}: {
  borderColor?: string;
}) {
  return (
    <div className={`glass-card p-4 border-2 ${borderColor} animate-pulse`}>
      <Shimmer className="h-3 w-24 mb-3" />
      <Shimmer className="h-9 w-16" />
    </div>
  );
}

/**
 * Mimics a `glass-card p-6` content card (product / category / zone).
 * Renders a generic icon+title header, a detail row, and an action row.
 */
export function SkeletonCard() {
  return (
    <div className="glass-card p-6 border-2 border-white/5 animate-pulse">
      {/* Icon + title */}
      <div className="flex items-start gap-3 mb-4">
        <Shimmer className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <Shimmer className="h-5 w-3/4" />
          <Shimmer className="h-3.5 w-1/2" />
        </div>
      </div>
      {/* Detail row */}
      <div className="flex items-center justify-between mb-4">
        <Shimmer className="h-7 w-20" />
        <Shimmer className="h-6 w-16 rounded-lg" />
      </div>
      {/* Action buttons */}
      <div className="flex gap-2 pt-4 border-t border-white/10">
        <Shimmer className="flex-1 h-9 rounded-lg" />
        <Shimmer className="flex-1 h-9 rounded-lg" />
      </div>
    </div>
  );
}

/** Mimics one `<tr>` in a users table — 5 columns */
export function SkeletonTableRow() {
  return (
    <tr className="border-t border-white/5 animate-pulse">
      {/* Usuario */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Shimmer className="w-9 h-9 rounded-lg shrink-0" />
          <Shimmer className="h-4 w-28" />
        </div>
      </td>
      {/* Email */}
      <td className="px-6 py-4">
        <Shimmer className="h-4 w-40" />
      </td>
      {/* Rol */}
      <td className="px-6 py-4">
        <Shimmer className="h-6 w-20 rounded-lg" />
      </td>
      {/* Pedidos */}
      <td className="px-6 py-4">
        <Shimmer className="h-4 w-8" />
      </td>
      {/* Acciones */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <Shimmer className="w-8 h-8 rounded-lg" />
          <Shimmer className="w-8 h-8 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

/** Mimics a ReservationCard */
export function SkeletonReservationCard() {
  return (
    <div className="glass-card p-5 border border-white/10 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <Shimmer className="h-5 w-32" />
        <Shimmer className="h-6 w-20 rounded-full" />
      </div>
      <Shimmer className="h-4 w-48" />
      <Shimmer className="h-4 w-36" />
      <div className="flex gap-2 pt-2">
        <Shimmer className="flex-1 h-8 rounded-lg" />
        <Shimmer className="flex-1 h-8 rounded-lg" />
      </div>
    </div>
  );
}

/** Mimics a mini table square in LiveMonitor */
export function SkeletonTableSquare() {
  return (
    <div className="aspect-square bg-white/5 rounded-lg border border-white/10 animate-pulse" />
  );
}

/** A full LiveMonitor skeleton — 2 zone groups */
export function SkeletonLiveMonitor() {
  return (
    <div className="space-y-6">
      {[8, 10].map((count, i) => (
        <div key={i}>
          <Shimmer className="h-3 w-24 mb-3" />
          <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-10 gap-2">
            {Array.from({ length: count }).map((_, j) => (
              <SkeletonTableSquare key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Stats dashboard skeleton — 4 stat cards + 2 chart placeholders + activity */
export function SkeletonStatsDashboard() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["border-purple-500/30","border-emerald-500/30","border-amber-500/30","border-blue-500/30"].map((b,i) => (
          <div key={i} className={`glass-card p-4 border-2 ${b}`}>
            <Shimmer className="h-3 w-24 mb-3" />
            <Shimmer className="h-9 w-16" />
          </div>
        ))}
      </div>
      {/* 2 charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <Shimmer className="h-5 w-40 mb-4" />
          <Shimmer className="h-48 w-full rounded-xl" />
        </div>
        <div className="glass-card p-6">
          <Shimmer className="h-5 w-40 mb-4" />
          <Shimmer className="h-48 w-full rounded-xl" />
        </div>
      </div>
      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="glass-card p-6">
          <Shimmer className="h-5 w-32 mb-4" />
          <Shimmer className="h-48 w-full rounded-xl" />
        </div>
        <div className="glass-card p-6 xl:col-span-2">
          <Shimmer className="h-5 w-40 mb-6" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_,i) => (
              <Shimmer key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mozo floor plan skeleton — 2 zone groups with table card placeholders */
export function SkeletonMozoFloorPlan() {
  return (
    <div className="space-y-8 animate-pulse">
      {[4, 6].map((count, zi) => (
        <div key={zi} className="glass-card p-6 border border-white/10">
          {/* Zone header */}
          <div className="flex items-center gap-3 mb-4">
            <Shimmer className="w-3 h-6 rounded-full" />
            <Shimmer className="h-5 w-28" />
            <Shimmer className="h-4 w-16 ml-auto" />
          </div>
          {/* Table cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4">
                <Shimmer className="h-8 w-8 mb-2 rounded-lg" />
                <Shimmer className="h-3.5 w-12 mb-1" />
                <Shimmer className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
