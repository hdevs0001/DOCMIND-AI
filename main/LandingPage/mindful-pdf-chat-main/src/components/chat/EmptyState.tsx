import { motion } from "framer-motion";
import { LogoMark } from "./Logo";

export function Greeting() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      className="mb-8 flex flex-col items-center gap-4 text-center"
    >
      <LogoMark className="size-12 rounded-2xl" size={24} />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        What do you want to <span className="text-brand">know?</span>
      </h1>
    </motion.div>
  );
}

const SUGGESTIONS = ["Summarize this document", "What are the key points?", "List the important dates"];

export function Suggestions({ onPick }: { onPick: (s: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="mt-5 flex flex-wrap justify-center gap-2"
    >
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onPick(s)}
          className="glass rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {s}
        </button>
      ))}
    </motion.div>
  );
}
