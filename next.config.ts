import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Salida "standalone": genera .next/standalone/server.js con solo lo necesario
  // para correr, ideal para el contenedor Docker (imagen chica).
  output: "standalone",
  // Este proyecto vive anidado dentro de otra carpeta con package-lock.json (el
  // proyecto del agente): fijamos la raíz para que el trazado de archivos del
  // standalone y Turbopack no la infieran mal.
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
