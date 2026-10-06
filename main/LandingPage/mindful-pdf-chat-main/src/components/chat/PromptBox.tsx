import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, CheckCircle2, FileText, Loader2, Plus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSize } from "./types";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  busy: boolean;
  file: File | null;
  onFile: (f: File | null) => void;
  fileError: string | null;
  uploading: boolean;
  uploaded: boolean;
};

export function PromptBox({ value, onChange, onSubmit, onStop, busy, file, onFile, fileError, uploading, uploaded }: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [value]);

  useEffect(() => {
    if (!busy) taRef.current?.focus();
  }, [busy]);

  const canSend = value.trim().length > 0 && !busy;

  return (
    <div className="glass-strong rounded-3xl p-3 shadow-2xl shadow-background/40 transition focus-within:border-primary/50">
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-2 inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-2.5 py-1.5">
              <span className="grid size-7 place-items-center rounded-lg bg-brand text-primary-foreground"><FileText size={14} /></span>
              <span className="max-w-[180px] truncate text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
              {uploading && (
                <span className="inline-flex items-center gap-1 text-xs text-cyan">
                  <Loader2 size={12} className="animate-spin" /> Saving
                </span>
              )}
              {!uploading && uploaded && (
                <span className="inline-flex items-center gap-1 text-xs text-success">
                  <CheckCircle2 size={12} /> Stored
                </span>
              )}
              <button
                aria-label="Remove attached PDF"
                onClick={() => onFile(null)}
                className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {fileError && <p role="alert" className="mb-2 px-1 text-sm text-destructive">{fileError}</p>}

      <label htmlFor="prompt" className="sr-only">Ask a question about your PDF</label>
      <textarea
        id="prompt"
        ref={taRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSend) onSubmit();
          }
        }}
        placeholder="Ask anything about your PDF..."
        className="block max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-2 py-2 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none"
      />

      <div className="mt-1 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => { onFile(e.target.files?.[0] ?? null); e.target.value = ""; }}
        />
        <button
          aria-label="Attach PDF"
          onClick={() => fileRef.current?.click()}
          className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus size={18} />
        </button>
        <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">Document mode</span>
        {busy ? (
          <button
            aria-label="Stop generating"
            onClick={onStop}
            className="grid size-9 place-items-center rounded-full bg-foreground text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Square size={13} fill="currentColor" />
          </button>
        ) : (
          <button
            aria-label="Send message"
            disabled={!canSend || uploading}
            onClick={onSubmit}
            className={cn(
              "grid size-9 place-items-center rounded-full bg-brand text-primary-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              canSend ? "hover:shadow-glow hover:brightness-110" : "cursor-not-allowed opacity-40",
              "max-sm:ml-auto",
            )}
          >
            <ArrowUp size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
