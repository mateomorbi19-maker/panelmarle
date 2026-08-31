import { cn } from "@/lib/utils";

/**
 * La marca del panel: el monograma "MN" y el nombre en la serif editorial.
 *
 * Sale de los mockups de design/: un cuadrado borgoña con el monograma serif
 * y "Marle Nails" al lado. Es UN componente para que la barra y el login no
 * puedan dibujar la marca distinta.
 */
export function Marca({
  tamano = "barra",
  className,
}: {
  /** barra = compacta para la cabecera · portada = grande para el login. */
  tamano?: "barra" | "portada";
  className?: string;
}) {
  const portada = tamano === "portada";
  return (
    <span className={cn("flex items-center", portada ? "gap-3" : "gap-2", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "bg-primary text-primary-foreground font-heading flex shrink-0 items-center justify-center rounded-lg font-semibold",
          portada ? "size-14 rounded-xl text-2xl" : "size-8 text-[15px]"
        )}
      >
        MN
      </span>
      <span
        className={cn(
          "font-heading min-w-0 truncate font-semibold tracking-tight",
          portada ? "text-3xl" : "text-lg"
        )}
      >
        Marle Nails
      </span>
    </span>
  );
}
