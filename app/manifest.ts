import type { MetadataRoute } from "next";

/**
 * Para que el panel se pueda agregar a la pantalla de inicio del teléfono con
 * su propio ícono y se abra sin la barra del navegador, como una app.
 *
 * En iPhone el ícono lo toma de `app/apple-icon.png`; este archivo es sobre
 * todo para Android, que lee de acá el nombre, el ícono y los colores.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Marle Nails",
    short_name: "Marle",
    description:
      "Los chats de WhatsApp e Instagram de Marle Nails, y el agente que los contesta.",
    start_url: "/",
    display: "standalone",
    // El marfil y el borgoña de la identidad (ver globals.css): el splash de
    // Android abre del color del panel, no de un azul que no es de nadie.
    background_color: "#fbf7f4",
    theme_color: "#6f263d",
    lang: "es",
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icono-512.png",
        sizes: "512x512",
        type: "image/png",
        // "maskable" deja que Android lo recorte a la forma del sistema
        // (círculo, cuadrado redondeado) sin que quede un marco blanco.
        purpose: "maskable",
      },
    ],
  };
}
