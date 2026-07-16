# Panel Marle Nails

Panel de monitoreo del negocio de **Marle Nails**: contactos que pasan por el
chat del agente de IA, integrantes de la Academia, checkouts que no se
completaron y alertas que necesitan atención humana.

> **Estado actual: DEMO.** Todo el panel funciona con datos mock realistas.
> No está conectado a ninguna fuente real todavía, pero la arquitectura ya
> está preparada para enchufarlo a Supabase, Stripe y Chatwoot cambiando un
> solo archivo (ver [Conectar a fuentes reales](#conectar-a-fuentes-reales)).

## Cómo correr

**Recomendado para mostrar la demo** (compila y sirve en modo producción —
rápido y liviano):

```bash
npm install
npm run demo
# → http://localhost:3000
```

Para desarrollo con hot-reload:

```bash
npm run dev
```

> ⚠️ En máquinas con poca RAM, `next dev` (Turbopack) puede quedarse sin
> memoria después de compilar varias rutas. Si pasa, usá `npm run demo`, que
> sirve el build de producción y no tiene ese problema.

## Acceso (demo)

**Sin contraseña.** En la pantalla de login el usuario ya viene cargado como
`Marle`: solo hay que tocar **Ingresar**.

La sesión es una cookie httpOnly de 7 días. Sin sesión, cualquier ruta del
panel redirige a `/login`.

## Secciones

1. **Inicio** — KPIs generales, contactos por canal, nuevas integrantes por
   mes y últimas alertas pendientes.
2. **Contactos** — todas las personas que pasaron por el chat del agente:
   nombre, teléfono, canal (WhatsApp/Instagram), fecha y estado del lead.
   Con búsqueda por nombre o teléfono.
3. **Integrantes** — quiénes pagaron la Academia, fecha de ingreso, tiempo
   dentro (calculado), plan y estado de la membresía.
4. **Checkouts** — pagos que no se completaron (error de pago o abandono),
   con contacto y canal para hacerles seguimiento.
5. **Alertas** — leads que necesitan atención humana, con botón **Atender**
   (hoy placeholder; a futuro abre la conversación en Chatwoot).

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (estilo base-nova)
- Recharts (gráficos, vía el componente Chart de shadcn)
- lucide-react (íconos)

## Estructura

```
app/
  login/                  # pantalla de acceso
  (dashboard)/            # grupo protegido por el guard de sesión
    layout.tsx            #   sidebar + header + guard
    page.tsx              #   Inicio
    contactos/ integrantes/ checkouts/ alertas/
  api/                    # route handlers (login/logout + datos)
lib/
  auth.ts                 # sesión demo (cookie httpOnly)
  format.ts               # fechas y montos en español
  data/
    types.ts              # tipos de dominio (espejan las fuentes reales)
    index.ts              # ← ÚNICO punto que cambia para pasar de mock a real
    mock/                 # datos y repositorios mock
components/               # UI del panel (sidebar, KPI cards, badges, tablas)
```

## La capa de datos (lo importante)

Todas las páginas y route handlers leen de **`db`** (`lib/data/index.ts`),
nunca de los mocks directo:

```ts
import { db } from "@/lib/data";
const contactos = await db.contactos();
```

Hoy `db` apunta a los repositorios mock de `lib/data/mock/`. Para conectar el
panel de verdad, **solo hay que reemplazar las implementaciones en
`lib/data/index.ts`** — ninguna vista cambia. Los puntos de integración están
marcados con `// TODO(conexión real)` en el código.

## Conectar a fuentes reales

| Sección | Fuente real futura | Nota |
|---|---|---|
| Contactos | Tabla de **leads en Supabase** (el agente ya los registra; canal = whatsapp/instagram) | reemplazar `db.contactos` |
| Integrantes | **Stripe** (suscripciones) / **Skool** "New Paid Member" (nombre + email) | el "tiempo dentro" se calcula desde `fechaIngreso` |
| Checkouts abandonados | **Webhooks de Stripe** (`invoice.payment_failed`, `checkout.session.expired`) | Skool no lo expone; sale por Stripe |
| Alertas | Tabla **`escalated_conversations`** en Supabase (ya existe en el proyecto del agente) | el botón Atender abre Chatwoot: `{CHATWOOT_BASE_URL}/app/accounts/{accountId}/conversations/{conversacionId}` |

Variables de entorno previstas (ver `.env.example`): `DEMO_PASSWORD`,
`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_CHATWOOT_BASE_URL`,
`NEXT_PUBLIC_CHATWOOT_ACCOUNT_ID`, `CHATWOOT_API_TOKEN`.

## Deploy en Easypanel (Docker)

El proyecto trae un `Dockerfile` con build **standalone** de Next.js (imagen
liviana). En Easypanel:

1. Crear un servicio de tipo **App** apuntando a este repositorio de GitHub.
2. Build: **Dockerfile** (Easypanel lo detecta en la raíz del repo).
3. Puerto expuesto: **3000**.
4. Deploy. No hace falta configurar ninguna variable de entorno para que
   funcione (la demo no depende de ninguna).

Probar la imagen localmente:

```bash
docker build -t panel-marle .
docker run -p 3000:3000 panel-marle
# → http://localhost:3000
```

## Nota sobre la autenticación

El login demo tiene un único usuario (`Marle`) **sin contraseña** y una cookie
de valor fijo. Es **suficiente para una demo, no para producción**: antes de
exponer el panel con datos reales hay que agregar contraseña/credenciales y
pasar a sesiones firmadas (JWT / tokens en DB). Está marcado con
`TODO(conexión real)` en `lib/auth.ts`.
