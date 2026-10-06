import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoMark({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <span className={cn("grid place-items-center rounded-xl bg-brand text-primary-foreground shadow-glow", className)}>
      <BrainCircuit size={size} aria-hidden />
    </span>
  );
}
