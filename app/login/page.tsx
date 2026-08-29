import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { estaAutenticado } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default async function LoginPage() {
  // Si ya hay sesión, directo al panel.
  if (await estaAutenticado()) redirect("/");

  return (
    <div className="flex min-h-svh flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-6" aria-hidden="true" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Marle Nails
          </h1>
          <p className="text-muted-foreground text-sm text-balance">
            Monitoreo de contactos, integrantes, checkouts y alertas
          </p>
        </div>
      </div>
      <LoginForm />
      <p className="text-muted-foreground text-xs">
        Demo — tocá <span className="font-medium">Ingresar</span> con el usuario
        Marle
      </p>
    </div>
  );
}
