/**
 * El título de una sección.
 *
 * Ya no lleva descripción: en un teléfono era un renglón que nadie leía y que
 * empujaba para abajo lo único que importa. Si algo necesita explicarse, se
 * explica donde pasa, no en un subtítulo.
 */
export function SectionHeader({
  titulo,
  children,
}: {
  titulo: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      {/* La serif editorial: es lo que hace que cada pantalla sea de Marle
          Nails y no una plantilla. Solo acá y en las cifras grandes. */}
      <h1 className="font-heading text-[1.75rem] leading-tight font-semibold tracking-tight">
        {titulo}
      </h1>
      {children}
    </div>
  );
}
