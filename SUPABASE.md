# Conectar TelTec con Supabase

Esta guía deja **Postgres de Supabase** como base de datos de Django y prepara el cliente JS para Auth/Storage más adelante.

## Estado del código

- Django ya lee `DATABASE_URL` y aplica ajustes automáticos al pooler de Supabase.
- Cliente browser: `lib/supabase/client.ts`
- Cliente server: `lib/supabase/server.ts`
- Plantilla de variables: `.env.example`
- Test de conexión: `scripts/test_supabase_db.py`

La lógica de negocio (pagos, deudas, WhatsApp, PDF) **sigue en Django**. Supabase aquí actúa como la base de datos (y opcionalmente Auth después).

---

## Pasos (hazlos en orden)

### 1. Crear el proyecto en Supabase

1. Entra a https://supabase.com/dashboard y crea un proyecto.
2. Elige región cercana (p. ej. `South America` si está disponible).
3. Guarda la **database password** (solo se muestra una vez).

### 2. Copiar credenciales

En el dashboard:

**A) Database → Connection string → URI**

- Para desarrollo / migraciones: **Session pooler** o **Direct** (puerto `5432`).
- Asegúrate de que la URI tenga `?sslmode=require`.

Ejemplo (ficticio):

```text
postgresql://postgres.abcdefgh:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**B) Project Settings → API**

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY`
- `service_role` (opcional, solo servidor) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Pegar variables en el monorepo

Edita **`.env`** (Django carga este archivo) y **`.env.local`** (Next + Django):

```env
# .env  (obligatorio para Django)
DATABASE_URL=postgresql://...supabase...:5432/postgres?sslmode=require

# .env.local  (Next + extras)
DATABASE_URL=postgresql://...supabase...:5432/postgres?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> Tip: puedes copiar desde `.env.example` y reemplazar los placeholders.

### 4. Migrar el esquema a Supabase

Con el venv de Django activo:

```bash
cd django_backend
source venv/bin/activate
python manage.py migrate
```

Si ya tienes datos en Postgres local y quieres copiarlos:

```bash
# Exportar local
pg_dump -Fc -h localhost -U teltec_user -d teltec_db -f teltec_backup.dump

# Importar a Supabase (usa la misma URI / connection info del dashboard)
pg_restore --no-owner --no-acl -d "$DATABASE_URL" teltec_backup.dump
```

### 5. Verificar la conexión

Desde la raíz del proyecto:

```bash
cd django_backend
source venv/bin/activate
python ../scripts/test_supabase_db.py
```

Debe imprimir `Conexión OK` y `Proveedor detectado: Supabase`.

### 6. Arrancar el stack

```bash
# Terminal 1
cd django_backend && source venv/bin/activate && python manage.py runserver

# Terminal 2
npm run dev
```

Login y módulos siguen igual: el frontend habla con Django; Django ahora usa Supabase Postgres.

---

## Comprobar desde el frontend (opcional)

```ts
import { isSupabaseConfigured, getSupabaseBrowserClient } from "@/lib/supabase/client";

if (isSupabaseConfigured()) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from("clientes").select("id").limit(1);
  // Solo funcionará si creas políticas RLS o usas service role en servidor.
  // Por ahora la app admin sigue vía Django API.
}
```

Hasta configurar Auth/RLS, **no** leas tablas sensibles desde el browser con la anon key.

---

## Problemas frecuentes

| Error | Solución |
|-------|----------|
| `Tenant or user not found` | Usuario/URI incorrectos; usa el usuario `postgres.[project-ref]` del pooler |
| `SSL connection required` | Añade `?sslmode=require` a `DATABASE_URL` |
| Timeouts con pooler `6543` | Usa puerto `5432` (session) para `migrate`; deja `6543` solo en app si hace falta |
| Migraciones fallan en pooler transaction | Cambia temporalmente a direct/session `5432`, corre `migrate`, vuelve al pooler |
| Tablas vacías tras conectar | Corriste `migrate` pero no importaste datos; usa `pg_dump`/`pg_restore` |

---

## Siguiente fase (Auth)

Cuando la DB esté estable:

1. Crear usuarios en Supabase Auth.
2. Sustituir login de `lib/config/api.js` por `supabase.auth.signInWithPassword`.
3. Validar JWT de Supabase en Django y quitar `X-User-Email` / `AllowAny`.

Eso es independiente de este paso de conexión de base de datos.
