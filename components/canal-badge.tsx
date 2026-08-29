import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Canal } from "@/lib/data/types";

/**
 * Ícono de Instagram inline (lucide-react ya no incluye íconos de marcas).
 * Mismo trazo/estilo que los íconos de lucide para que conviva con el resto.
 */
export function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

/**
 * Badge de canal (WhatsApp / Instagram) con ícono + etiqueta.
 * Los colores vienen de los tokens --color-whatsapp / --color-instagram
 * definidos en globals.css (la identidad nunca es solo color: siempre hay
 * ícono y texto).
 */
export const CANAL: Record<
  Canal,
  {
    etiqueta: string;
    Icono: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    className: string;
  }
> = {
  whatsapp: {
    etiqueta: "WhatsApp",
    Icono: MessageCircle,
    className: "border-whatsapp/25 bg-whatsapp/10 text-whatsapp",
  },
  instagram: {
    etiqueta: "Instagram",
    Icono: InstagramIcon,
    className: "border-instagram/25 bg-instagram/10 text-instagram",
  },
};

export function CanalBadge({ canal }: { canal: Canal }) {
  const { etiqueta, Icono, className } = CANAL[canal];
  return (
    <Badge variant="outline" className={className}>
      <Icono aria-hidden="true" />
      {etiqueta}
    </Badge>
  );
}
