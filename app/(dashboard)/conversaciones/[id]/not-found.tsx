import Link from "next/link";
import { Seccion } from "@/components/seccion";
import { MessageCircleQuestionMark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/** Un enlace viejo, un id mal copiado, o una conversación que ya no está. */
export default function ConversacionNoEncontrada() {
  return (
    <Seccion>
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageCircleQuestionMark aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No encontramos este chat</EmptyTitle>
          <EmptyDescription>
            Puede que el enlace esté viejo o que la conversación se haya
            borrado.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/" />}>Volver a los chats</Button>
        </EmptyContent>
      </Empty>
    </Seccion>
  );
}
