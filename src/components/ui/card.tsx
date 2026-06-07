import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-sm font-semibold text-slate-900", className)}>{children}</h3>;
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-slate-500">{children}</p>;
}
