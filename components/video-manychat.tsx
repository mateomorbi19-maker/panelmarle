"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

const VIDEO_ID = "KXd6jYUV4GI";
const TITULO = "Cómo configurar tus flujos de ManyChat";

export function VideoManyChat() {
  const [reproduciendo, setReproduciendo] = useState(false);
  const [miniatura, setMiniatura] = useState("maxresdefault");

  if (reproduciendo) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1`}
        title={TITULO}
        className="aspect-video w-full border-0 bg-black"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setReproduciendo(true)}
      aria-label={`Reproducir video: ${TITULO}`}
      className="group focus-visible:outline-ring relative block aspect-video w-full cursor-pointer overflow-hidden bg-black focus-visible:outline-4 focus-visible:-outline-offset-4"
    >
      <Image
        src={`https://i.ytimg.com/vi/${VIDEO_ID}/${miniatura}.jpg`}
        alt=""
        fill
        unoptimized
        loading="eager"
        sizes="(max-width: 1024px) 100vw, 976px"
        className="object-cover"
        onError={() => setMiniatura("hqdefault")}
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/20">
        <span className="flex h-12 w-18 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg transition-transform group-hover:scale-105 sm:h-14 sm:w-20">
          <Play aria-hidden="true" className="size-7 fill-current" />
        </span>
      </span>
    </button>
  );
}
