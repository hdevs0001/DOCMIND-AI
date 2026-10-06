import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Check, ChevronDown, FileText, Square } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatSize, type DocumentSummary } from "./types";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  busy: boolean;
  documents: DocumentSummary[];
  selectedDocument: DocumentSummary | null;
  onSelectDocument: (documentId: string) => void;
};

export function PromptBox({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  documents,
  selectedDocument,
  onSelectDocument,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);

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
        {selectedDocument && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 overflow-hidden"
          >
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-2.5 py-1.5">
              <span className="grid size-7 place-items-center rounded-lg bg-brand text-primary-foreground">
                <FileText size={14} />
              </span>
              <span className="max-w-[180px] truncate text-sm">{selectedDocument.name}</span>
              <span className="text-xs text-muted-foreground">{formatSize(selectedDocument.size)}</span>
              <Check size={13} className="text-success" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <label htmlFor="prompt" className="sr-only">
        Ask a question about your PDF
      </label>
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
        placeholder={selectedDocument ? "Ask anything about your PDF..." : "Select a document, then ask a question..."}
        className="block max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-2 py-2 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none"
      />

      <div className="mt-1 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex h-9 max-w-[260px] items-center gap-2 rounded-full border border-border px-3 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedDocument && "text-foreground",
            )}
            aria-label="Select a stored document"
          >
            <FileText size={15} className="shrink-0" />
            <span className="truncate">{selectedDocument?.name ?? "Select document"}</span>
            <ChevronDown size={14} className="ml-auto shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="glass-strong max-h-72 w-72 overflow-y-auto rounded-xl">
            {documents.length === 0 ? (
              <DropdownMenuItem disabled>No stored documents. Upload one from the sidebar.</DropdownMenuItem>
            ) : (
              documents.map((document) => (
                <DropdownMenuItem
                  key={document.id}
                  onClick={() => onSelectDocument(document.id)}
                  className="gap-2"
                >
                  <FileText size={14} />
                  <span className="min-w-0 flex-1 truncate">{document.name}</span>
                  <span className="text-[11px] text-muted-foreground">{formatSize(document.size)}</span>
                  {selectedDocument?.id === document.id && <Check size={14} className="text-primary" />}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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
            disabled={!canSend}
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
