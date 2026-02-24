# Ronda - Sistema de Gestión de Bares

Ronda es una plataforma de gestión para bares diseñada para alta disponibilidad, baja latencia y resiliencia en entornos de red inestables. Permite la gestión en tiempo real de pedidos, mesas y comandas.

## 🚀 Stack Tecnológico

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Base de Datos**: PostgreSQL 16 (vía Docker)
- **ORM**: [Prisma 7.4.x](https://www.prisma.io/)
- **Estado Global**: [Zustand](https://github.com/pmndrs/zustand)
- **Validación**: [Zod](https://zod.dev/)
- **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Utilidades**: `date-fns`, `clsx`, `tailwind-merge`

## 📁 Estructura del Proyecto

- `src/actions/`: Lógica de negocio mediante Server Actions (Order, Table management).
- `src/app/`: Rutas de la aplicación (Dashboard de Mozos, KDS, QR Self-Service).
- `src/components/`: Componentes UI y vistas dinámicas (KDS Tickets, Floor Plan).
- `src/lib/`: Singletons y utilidades core (Prisma Client).
- `src/store/`: Gestión de estado del lado del cliente (Carrito).
- `prisma/`: Esquema de datos, configuraciones y scripts de seeding.

## ⚙️ Configuración del Proyecto

### 1. Requisitos Previos

Asegúrate de tener instalados:
- [Bun](https://bun.sh/)
- [Docker & Docker Compose](https://www.docker.com/)

### 2. Infraestructura (Docker)

Levanta la base de datos utilizando el archivo de configuración proporcionado:

```bash
docker compose up -d
```

> [!IMPORTANT]
> La base de datos corre en el puerto **5433** para evitar conflictos con instalaciones locales de PostgreSQL.

### 3. Variables de Entorno

Configura tu archivo `.env`:

```env
DATABASE_URL="postgresql://ronda_user:ronda_password@localhost:5433/ronda_db?schema=public"
```

### 4. Instalación de Dependencias

```bash
bun install
```

### 5. Configuración de Base de Datos y Seeding

Sincroniza el esquema y genera el cliente:

```bash
bun x prisma db push
bun x prisma generate
```

Poblar la base de datos con datos iniciales (mesas, productos, roles):

```bash
bun prisma/seed.ts
```

## 🛠️ Desarrollo con Prisma 7

Para optimizar la conectividad y evitar problemas con los nuevos motores de Prisma 7 durante el desarrollo, este proyecto utiliza `@prisma/adapter-pg`. Esto permite una conexión directa y estable mediante el driver nativo de Node.js/Bun.

## 🖥️ Comandos Disponibles

- `bun dev`: Inicia el servidor de desarrollo.
- `bun run build`: Genera el build de producción.
- `bun prisma/seed.ts`: Ejecuta la carga manual de datos iniciales.
- `bun x prisma studio`: Abre la interfaz visual para explorar la base de datos.
