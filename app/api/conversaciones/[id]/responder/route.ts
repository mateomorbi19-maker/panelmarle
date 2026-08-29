import { NextResponse, type NextRequest } from "next/server";
import { estaAutenticado } from "@/lib/auth";
import {
  enviarAdjuntoChatwoot,
  enviarMensajeChatwoot,
  problemaConElArchivo,
} from "@/lib/chatwoot";
import { db } from "@/lib/data";
import { estadoVentana } from "@/lib/ventana";

/**
 * Responderle a una clienta desde el panel: texto, o un archivo con o sin
 * texto.
 *
 * El camino es panel → Chatwoot → WhatsApp o Instagram. El token de Chatwoot
 * vive solo acá, en el servidor.
 *
 * Lo que este handler NO hace: guardar el mensaje en Supabase. De eso se
 * encarga la ingesta cuando Chatwoot avisa por su webhook. Si guardáramos
 * también acá tendríamos dos fuentes de verdad y el mensaje podría quedar
 * anotado sin haber salido.
 */

/** Cuánto texto acepta cada canal, del lado de Meta. */
const LIMITE: Record<string, number> = { instagram: 1000, whatsapp: 4096 };

/**
 * Tope duro del cuerpo entero, antes de leerlo.
 *
 * `req.formData()` junta TODO el archivo en memoria antes de que podamos mirar
 * su tamaño, así que validar después no protege al servidor de una subida
 * enorme. Se mira el Content-Length primero. Es holgado a propósito: los topes
 * finos por tipo (5 MB una foto, 16 MB un audio) se aplican después, con el
 * mensaje explicando cuál se pasó.
 */
const TOPE_CUERPO = 20 * 1024 * 1024;

interface Pedido {
  texto: string;
  archivo: File | null;
  error?: string;
}

/** Acepta las dos formas: JSON para texto solo, multipart cuando hay archivo. */
async function leerPedido(req: NextRequest): Promise<Pedido> {
  const tipo = req.headers.get("content-type") ?? "";

  if (tipo.includes("multipart/form-data")) {
    const formulario = await req.formData().catch(() => null);
    if (!formulario) {
      return { texto: "", archivo: null, error: "No pude leer el archivo." };
    }
    const crudo = formulario.get("archivo");
    const archivo = crudo instanceof File ? crudo : null;
    const texto = String(formulario.get("texto") ?? "").trim();
    return { texto, archivo };
  }

  const cuerpo = (await req.json().catch(() => null)) as {
    texto?: unknown;
  } | null;
  return {
    texto: typeof cuerpo?.texto === "string" ? cuerpo.texto.trim() : "",
    archivo: null,
  };
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/conversaciones/[id]/responder">
) {
  if (!(await estaAutenticado())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const conversacion = await db.conversacion(id);
  if (!conversacion) {
    return NextResponse.json(
      { error: "Esa conversación no existe" },
      { status: 404 }
    );
  }

  const declarado = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(declarado) && declarado > TOPE_CUERPO) {
    return NextResponse.json(
      {
        error: `Ese archivo pesa ${(declarado / 1024 / 1024).toFixed(1)} MB y es demasiado grande para mandarlo por WhatsApp o Instagram.`,
      },
      { status: 413 }
    );
  }

  const pedido = await leerPedido(req);
  if (pedido.error) {
    return NextResponse.json({ error: pedido.error }, { status: 400 });
  }

  const { texto, archivo } = pedido;

  // Con un archivo, el texto puede ir vacío: mandar una foto sola es normal.
  if (!texto && !archivo) {
    return NextResponse.json(
      { error: "El mensaje está vacío" },
      { status: 400 }
    );
  }

  const limite = LIMITE[conversacion.canal] ?? 4096;
  if (texto.length > limite) {
    return NextResponse.json(
      {
        error: `El mensaje es muy largo para ${conversacion.canal}: ${texto.length} caracteres y el máximo es ${limite}.`,
      },
      { status: 400 }
    );
  }

  if (archivo) {
    const problema = problemaConElArchivo(
      archivo.name,
      archivo.type,
      archivo.size
    );
    if (problema) {
      return NextResponse.json({ error: problema }, { status: 400 });
    }
  }

  if (!conversacion.chatwootConversationId) {
    return NextResponse.json(
      {
        error:
          "Esta conversación todavía no está vinculada a Chatwoot, así que no hay por dónde mandarle el mensaje.",
      },
      { status: 409 }
    );
  }

  // La ventana de 24 h de Meta. Se revisa acá y no solo en la pantalla: la
  // pantalla puede estar mostrando datos de hace un rato.
  const ventana = estadoVentana(conversacion.ultimoMensajeLeadAt);
  if (!ventana.abierta) {
    return NextResponse.json(
      {
        error: `Pasaron más de 24 horas desde el último mensaje de ${conversacion.nombre} (${ventana.detalle}). Meta no deja escribirle hasta que ella vuelva a escribir.`,
        ventanaCerrada: true,
      },
      { status: 409 }
    );
  }

  // Primero callar al agente y DESPUÉS enviar, nunca al revés: el webhook de
  // Chatwoot vuelve en menos de un segundo, y si llegara con el agente todavía
  // encendido este mensaje no entraría en su memoria.
  try {
    // false: contestar SÍ es atender. Si había una derivación pendiente, deja
    // de estarlo y la alerta se apaga.
    await db.apagarAgente(conversacion, false);
  } catch (error) {
    // Se corta acá a propósito. Si no pudimos callar al agente, mandar igual
    // significaría que él y Marle le escriban a la vez a la misma clienta.
    return NextResponse.json(
      {
        error: `No pude apagar el agente, así que no mandé el mensaje para que no le escriban los dos a la vez. ${
          error instanceof Error ? error.message : ""
        }`.trim(),
      },
      { status: 502 }
    );
  }

  try {
    const enviado = archivo
      ? await enviarAdjuntoChatwoot({
          conversacionChatwootId: conversacion.chatwootConversationId,
          cuentaId: conversacion.chatwootAccountId,
          texto: texto || undefined,
          archivo,
        })
      : await enviarMensajeChatwoot({
          conversacionChatwootId: conversacion.chatwootConversationId,
          cuentaId: conversacion.chatwootAccountId,
          texto,
        });

    return NextResponse.json({ ok: true, mensaje: enviado });
  } catch (error) {
    // El agente ya quedó apagado y así se deja: es la falla menos mala. Que se
    // quede callado mientras Marle reintenta es preferible a que le hable por
    // encima a una clienta que ella estaba atendiendo.
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo enviar el mensaje.",
        agenteApagado: true,
      },
      { status: 502 }
    );
  }
}
