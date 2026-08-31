import type { Metadata } from "next";
import {
  ListaCorrecciones,
  type CorreccionItem,
} from "@/components/correcciones/lista-correcciones";
import { Seccion } from "@/components/seccion";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/data";
import type { Correccion } from "@/lib/data/types";
import { fechaRelativa, horaCorta } from "@/lib/format";

export const metadata: Metadata = {
  title: "Correcciones",
};

/**
 * Lo que hay que arreglarle al agente.
 *
 * Se anotan desde adentro de un chat (tres puntos → Corrección) y se leen acá,
 * todas juntas: son la lista de cambios pendientes del prompt.
 *
 * A diferencia del globito del menú —que se traga su error para no tumbar el
 * panel entero—, si acá falla la lectura se deja explotar (lo agarra
 * `app/(dashboard)/error.tsx`). Una pantalla vacía que en realidad no pudo
 * leer haría creer que no quedaba nada por arreglar.
 */

/** Lo más nuevo arriba. */
function porFechaDesc(a: Correccion, b: Correccion): number {
  return new Date(b.creadaAt).getTime() - new Date(a.creadaAt).getTime();
}

/** Las fechas se resuelven en el SERVER, con la zona horaria del panel. */
function serializar(correccion: Correccion): CorreccionItem {
  return {
    id: correccion.id,
    conversacionId: correccion.conversacionId,
    contacto: correccion.contacto,
    canal: correccion.canal,
    descripcion: correccion.descripcion,
    mensajes: correccion.mensajes.map((mensaje, i) => ({
      // El id del mensaje puede repetirse entre correcciones y hasta faltar en
      // filas viejas: se le suma la posición para que la key sea única.
      id: `${mensaje.mensajeId || "sin-id"}-${i}`,
      texto: mensaje.texto?.trim() || "(sin texto)",
      hora: mensaje.fecha ? horaCorta(mensaje.fecha) : "",
    })),
    estado: correccion.estado,
    cuando: fechaRelativa(correccion.creadaAt),
  };
}

export default async function CorreccionesPage() {
  const correcciones = await db.correcciones();
  const items = [...correcciones].sort(porFechaDesc).map(serializar);
  const pendientes = items.filter((c) => c.estado === "pendiente").length;

  return (
    <Seccion>
      <SectionHeader titulo="Correcciones">
        <Badge
          variant="outline"
          className="border-primary/25 bg-primary/10 text-primary"
        >
          {pendientes} por arreglar
        </Badge>
      </SectionHeader>

      <ListaCorrecciones correcciones={items} />
    </Seccion>
  );
}
