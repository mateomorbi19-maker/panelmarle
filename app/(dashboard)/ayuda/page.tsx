import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { Seccion } from "@/components/seccion";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Ayuda",
};

export default function AyudaPage() {
  return (
    <Seccion>
      <SectionHeader titulo="Ayuda" />

      <section
        aria-labelledby="manychat-titulo"
        className="bg-card overflow-hidden rounded-xl border"
      >
        <div className="space-y-2 p-4 md:p-6">
          <h2 id="manychat-titulo" className="text-lg font-semibold">
            Cómo configurar tus flujos de ManyChat
          </h2>
          <p className="text-muted-foreground text-sm">
            Seguí el paso a paso del video y volvé a consultarlo cuando lo
            necesites.
          </p>
        </div>

        <iframe
          src="https://www.youtube-nocookie.com/embed/KXd6jYUV4GI"
          title="Cómo configurar tus flujos de ManyChat"
          className="aspect-video w-full border-0 bg-black"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />

        <div className="p-4 md:px-6">
          <a
            href="https://youtu.be/KXd6jYUV4GI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary focus-visible:outline-ring inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Abrir en YouTube
            <ExternalLink aria-hidden="true" className="size-4" />
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        </div>
      </section>
    </Seccion>
  );
}
