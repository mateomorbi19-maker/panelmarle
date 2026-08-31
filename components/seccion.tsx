import { cn } from "@/lib/utils";

/**
 * El margen de una sección que NO es la lista de chats.
 *
 * El armazón dejó de poner relleno propio para que la lista de chats pueda ir
 * de borde a borde, como en una app de mensajería. Todo lo demás se envuelve
 * acá para recuperar el aire.
 */
export function Seccion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 md:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
