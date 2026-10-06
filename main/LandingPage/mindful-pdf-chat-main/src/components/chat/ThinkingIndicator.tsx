import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const WORDS = [
  "Thinking...", "Reading your document...", "Searching relevant pages...",
  "Evaluating context...", "Cross-checking sources...", "Composing answer...",
];

export function ThinkingIndicator({ startedAt }: { startedAt: number }) {
  const [i, setI] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const w = setInterval(() => setI((x) => (x + 1) % WORDS.length), 1500);
    const t = setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 100);
    return () => { clearInterval(w); clearInterval(t); };
  }, [startedAt]);

  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <span className="relative flex size-3">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-60" />
        <span className="relative size-3 rounded-full bg-brand" />
      </span>
      <div className="relative h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="shimmer-text block text-sm font-medium leading-6"
          >
            {WORDS[i]}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{elapsed.toFixed(1)}s</span>
    </div>
  );
}

export function Reasoning({ duration, steps }: { duration: number; steps: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Thought for {Math.max(1, Math.round(duration))}s
        <ChevronRight size={14} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ol
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="mt-2 overflow-hidden border-l-2 border-primary/40 pl-4"
          >
            {steps.map((s, idx) => (
              <li key={idx} className="py-0.5 text-sm text-muted-foreground">{s}</li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}
