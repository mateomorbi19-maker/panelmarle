import { redirect } from "next/navigation";

/**
 * Los chats viven en el inicio, no en una sección aparte.
 *
 * Esta ruta queda solo por los enlaces viejos (marcadores, la vuelta desde un
 * chat) para que ninguno muera en un 404.
 */
export default function ConversacionesPage() {
  redirect("/");
}
