import { ListaAlertas } from "@/components/alertas/lista-alertas";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/data";
import type { Alerta } from "@/lib/data/types";
import { fechaRelativa } from "@/lib/format";
import { Seccion } from "@/components/seccion";

export const metadata = {
  title: "Alertas",
};

/** Orden por fecha descendente (lo más reciente primero). */
function porFechaDesc(a: Alerta, b: Alerta): number {
  return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
}

/** Serializa la alerta para el cliente: fecha y enlaces ya resueltos en el server. */
function serializar(alerta: Alerta) {
  return {
    id: alerta.id,
    nombre: alerta.nombre,
    telefono: alerta.telefono,
    motivo: alerta.motivo,
    fecha: fechaRelativa(alerta.fecha),
    conversacionId: alerta.conversacionId,
    conversacionPanelId: alerta.conversacionPanelId,
    href: alerta.href,
    canal: alerta.canal,
  };
}

export default async function AlertasPage() {
  const alertas = await db.alertas();

  const pendientes = alertas
    .filter((a) => !a.atendida)
    .sort(porFechaDesc)
    .map(serializar);
  const atendidas = alertas
    .filter((a) => a.atendida)
    .sort(porFechaDesc)
    .map(serializar);

  return (
    <Seccion>
      <SectionHeader
        titulo="Alertas"
      >
        <Badge
          variant="outline"
          className="border-primary/25 bg-primary/10 text-primary"
        >
          {pendientes.length} pendientes
        </Badge>
      </SectionHeader>

      <ListaAlertas pendientes={pendientes} atendidas={atendidas} />
    </Seccion>
  );
}
