import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Marca } from "@/components/marca";
import { estaAutenticado } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default async function LoginPage() {
  // Si ya hay sesión, directo al panel.
  if (await estaAutenticado()) redirect("/");

  return (
    <div className="flex min-h-svh flex-1 flex-col items-center justify-center gap-7 p-6">
      {/* La misma marca del panel, en grande: el monograma serif y el nombre.
          Nada de íconos genéricos de brillitos. */}
      <div className="flex flex-col items-center gap-2.5 text-center">
        <h1>
          <Marca tamano="portada" />
          <span className="sr-only">Marle Nails</span>
        </h1>
        <p className="text-muted-foreground max-w-xs text-sm text-balance">
          Los chats de WhatsApp e Instagram, y el agente que los contesta
        </p>
      </div>
      <LoginForm />
      <p className="text-muted-foreground text-xs">
        Demo — tocá <span className="font-medium">Ingresar</span> con el usuario
        Marle
      </p>
    </div>
  );
}
