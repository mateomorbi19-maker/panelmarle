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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
      {children}
    </div>
  );
}
