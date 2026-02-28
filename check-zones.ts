import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://ronda_user:ronda_password@localhost:5433/ronda_db?schema=public",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

console.log("=== ZONES ===");
const zones = await prisma.zone.findMany();
console.log("Total zones:", zones.length);
console.log(JSON.stringify(zones, null, 2));

console.log("\n=== TABLES WITH ZONES ===");
const tables = await prisma.table.findMany({
  include: {
    zone: true,
  },
});
console.log("Total tables:", tables.length);
console.log("Tables with zones:", tables.filter((t) => t.zone).length);
console.log(JSON.stringify(tables, null, 2));

await prisma.$disconnect();
await pool.end();
