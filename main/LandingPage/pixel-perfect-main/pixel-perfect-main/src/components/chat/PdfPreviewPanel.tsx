import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function PdfPreviewPanel({ page, fileName, onClose }: { page: number | null; fileName: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      {page !== null && (
        <motion.aside
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 34 }}
          className="glass-strong fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col sm:rounded-l-3xl"
          aria-label={`Preview of page ${page}`}
        >
          <div className="flex items-center gap-2 border-b border-border p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground">Page {page}</p>
            </div>
            <button aria-label="Close preview" onClick={onClose} className="ml-auto grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mx-auto aspect-[1/1.414] w-full rounded-xl bg-card p-6 shadow-xl">
              {Array.from({ length: 14 }).map((_, i) =>
                i === 5 ? (
                  <p key={i} className="my-2 rounded-md bg-primary/15 p-2 text-xs leading-relaxed text-card-foreground ring-1 ring-primary/40">
                    The relevant passage used to answer your question is highlighted here. Connect your backend to show the real page text.
                  </p>
                ) : (
                  <div key={i} className="my-2.5 h-2 rounded bg-muted" style={{ width: `${60 + ((i * 37) % 40)}%` }} />
                ),
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
