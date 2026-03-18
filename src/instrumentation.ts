import cron from "node-cron";

export async function register() {
  // Only run in Node.js runtime (not Edge), and only on the server
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Avoid registering multiple times in dev (HMR)
  if ((globalThis as any).__cronRegistered) return;
  (globalThis as any).__cronRegistered = true;

  // Run every day at midnight: mark stale orders as INCOMPLETO
  cron.schedule("0 0 * * *", async () => {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/orders/close-stale`, {
        method: "POST",
      });
      const data = await res.json();
      console.log("[cron] close-stale:", data.message);
    } catch (err) {
      console.error("[cron] close-stale failed:", err);
    }
  });

  console.log("[cron] Midnight stale-orders job registered");
}
