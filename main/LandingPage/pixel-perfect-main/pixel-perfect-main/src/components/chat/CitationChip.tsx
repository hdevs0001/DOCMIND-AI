import { BookOpen } from "lucide-react";

export function CitationChip({ page, onClick }: { page: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Open source page ${page}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-xs font-medium text-cyan transition hover:bg-cyan/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <BookOpen size={12} /> Page {page}
    </button>
  );
}
