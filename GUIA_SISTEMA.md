# 🎯 Guía Rápida del Sistema RONDA

## 🚀 Flujo de Acceso

### 1. Página de Inicio (`/`)
- **Redirige automáticamente** al login si no estás autenticado
- Si ya estás autenticado, te lleva a tu dashboard según tu rol

### 2. Login (`/login`)
- **Punto de entrada único** para todo el personal
- Credenciales por defecto del sistema:

#### Administrador
```
Email: admin@ronda.com
Password: ronda123
```

#### Mozos de Ejemplo
```
Email: juan@ronda.com
Password: ronda123

Email: ana@ronda.com
Password: ronda123
```

#### Barman
```
Email: pedro@ronda.com  
Password: ronda123
```

#### Cocinero
```
Email: luis@ronda.com
Password: ronda123
```

---

## 👥 Gestión de Personal (ADMIN)

### Crear Nuevos Usuarios

1. **Inicia sesión como ADMIN**
2. Ve a **Sidebar → Usuarios** (`/admin/usuarios`)
3. Click en **"NUEVO USUARIO"**
4. Completa el formulario:
   - Nombre
   - Email
   - Contraseña (mínimo 6 caracteres)
   - **Rol:** ADMIN, MOZO, BARMAN, o COCINERO
5. Click en **"CREAR"**

### Editar Usuarios Existentes

1. En la tabla de usuarios, click en el **ícono de edición** (lápiz)
2. Modifica los campos necesarios
3. Para cambiar la contraseña: ingresa una nueva (dejar vacío para no cambiar)
4. Click en **"ACTUALIZAR"**

### Eliminar Usuarios

1. Click en el **ícono de eliminar** (papelera)
2. Confirma la eliminación
3. **Nota:** No se pueden eliminar usuarios con pedidos asociados

---

## 🏗️ Sistema de Roles

### 🔧 ADMIN
**Rutas:** `/admin/dashboard`, `/admin/construccion`, `/admin/usuarios`, `/admin/productos`, `/admin/reportes`

**Permisos:**
- ✅ Ver dashboard completo con métricas
- ✅ Gestionar layout del salón (arrastrar mesas, crear/editar/eliminar)
- ✅ Crear, editar y eliminar usuarios
- ✅ Gestionar productos (próximamente)
- ✅ Ver reportes (próximamente)
- ✅ Acceso a todas las funcionalidades

### 👔 MOZO
**Ruta:** `/mozo`

**Permisos:**
- ✅ Ver mapa del salón
- ✅ Filtrar mesas por zona y estado
- ✅ Tomar pedidos (en desarrollo)
- ✅ Gestionar rondas
- ❌ No puede editar mesas
- ❌ No puede crear usuarios
- ❌ No puede ver reportes financieros

### 🍺 BARMAN
**Ruta:** `/barra/kds`

**Permisos:**
- ✅ Ver pedidos de BARRA en KDS
- ✅ Cambiar estado de pedidos
- ❌ No ve pedidos de cocina
- ❌ No puede gestionar mesas

### 🍳 COCINERO
**Ruta:** `/cocina/kds`

**Permisos:**
- ✅ Ver pedidos de COCINA en KDS
- ✅ Cambiar estado de pedidos
- ❌ No ve pedidos de barra
- ❌ No puede gestionar mesas

---

## 🎨 Características Implementadas

### ✅ Autenticación y Roles
- Sistema completo de login con NextAuth
- Protección de rutas por rol
- Redirección automática según permisos

### ✅ Panel de Administrador
- **Dashboard:** Métricas en tiempo real (mesas, pedidos, ventas)
- **Construcción:** Gestión completa del layout del salón
  - Arrastrar y soltar mesas
  - Crear/editar/eliminar mesas
  - Asignar zonas
  - Filtros y estadísticas
- **Usuarios:** CRUD completo de personal
  - Crear usuarios con roles
  - Editar información y contraseñas
  - Eliminar usuarios
  - Filtros por rol
  - Validaciones de seguridad

### ✅ Vista Mozo
- Mapa interactivo del salón
- Filtros por zona y estado
- Estadísticas en vivo

---

## 🔐 Seguridad

### Contraseñas
- Hasheadas con bcrypt (10 rounds)
- Mínimo 6 caracteres
- No se almacenan en texto plano

### Validaciones
- No se pueden eliminar usuarios con pedidos
- No se pueden eliminar mesas con rondas activas
- Verificación de email único
- Verificación de número de mesa único

### Protección de Rutas
- Middleware automático que verifica autenticación
- Redirección a login si no estás autenticado
- Bloqueo de rutas según rol
- Tokens JWT seguros

---

## 📝 Próximas Funcionalidades

### 🔨 En Desarrollo
- [ ] Gestión de productos y menú
- [ ] KDS para Barra y Cocina
- [ ] Sistema completo de pedidos para mozos
- [ ] Reportes y analytics
- [ ] Notificaciones en tiempo real
- [ ] Sistema de pagos

---

## 🐛 Solución de Problemas

### No puedo iniciar sesión
1. Verifica que estés usando el email y contraseña correctos
2. Asegúrate que la base de datos esté corriendo:
   ```
   docker-compose up -d
   ```
3. Verifica que exista el usuario en la BD

### No me redirige al dashboard correcto
1. Cierra sesión completamente
2. Borra las cookies del navegador
3. Vuelve a iniciar sesión

### No puedo ver ciertas páginas
- Verifica que tu usuario tenga el rol correcto
- Solo ADMIN puede acceder a `/admin/**`
- Cada rol tiene rutas específicas

---

## ⚙️ Comandos Útiles

### Desarrollo
```bash
bun dev                    # Inicia el servidor
bun prisma studio          # Inspecciona la BD
bun prisma db seed         # Recarga datos iniciales
```

### Base de Datos
```bash
docker-compose up -d       # Inicia PostgreSQL
docker-compose down        # Detiene PostgreSQL
```

### Resetear Base de Datos
```bash
bun prisma migrate reset   # ⚠️ BORRA TODO y recrea con seed
```
