import {
  PrismaClient,
  Role,
  TableStatus,
  ProductType,
  OrderStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://ronda_user:ronda_password@localhost:5433/ronda_db?schema=public",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("ronda123", 10);

  // Cleanup
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.ronda.deleteMany();
  await prisma.table.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned up database");

  // 1. Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Admin Ronda",
        email: "admin@ronda.com",
        role: Role.ADMIN,
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        name: "Mozo Juan",
        email: "juan@ronda.com",
        role: Role.MOZO,
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        name: "Mozo Ana",
        email: "ana@ronda.com",
        role: Role.MOZO,
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        name: "Mozo Carlos",
        email: "carlos@ronda.com",
        role: Role.MOZO,
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        name: "Barman Pedro",
        email: "pedro@ronda.com",
        role: Role.BARMAN,
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        name: "Cocinero Luis",
        email: "luis@ronda.com",
        role: Role.COCINERO,
        password: hashedPassword,
      },
    }),
  ]);

  const [admin, juan, ana, carlos, pedro, luis] = users;
  console.log("👥 Created users");

  // 2. Create Zones
  const zones = await Promise.all([
    prisma.zone.create({
      data: {
        name: "PRINCIPAL",
        color: "#3b82f6",
        capacity: 40,
        width: 800,
        height: 500,
      },
    }),
    prisma.zone.create({
      data: {
        name: "TERRAZA",
        color: "#10b981",
        capacity: 30,
        width: 700,
        height: 450,
      },
    }),
    prisma.zone.create({
      data: {
        name: "VIP",
        color: "#a855f7",
        capacity: 20,
        width: 600,
        height: 400,
      },
    }),
    prisma.zone.create({
      data: {
        name: "BARRA",
        color: "#f59e0b",
        capacity: 15,
        width: 500,
        height: 350,
      },
    }),
  ]);

  console.log("📍 Created zones");

  // 3. Create Tables
  const tablesData = [];
  for (let i = 1; i <= 20; i++) {
    const zoneIndex = Math.floor((i - 1) / 5) % zones.length;
    tablesData.push({
      number: i,
      capacity: [2, 4, 6, 4, 2][i % 5],
      status: TableStatus.LIBRE,
      zoneId: zones[zoneIndex].id,
      x: ((i - 1) % 5) * 120 + 50,
      y: Math.floor((i - 1) / 5) * 150 + 50,
    });
  }
  const tables = await prisma.table.createMany({ data: tablesData });
  const allTables = await prisma.table.findMany();
  console.log("🪑 Created 20 tables");

  // 4. Create Products
  const products = await Promise.all([
    // Cervezas
    prisma.product.create({
      data: {
        name: "IPA - Pinta",
        category: "Cervezas",
        price: 4500,
        type: ProductType.BARRRA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Honey - Pinta",
        category: "Cervezas",
        price: 4200,
        type: ProductType.BARRRA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Stout - Pinta",
        category: "Cervezas",
        price: 4800,
        type: ProductType.BARRRA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Lager - Pinta",
        category: "Cervezas",
        price: 4000,
        type: ProductType.BARRRA,
      },
    }),

    // Tragos
    prisma.product.create({
      data: {
        name: "Fernet con Pepsi",
        category: "Tragos",
        price: 3800,
        type: ProductType.BARRRA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Gin Tonic Classic",
        category: "Tragos",
        price: 4000,
        type: ProductType.BARRRA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Negroni",
        category: "Tragos",
        price: 4200,
        type: ProductType.BARRRA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Mojito",
        category: "Tragos",
        price: 4500,
        type: ProductType.BARRRA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Aperol Spritz",
        category: "Tragos",
        price: 4300,
        type: ProductType.BARRRA,
      },
    }),

    // Tapeo
    prisma.product.create({
      data: {
        name: "Papas con Cheddar",
        category: "Tapeo",
        price: 5500,
        type: ProductType.COCINA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Nachos Ronda",
        category: "Tapeo",
        price: 6000,
        type: ProductType.COCINA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Empanada de Carne",
        category: "Tapeo",
        price: 1200,
        type: ProductType.COCINA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Empanada de Pollo",
        category: "Tapeo",
        price: 1200,
        type: ProductType.COCINA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Tabla de Fiambres",
        category: "Tapeo",
        price: 8500,
        type: ProductType.COCINA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Rabas",
        category: "Tapeo",
        price: 7000,
        type: ProductType.COCINA,
      },
    }),

    // Platos
    prisma.product.create({
      data: {
        name: "Burger XL",
        category: "Platos",
        price: 8500,
        type: ProductType.COCINA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Pizza Muzza",
        category: "Platos",
        price: 7000,
        type: ProductType.COCINA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Pizza Especial",
        category: "Platos",
        price: 8500,
        type: ProductType.COCINA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Milanesa Napolitana",
        category: "Platos",
        price: 9000,
        type: ProductType.COCINA,
      },
    }),
    prisma.product.create({
      data: {
        name: "Bife de Chorizo",
        category: "Platos",
        price: 12000,
        type: ProductType.COCINA,
      },
    }),
  ]);

  console.log("🍔 Created 20 products");

  // 5. Create Active Rondas with Orders
  // Mesa 1: Ronda activa con pedidos pendientes (Juan)
  const ronda1 = await prisma.ronda.create({
    data: {
      tableId: allTables[0].id,
      isActive: true,
      orders: {
        create: [
          {
            mozoId: juan.id,
            status: OrderStatus.PENDIENTE,
            items: {
              create: [
                {
                  productId: products[0].id,
                  quantity: 2,
                  priceAtSnapshot: products[0].price,
                },
                {
                  productId: products[9].id,
                  quantity: 1,
                  priceAtSnapshot: products[9].price,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.table.update({
    where: { id: allTables[0].id },
    data: { status: TableStatus.PIDIENDO },
  });

  // Mesa 2: Ronda activa esperando comida (Ana)
  const ronda2 = await prisma.ronda.create({
    data: {
      tableId: allTables[1].id,
      isActive: true,
      orders: {
        create: [
          {
            mozoId: ana.id,
            status: OrderStatus.PREPARANDO,
            items: {
              create: [
                {
                  productId: products[15].id,
                  quantity: 2,
                  priceAtSnapshot: products[15].price,
                },
                {
                  productId: products[1].id,
                  quantity: 2,
                  priceAtSnapshot: products[1].price,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.table.update({
    where: { id: allTables[1].id },
    data: { status: TableStatus.ESPERANDO },
  });

  // Mesa 3: Ronda con comida lista (Carlos)
  const ronda3 = await prisma.ronda.create({
    data: {
      tableId: allTables[2].id,
      isActive: true,
      orders: {
        create: [
          {
            mozoId: carlos.id,
            status: OrderStatus.LISTO,
            items: {
              create: [
                {
                  productId: products[10].id,
                  quantity: 1,
                  priceAtSnapshot: products[10].price,
                },
                {
                  productId: products[4].id,
                  quantity: 3,
                  priceAtSnapshot: products[4].price,
                },
                {
                  productId: products[11].id,
                  quantity: 4,
                  priceAtSnapshot: products[11].price,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.table.update({
    where: { id: allTables[2].id },
    data: { status: TableStatus.OCUPADA },
  });

  // Mesa 5: Ronda lista para pagar (Juan)
  const ronda4 = await prisma.ronda.create({
    data: {
      tableId: allTables[4].id,
      isActive: true,
      orders: {
        create: [
          {
            mozoId: juan.id,
            status: OrderStatus.ENTREGADO,
            items: {
              create: [
                {
                  productId: products[18].id,
                  quantity: 1,
                  priceAtSnapshot: products[18].price,
                },
                {
                  productId: products[0].id,
                  quantity: 1,
                  priceAtSnapshot: products[0].price,
                },
              ],
            },
          },
          {
            mozoId: juan.id,
            status: OrderStatus.ENTREGADO,
            items: {
              create: [
                {
                  productId: products[16].id,
                  quantity: 1,
                  priceAtSnapshot: products[16].price,
                },
                {
                  productId: products[6].id,
                  quantity: 2,
                  priceAtSnapshot: products[6].price,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.table.update({
    where: { id: allTables[4].id },
    data: { status: TableStatus.PAGANDO },
  });

  // Mesa 7: Ronda con múltiples pedidos (Ana)
  const ronda5 = await prisma.ronda.create({
    data: {
      tableId: allTables[6].id,
      isActive: true,
      orders: {
        create: [
          {
            mozoId: ana.id,
            status: OrderStatus.ENTREGADO,
            createdAt: new Date(Date.now() - 30 * 60 * 1000), // hace 30 min
            items: {
              create: [
                {
                  productId: products[4].id,
                  quantity: 2,
                  priceAtSnapshot: products[4].price,
                },
                {
                  productId: products[9].id,
                  quantity: 1,
                  priceAtSnapshot: products[9].price,
                },
              ],
            },
          },
          {
            mozoId: ana.id,
            status: OrderStatus.PREPARANDO,
            createdAt: new Date(Date.now() - 10 * 60 * 1000), // hace 10 min
            items: {
              create: [
                {
                  productId: products[17].id,
                  quantity: 1,
                  priceAtSnapshot: products[17].price,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.table.update({
    where: { id: allTables[6].id },
    data: { status: TableStatus.ESPERANDO },
  });

  // Mesa 10: Gran pedido VIP (Carlos)
  const ronda6 = await prisma.ronda.create({
    data: {
      tableId: allTables[9].id,
      isActive: true,
      orders: {
        create: [
          {
            mozoId: carlos.id,
            status: OrderStatus.PREPARANDO,
            items: {
              create: [
                {
                  productId: products[13].id,
                  quantity: 1,
                  priceAtSnapshot: products[13].price,
                },
                {
                  productId: products[19].id,
                  quantity: 2,
                  priceAtSnapshot: products[19].price,
                },
                {
                  productId: products[7].id,
                  quantity: 4,
                  priceAtSnapshot: products[7].price,
                },
                {
                  productId: products[1].id,
                  quantity: 4,
                  priceAtSnapshot: products[1].price,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.table.update({
    where: { id: allTables[9].id },
    data: { status: TableStatus.ESPERANDO },
  });

  console.log("📋 Created 6 active rondas with orders");
  console.log("\n✨ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - ${users.length} users created`);
  console.log(`   - ${zones.length} zones created`);
  console.log(`   - 20 tables created`);
  console.log(`   - ${products.length} products created`);
  console.log(`   - 6 active rondas with multiple orders`);
  console.log("\n🔐 Login credentials:");
  console.log("   Email: admin@ronda.com | juan@ronda.com | ana@ronda.com");
  console.log("   Password: ronda123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
