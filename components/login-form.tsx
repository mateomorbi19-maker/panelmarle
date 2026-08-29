"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function LoginForm() {
  const router = useRouter();
  const [pendiente, setPendiente] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function manejarSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setPendiente(true);

    const datos = new FormData(evento.currentTarget);
    try {
      // Se cierra el teclado antes de navegar: si no, en un teléfono viaja
      // abierto hasta la pantalla siguiente.
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const respuesta = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: String(datos.get("usuario") ?? "") }),
      });

      if (respuesta.ok) {
        router.replace("/");
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(cuerpo?.error ?? "No se pudo iniciar sesión");
      setPendiente(false);
    } catch {
      setError("No se pudo conectar con el servidor");
      setPendiente(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Ingresá con el usuario Marle para ver el panel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={manejarSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="usuario">Usuario</FieldLabel>
              <Input
                id="usuario"
                name="usuario"
                type="text"
                defaultValue="Marle"
                // NO va "username": no hay contraseña que guardar, y
                // marcarlo así hacía que el navegador guardara una credencial
                // para este sitio. Después la ofrecía en cualquier campo de
                // texto del panel —incluido el buscador de chats— pidiendo la
                // huella o la cara.
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                // SIN autoFocus a propósito. En un teléfono abría el teclado
                // solo al entrar, y como el paso al panel es una navegación
                // interna (la página no recarga), el teclado se quedaba
                // abierto: aterrizabas en los chats con el teclado arriba y
                // parecía que se había seleccionado el buscador.
                required
                aria-invalid={error ? true : undefined}
              />
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
            <Field>
              <Button type="submit" disabled={pendiente} className="w-full">
                {pendiente ? <Spinner data-icon="inline-start" /> : null}
                Ingresar
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
