import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "good" | "warning" | "bad" | "neutral";
  className?: string;
}) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    bad: "bg-rose-100 text-rose-800",
    neutral: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
