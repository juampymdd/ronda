import { PrismaClient, Role, TableStatus, ProductType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://ronda_user:ronda_password@localhost:5433/ronda_db?schema=public" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('ronda123', 10);

  // Cleanup
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.ronda.deleteMany();
  await prisma.table.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // 1. Initial Users
  await prisma.user.createMany({
    data: [
      { name: 'Admin Ronda', email: 'admin@ronda.com', role: Role.ADMIN, password: hashedPassword },
      { name: 'Mozo Juan', email: 'juan@ronda.com', role: Role.MOZO, password: hashedPassword },
      { name: 'Mozo Ana', email: 'ana@ronda.com', role: Role.MOZO, password: hashedPassword },
      { name: 'Barman Pedro', email: 'pedro@ronda.com', role: Role.BARMAN, password: hashedPassword },
      { name: 'Cocinero Luis', email: 'luis@ronda.com', role: Role.COCINERO, password: hashedPassword },
    ],
  });

  // 2. Initial Tables (15 tables in a grid-like layout)
  const tablesData = [];
  for (let i = 1; i <= 15; i++) {
    tablesData.push({
      number: i,
      capacity: i % 2 === 0 ? 4 : 2,
      status: TableStatus.LIBRE,
      x: (i - 1) % 5 * 100 + 50,
      y: Math.floor((i - 1) / 5) * 100 + 50,
    });
  }
  await prisma.table.createMany({ data: tablesData });

  // 3. Initial Products
  await prisma.product.createMany({
    data: [
      // BARRA
      { name: 'IPA - Pinta', category: 'Cervezas', price: 4500, type: ProductType.BARRRA },
      { name: 'Honey - Pinta', category: 'Cervezas', price: 4200, type: ProductType.BARRRA },
      { name: 'Fernet con Pepsi', category: 'Tragos', price: 3800, type: ProductType.BARRRA },
      { name: 'Gin Tonic Classic', category: 'Tragos', price: 4000, type: ProductType.BARRRA },
      { name: 'Negroni', category: 'Tragos', price: 4200, type: ProductType.BARRRA },

      // COCINA
      { name: 'Papas con Cheddar', category: 'Tapeo', price: 5500, type: ProductType.COCINA },
      { name: 'Nachos Ronda', category: 'Tapeo', price: 6000, type: ProductType.COCINA },
      { name: 'Empanada de Carne', category: 'Tapeo', price: 1200, type: ProductType.COCINA },
      { name: 'Burger XL', category: 'Platos', price: 8500, type: ProductType.COCINA },
      { name: 'Pizza Muzza', category: 'Platos', price: 7000, type: ProductType.COCINA },
    ],
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
