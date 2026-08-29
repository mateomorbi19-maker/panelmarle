import { User } from "lucide-react";
import { CANAL } from "@/components/canal-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { identidad, inicial, type Identificable } from "@/lib/identidad";
import { cn } from "@/lib/utils";

/**
 * La foto de la persona, con el canal marcado abajo a la derecha.
 *
 * De dónde sale la foto: Chatwoot sincroniza el avatar de Instagram y lo sirve
 * desde su propio almacenamiento, así que la URL es estable. En WhatsApp NO
 * hay foto — Meta no la comparte por la Cloud API — y ahí queda la inicial, o
 * el ícono de persona cuando el nombre es un número y una inicial no diría
 * nada.
 *
 * La marca de canal va sobre el avatar y no como etiqueta aparte para no
 * gastar ancho: en un teléfono cada renglón de la lista tiene que entrar
 * entero sin cortar el nombre.
 */

/**
 * Los dos tamaños en que se usa. La marca de canal escala CON el avatar: con
 * una medida fija, sobre el avatar chico de la barra del chat tapaba media
 * foto.
 */
const TAMANOS = {
  lista: { avatar: "size-12", marca: "size-[18px]", icono: "size-2.5" },
  barra: { avatar: "size-9", marca: "size-3.5", icono: "size-2" },
} as const;

export function AvatarContacto({
  conversacion,
  tamano = "lista",
}: {
  conversacion: Identificable & { avatarUrl?: string };
  tamano?: keyof typeof TAMANOS;
}) {
  const { Icono, etiqueta } = CANAL[conversacion.canal];
  const medidas = TAMANOS[tamano];
  const letra = inicial(conversacion);

  return (
    <span className="relative shrink-0">
      <Avatar className={medidas.avatar}>
        {conversacion.avatarUrl ? (
          <AvatarImage
            src={conversacion.avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : null}
        <AvatarFallback
          className={cn(
            "font-medium",
            tamano === "lista" ? "text-base" : "text-sm"
          )}
        >
          {letra || (
            <User
              aria-hidden="true"
              className={tamano === "lista" ? "size-5" : "size-4"}
            />
          )}
        </AvatarFallback>
      </Avatar>

      <span
        className={cn(
          "border-background absolute -right-0.5 -bottom-0.5 flex items-center justify-center rounded-full border-2",
          medidas.marca,
          conversacion.canal === "whatsapp" ? "bg-whatsapp" : "bg-instagram"
        )}
      >
        <Icono aria-hidden="true" className={cn(medidas.icono, "text-white")} />
        <span className="sr-only">
          {etiqueta} · {identidad(conversacion)}
        </span>
      </span>
    </span>
  );
}
