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

const tables = await prisma.table.findMany();
console.log("Total tables:", tables.length);
console.log(JSON.stringify(tables, null, 2));

await prisma.$disconnect();
await pool.end();
