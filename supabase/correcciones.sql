-- ============================================================================
--  Correcciones del agente — tabla + funciones de escritura.
--  Panel Marle Nails · 31/08/2026
--  ----------------------------------------------------------------------------
--  Marle lee una conversación, ve que el agente dijo un precio mal o contestó
--  cualquier cosa, marca ESOS mensajes y escribe qué estuvo mal. Eso es una
--  corrección: la lista de cosas que hay que arreglarle al prompt del agente.
--
--  El texto de los mensajes se guarda COPIADO, no por referencia. Una
--  corrección tiene que seguir diciendo qué dijo el agente aunque después ese
--  mensaje se borre o la conversación se limpie: si al abrirla seis meses
--  después dijera "mensaje no encontrado", no serviría para arreglar nada.
-- ============================================================================

create table if not exists public.correcciones (
  id                uuid primary key default gen_random_uuid(),
  -- Se conserva la corrección aunque la conversación se borre: lo que hay que
  -- arreglar es el AGENTE, y eso no depende de que el chat siga existiendo.
  conversacion_id   uuid references public.conversaciones(id) on delete set null,
  -- Copia de con quién era el chat, por la misma razón.
  contacto          text,
  canal             text,
  descripcion       text not null,
  -- [{ "id": "123", "rol": "agente", "texto": "…", "fecha": "2026-08-31T…" }]
  mensajes          jsonb not null default '[]'::jsonb,
  estado            text not null default 'pendiente',
  created_at        timestamptz not null default now(),
  resuelta_at       timestamptz,
  constraint correcciones_estado_valido
    check (estado in ('pendiente', 'resuelta')),
  constraint correcciones_descripcion_no_vacia
    check (length(btrim(descripcion)) > 0),
  constraint correcciones_mensajes_es_lista
    check (jsonb_typeof(mensajes) = 'array')
);

comment on table public.correcciones is
  'Errores del agente que Marle marca desde el panel (precio equivocado, respuesta que no era, etc.). Los mensajes van copiados en jsonb a proposito: la correccion tiene que sobrevivir a que se borre el chat. La escribe SOLO el panel, via guardar_correccion().';

-- La lista se pide siempre igual: pendientes primero, lo más nuevo arriba.
create index if not exists correcciones_estado_fecha_idx
  on public.correcciones (estado, created_at desc);

-- Igual que academia_integrantes: RLS prendida y SIN policy, así solo entra la
-- service key del panel. Sin esto, cualquiera con la anon key leería lo que
-- Marle anotó sobre sus clientas.
alter table public.correcciones enable row level security;

-- ── Escrituras ──────────────────────────────────────────────────────────────
-- El panel nunca hace INSERT ni UPDATE directo (ver lib/data/real/supabase.ts):
-- pasa siempre por una función, que es la que valida.

create or replace function public.guardar_correccion(p jsonb)
returns setof public.correcciones
language plpgsql
as $$
begin
  return query
  insert into public.correcciones (
    conversacion_id, contacto, canal, descripcion, mensajes
  )
  values (
    nullif(p->>'conversacion_id', '')::uuid,
    nullif(btrim(coalesce(p->>'contacto', '')), ''),
    nullif(p->>'canal', ''),
    btrim(coalesce(p->>'descripcion', '')),
    coalesce(p->'mensajes', '[]'::jsonb)
  )
  returning *;
end;
$$;

comment on function public.guardar_correccion(jsonb) is
  'Anota una correccion del agente. Espera { conversacion_id, contacto, canal, descripcion, mensajes: [...] }.';

create or replace function public.cambiar_estado_correccion(
  p_id uuid,
  p_estado text
)
returns setof public.correcciones
language plpgsql
as $$
begin
  if p_estado not in ('pendiente', 'resuelta') then
    raise exception 'Estado invalido: %', p_estado;
  end if;

  return query
  update public.correcciones
     set estado = p_estado,
         -- Se guarda CUÁNDO se dio por arreglada; al reabrirla se limpia, para
         -- que no quede una fecha de resolución en algo que sigue pendiente.
         resuelta_at = case when p_estado = 'resuelta' then now() else null end
   where id = p_id
  returning *;
end;
$$;

-- Devuelve la fila borrada y NO `void`: con `void`, PostgREST contesta 204 sin
-- cuerpo y el `res.json()` del panel se rompía —borraba bien, pero avisaba que
-- había fallado—. Devolviendo el registro, la respuesta siempre es JSON.
create or replace function public.borrar_correccion(p_id uuid)
returns setof public.correcciones
language sql
as $$
  delete from public.correcciones where id = p_id returning *;
$$;

-- Solo el panel (service key). Por defecto Postgres le da EXECUTE a PUBLIC, y
-- eso dejaría escribir con la anon key desde cualquier lado. Mismo criterio que
-- registrar_mensaje() y unescalate().
revoke execute on function public.guardar_correccion(jsonb) from public, anon, authenticated;
revoke execute on function public.cambiar_estado_correccion(uuid, text) from public, anon, authenticated;
revoke execute on function public.borrar_correccion(uuid) from public, anon, authenticated;

grant execute on function public.guardar_correccion(jsonb) to service_role;
grant execute on function public.cambiar_estado_correccion(uuid, text) to service_role;
grant execute on function public.borrar_correccion(uuid) to service_role;
