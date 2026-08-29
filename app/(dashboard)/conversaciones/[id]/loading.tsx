import { Skeleton } from "@/components/ui/skeleton";

/** Espera del chat: la misma barra de arriba y burbujas alternadas. */
export default function ConversacionLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-2">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="flex flex-col gap-3 px-3 py-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={i % 2 === 0 ? "flex justify-start" : "flex justify-end"}
          >
            <Skeleton className="h-14 w-[min(24rem,70%)] rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
