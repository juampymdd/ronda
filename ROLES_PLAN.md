# Plan de Roles y Permisos - Sistema RONDA

## 📋 Roles Definidos

### 1. ADMIN (Administrador)
**Acceso completo al sistema con dos modos principales:**

#### 🏗️ Modo Construcción
- **Gestión de Mesas:**
  - Crear nuevas mesas
  - Editar mesas existentes (número, capacidad, zona)
  - Eliminar mesas (solo si no tienen rondas activas)
  - Arrastrar y reposicionar mesas en el mapa
  - Asignar zonas a las mesas
  
- **Gestión de Productos:**
  - Crear/editar/eliminar productos del menú
  - Asignar categorías (Barra/Cocina)
  - Gestionar precios
  
- **Gestión de Zonas:**
  - Crear/editar/eliminar zonas del salón
  - Asignar colores a las zonas
  
- **Gestión de Usuarios:**
  - Crear/editar/eliminar usuarios
  - Asignar roles (Mozo, Barman, Cocinero)
  - Gestionar permisos

#### 📊 Modo Dashboard
- **Vista General:**
  - Métricas en tiempo real (ventas del día, mesas ocupadas, pedidos pendientes)
  - Gráficos de rendimiento
  - Estado de todas las mesas
  
- **Reportes y Analíticas:**
  - Ventas por período
  - Productos más vendidos
  - Rendimiento por mozo
  - Tiempos promedio de atención
  
- **Monitor de Operaciones:**
  - Ver todas las rondas activas
  - Ver todos los pedidos en tiempo real
  - Monitor de KDS (Kitchen Display System)
  - Monitor de Bar

### 2. MOZO (Mesero/Camarero)
**Gestión del salón y atención a mesas:**

#### 🗺️ Mapa de Salón
- Ver estado de todas las mesas en tiempo real
- Filtrar por zona y estado
- Click en mesa para ver detalles

#### 📱 Gestión de Mesas
- **Abrir mesa:** Iniciar una nueva ronda
- **Tomar pedidos:** Agregar items a la ronda activa
- **Ver cuenta:** Ver el total de la ronda
- **Cerrar mesa/Cobrar:** Procesar el pago

#### 📋 Mis Pedidos
- Ver historial de pedidos realizados
- Ver estado de pedidos en cocina/barra
- Recibir notificaciones cuando pedidos están listos

#### 🚫 Restricciones
- No puede crear/editar/eliminar mesas
- No puede ver reportes financieros
- Solo ve sus propias mesas y pedidos
- No puede gestionar productos ni usuarios

### 3. BARMAN (Bartender)
**Gestión de pedidos de barra:**

#### 🍺 KDS Barra (Kitchen Display System)
- Ver solo pedidos de tipo BARRA
- Ordenados por tiempo de espera
- Marcar items como:
  - PENDIENTE (recién recibido)
  - PREPARANDO (en proceso)
  - LISTO (para retirar)

#### 📊 Vista de Productos
- Ver stock disponible de bebidas
- Productos más pedidos del día

#### 🚫 Restricciones
- No ve pedidos de cocina
- No puede tomar pedidos de mesas
- No puede ver reportes completos
- No puede gestionar mesas o usuarios

### 4. COCINERO (Chef/Cocinero)
**Gestión de pedidos de cocina:**

#### 🍳 KDS Cocina
- Ver solo pedidos de tipo COCINA
- Ordenados por tiempo de espera
- Priorización por urgencia
- Marcar items como:
  - PENDIENTE
  - PREPARANDO
  - LISTO

#### 🔥 Alertas
- Pedidos críticos (más de 15 min)
- Notificaciones sonoras de nuevos pedidos

#### 🚫 Restricciones
- No ve pedidos de barra
- No puede tomar pedidos
- No puede ver el mapa de salón completo
- No puede gestionar mesas, productos o usuarios

---

## 🎨 Estructura de Rutas por Rol

### ADMIN
```
/admin
  /dashboard        → Dashboard principal con métricas
  /construccion     → Modo construcción (mesas, productos, zonas, usuarios)
  /reportes         → Reportes y analíticas
  /monitor          → Monitor de operaciones en vivo
```

### MOZO
```
/mozo
  /mapa             → Mapa de salón (por defecto)
  /mis-pedidos      → Historial de pedidos
  /mesa/[id]        → Detalle de mesa y toma de pedidos
```

### BARMAN
```
/barra
  /kds              → Kitchen Display System - Barra (por defecto)
  /productos        → Vista de productos de barra
```

### COCINERO
```
/cocina
  /kds              → Kitchen Display System - Cocina (por defecto)
```

---

## 🔐 Sistema de Permisos

### Middleware de Autenticación
- Verificar sesión activa con NextAuth
- Verificar rol del usuario
- Redirigir a la ruta correcta según rol

### Protección de Rutas
```typescript
// Ejemplo de protección
ADMIN: ['/admin/**', '/construccion/**', '/reportes/**']
MOZO: ['/mozo/**', '/mesa/**']
BARMAN: ['/barra/**']
COCINERO: ['/cocina/**']
```

### Protección de API Routes
```typescript
// Verificar permisos en cada action
- createTable → Solo ADMIN
- updateTable → Solo ADMIN
- deleteTable → Solo ADMIN
- createOrder → MOZO, ADMIN
- updateOrderStatus → BARMAN, COCINERO, ADMIN
```

---

## 📱 Componentes de UI por Rol

### Layout Principal
Cada rol tendrá un layout diferente con:
- **Navbar específico** con opciones relevantes
- **Sidebar** con navegación contextual
- **Color theme** diferenciado (Admin: purple, Mozo: blue, Barra: orange, Cocina: red)

### Dashboard Cards
- **Admin:** Métricas completas, gráficos, controles
- **Mozo:** Mesas activas, pedidos pendientes, quick-add
- **Barman:** Cola de pedidos, productos low-stock
- **Cocinero:** Cola de pedidos, tiempo promedio

---

## 🚀 Implementación - Fases

### Fase 1: Middleware y Protección de Rutas ✅
- Crear middleware de autenticación
- Implementar redirección por rol
- Proteger rutas existentes

### Fase 2: Vista Administrador 🔨
- Layout admin
- Dashboard con métricas
- Modo construcción (ya implementado parcialmente)
- Gestión de usuarios
- Gestión de productos

### Fase 3: Vista Mozo (Refinamiento) 🔨
- Mejorar mapa de salón
- Implementar flujo completo de pedidos
- Detalle de mesa con toma de pedidos
- Sistema de cobro

### Fase 4: KDS Barra y Cocina 🔨
- Componente KDS compartido
- Filtros por tipo de producto
- Estados de pedidos
- Notificaciones en tiempo real
- Audio alerts

### Fase 5: Reportes y Analytics 📊
- Sistema de reportes para admin
- Gráficos con Recharts
- Exportación de datos
- Filtros por fecha/período

---

## 🎯 Próximos Pasos Inmediatos

1. **Crear middleware de rol** → Redirigir según usuario autenticado
2. **Crear layouts específicos** → Admin, Mozo, Barra, Cocina
3. **Implementar dashboard Admin** → Métricas y controles
4. **Refinar vista Mozo** → Flujo completo de pedidos
5. **Crear KDS para Barra/Cocina** → Display de pedidos

---

## 📝 Notas Técnicas

- Usar **NextAuth** para autenticación y gestión de sesión
- Implementar **middleware.ts** en la raíz para protección global
- Usar **Server Components** para datos sensibles
- Implementar **WebSockets o Server-Sent Events** para updates en tiempo real
- Cache de permisos en el cliente para mejor UX
