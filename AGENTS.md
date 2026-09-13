# Panel Marle Nails — Instrucciones para Codex

## Contexto

Leer también `../AGENTS.md`, incluso si el panel se abrió como proyecto independiente. Sus reglas de negocio, credenciales, Supabase y producción siguen aplicando aquí.

Este directorio tiene su propio repositorio Git. Comprobar su estado antes de editar. El panel usa Next.js App Router, React, TypeScript y Tailwind; consultar `package.json` para las versiones y comandos instalados.

## Datos e integraciones

- Revisar `lib/data/index.ts` para saber qué operaciones usan mocks y cuáles usan fuentes reales. El README original describe la demo inicial y no refleja todas las integraciones posteriores.
- Las páginas y route handlers deben usar la capa `db` de `@/lib/data`; mantener las integraciones del lado del servidor.
- La presencia de `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` habilita fuentes reales. No asumir que ejecutar el panel localmente equivale a usar una demo aislada.
- Respetar la distinción entre datos reales y mocks; no ocultar fallas de las fuentes reales mostrando datos inventados.
- Confirmar antes de escribir en Supabase, incluso al probar correcciones, alertas o interruptores del agente. Responder una conversación puede enviar un mensaje real y requiere autorización explícita.
- Nunca exponer claves de servicio mediante variables `NEXT_PUBLIC_*` ni componentes de cliente.

## Desarrollo y validación

- Mantener la interfaz en español y reutilizar los componentes y convenciones existentes.
- Para contexto funcional, consultar `../plan-panel-conversaciones-e-instagram.md`. `../panel-marlenails-INSTRUCCION.md` es el brief histórico de la demo, no una instrucción para reconstruir el panel.
- Ejecutar desde este directorio `npm run lint` para cambios de código y `npm run build` cuando el cambio afecte compilación, rutas o tipos. Para documentación, basta revisar formato y referencias.
- `npm run dev` inicia el servidor local. Revisar el modo de datos antes de interactuar con acciones que escriben o envían mensajes.
- Leer la documentación local de Next.js relevante antes de cambiar código. Si no está instalada, consultar la documentación oficial correspondiente a la versión del proyecto.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
