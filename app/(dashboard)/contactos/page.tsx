import type { Metadata } from "next";
import {
  TablaContactos,
  type ContactoFila,
} from "@/components/contactos/tabla-contactos";
import { SectionHeader } from "@/components/section-header";
import { db } from "@/lib/data";
import { formatearFecha } from "@/lib/format";

export const metadata: Metadata = {
  title: "Contactos",
};

/**
 * Contactos: todas las personas que pasaron por el chat del agente,
 * ordenadas de más reciente a más antigua por su primer contacto.
 * El server lee los datos y formatea las fechas; la tabla cliente
 * solo filtra y muestra.
 */
export default async function ContactosPage() {
  const contactos = await db.contactos();

  const filas: ContactoFila[] = [...contactos]
    .sort(
      (a, b) =>
        new Date(b.fechaPrimerContacto).getTime() -
        new Date(a.fechaPrimerContacto).getTime()
    )
    .map((contacto) => ({
      id: contacto.id,
      nombre: contacto.nombre,
      telefono: contacto.telefono,
      canal: contacto.canal,
      estado: contacto.estado,
      fechaFormateada: formatearFecha(contacto.fechaPrimerContacto),
    }));

  return (
    <>
      <SectionHeader
        titulo="Contactos"
        descripcion="Todas las personas que pasaron por el chat del agente"
      />
      <TablaContactos filas={filas} />
    </>
  );
}
