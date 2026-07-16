/** Encabezado estándar de cada sección del panel. */
export function SectionHeader({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descripcion ? (
          <p className="text-muted-foreground text-sm">{descripcion}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
