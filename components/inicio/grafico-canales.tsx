import { CANAL } from "@/components/canal-badge";

/**
 * Contactos por canal: una barra partida, no una dona.
 *
 * Acá había una dona de recharts y se fue por dos razones. La honesta: se
 * dibujaba rota en el teléfono (los gajos aparecían chiquitos y corridos a una
 * esquina, un problema de medición del contenedor que ya venía de antes del
 * rediseño). Y la de diseño: para comparar DOS categorías, una barra partida
 * dice más en menos alto — la proporción se ve de un golpe y los números van
 * al lado del nombre, no en una leyenda aparte.
 *
 * Los colores son los tokens de canal de siempre (los mismos de CanalBadge),
 * y como siempre la identidad no es solo color: cada canal lleva su ícono, su
 * nombre y su cifra.
 */
export function GraficoCanales({
  whatsapp,
  instagram,
}: {
  whatsapp: number;
  instagram: number;
}) {
  const total = whatsapp + instagram;

  if (total === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        Todavía no hay contactos para repartir por canal.
      </p>
    );
  }

  const porcentajeWhatsapp = Math.round((whatsapp / total) * 100);
  const canales = [
    { clave: "whatsapp" as const, cuenta: whatsapp, porcentaje: porcentajeWhatsapp },
    { clave: "instagram" as const, cuenta: instagram, porcentaje: 100 - porcentajeWhatsapp },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* La proporción, de un vistazo. */}
      <div
        role="img"
        aria-label={`WhatsApp ${whatsapp} contactos (${porcentajeWhatsapp}%), Instagram ${instagram} (${100 - porcentajeWhatsapp}%)`}
        className="flex h-3 gap-0.5 overflow-hidden rounded-full"
      >
        {canales.map(({ clave, cuenta }) =>
          cuenta > 0 ? (
            <span
              key={clave}
              className={clave === "whatsapp" ? "bg-whatsapp" : "bg-instagram"}
              style={{ width: `${(cuenta / total) * 100}%` }}
            />
          ) : null
        )}
      </div>

      {/* Cada canal con su ícono, su nombre y su cifra. */}
      <dl className="flex flex-col gap-1.5">
        {canales.map(({ clave, cuenta, porcentaje }) => {
          const { etiqueta, Icono } = CANAL[clave];
          return (
            <div key={clave} className="flex items-center gap-2">
              <dt className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                <span
                  className={
                    clave === "whatsapp"
                      ? "bg-whatsapp flex size-5 shrink-0 items-center justify-center rounded-full text-white"
                      : "bg-instagram flex size-5 shrink-0 items-center justify-center rounded-full text-white"
                  }
                >
                  <Icono aria-hidden="true" className="size-3" />
                </span>
                {etiqueta}
              </dt>
              <dd className="text-sm tabular-nums">
                <span className="font-semibold">{cuenta}</span>{" "}
                <span className="text-muted-foreground">· {porcentaje} %</span>
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="text-muted-foreground text-xs">
        {total} contactos en total
      </p>
    </div>
  );
}
