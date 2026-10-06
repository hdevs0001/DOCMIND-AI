import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText, FileUp, History, MoreHorizontal, PanelLeftClose, Pencil, Pin, PinOff, Search, Settings, SquarePen, Trash2, Upload, X,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatSize, type ChatSummary, type DocumentSummary } from "./types";
import { LogoMark } from "./Logo";

type Props = {
  open: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  onCloseMobile: () => void;
  chats: ChatSummary[];
  documents: DocumentSummary[];
  activeChatId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, title: string) => Promise<void>;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onUploadDocument: (file: File | null) => void;
  uploadingDocument: boolean;
};

const iconBtn =
  "grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SidebarBody(p: Props & { mobile?: boolean }) {
  const pinned = p.chats.filter((c) => c.pinned);
  const recent = p.chats.filter((c) => !c.pinned);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const Row = ({ c }: { c: ChatSummary }) => {
    const [editing, setEditing] = React.useState(false);
    const [title, setTitle] = React.useState(c.title);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => setTitle(c.title), [c.title]);

    const save = async () => {
      const next = title.trim();
      if (!next || next === c.title) {
        setEditing(false);
        setTitle(c.title);
        return;
      }

      setSaving(true);
      try {
        await p.onRename(c.id, next);
        setEditing(false);
      } finally {
        setSaving(false);
      }
    };

    return (
      <li className="group relative">
        {editing ? (
          <div className="flex items-center gap-1 rounded-lg bg-sidebar-accent p-1">
            <Input
              autoFocus
              value={title}
              disabled={saving}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void save();
                if (e.key === "Escape") {
                  setEditing(false);
                  setTitle(c.title);
                }
              }}
              className="h-8 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0"
              aria-label="Chat name"
            />
            <button
              onClick={() => void save()}
              disabled={saving}
              className="grid size-7 place-items-center rounded-md text-xs text-primary hover:bg-accent disabled:opacity-50"
              aria-label="Save chat name"
            >
              ✓
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => p.onSelect(c.id)}
              className={cn(
                "w-full truncate rounded-lg px-3 py-2 pr-9 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                p.activeChatId === c.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {c.title}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Options for ${c.title}`}
                className="absolute right-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreHorizontal size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-strong rounded-xl">
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil size={14} /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => p.onTogglePin(c.id)}>
                  {c.pinned ? <PinOff size={14} /> : <Pin size={14} />} {c.pinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => p.onDelete(c.id)}>
                  <Trash2 size={14} /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </li>
    );
  };

  return (
    <div className="flex h-full w-[260px] flex-col gap-4 p-3">
      <div className="flex items-center gap-2 px-1 pt-1">
        <LogoMark className="size-8" size={16} />
        <span className="font-display text-[15px] font-semibold tracking-tight">DocMindAI</span>
        <div className="ml-auto flex">
          <button className={iconBtn} aria-label="Search chats"><Search size={16} /></button>
          {p.mobile ? (
            <button className={iconBtn} aria-label="Close menu" onClick={p.onCloseMobile}><X size={16} /></button>
          ) : (
            <button className={iconBtn} aria-label="Collapse sidebar" onClick={p.onClose}><PanelLeftClose size={16} /></button>
          )}
        </div>
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Main">
        <button
          onClick={p.onNewChat}
          className="flex items-center gap-2.5 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-primary-foreground shadow-glow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <SquarePen size={16} /> New chat
        </button>

        <div className="rounded-2xl border border-border/70 bg-sidebar-accent/40 p-2">
          <div className="flex items-center gap-2 px-2 pb-2">
            <FileText size={16} className="text-primary" />
            <span className="text-sm font-medium">Documents</span>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                p.onUploadDocument(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
            <button
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary transition hover:bg-accent"
              onClick={() => fileRef.current?.click()}
              disabled={p.uploadingDocument}
            >
              {p.uploadingDocument ? <FileUp size={13} className="animate-pulse" /> : <Upload size={13} />}
              {p.uploadingDocument ? "Saving..." : "Upload"}
            </button>
          </div>

          {p.documents.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted-foreground">No PDFs stored yet.</p>
          ) : (
            <ul className="flex max-h-44 flex-col gap-1 overflow-y-auto">
              {p.documents.map((document) => (
                <li key={document.id} className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground">
                  <FileText size={13} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate" title={document.name}>{document.name}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground/70">{formatSize(document.size)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <History size={16} /> History
        </button>
      </nav>

      <div className="-mx-1 flex-1 overflow-y-auto px-1">
        {pinned.length > 0 && (
          <section className="mb-4">
            <h2 className="px-3 pb-1 font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Pinned</h2>
            <ul className="flex flex-col gap-0.5">{pinned.map((c) => <Row key={c.id} c={c} />)}</ul>
          </section>
        )}
        <section>
          <h2 className="px-3 pb-1 font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Recent chats</h2>
          {recent.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No chats yet.</p>
          ) : (
            <ul className="flex flex-col gap-0.5">{recent.map((c) => <Row key={c.id} c={c} />)}</ul>
          )}
        </section>
      </div>

      <div className="glass flex items-center gap-3 rounded-2xl p-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-accent text-sm font-semibold">A</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">Alex Morgan</p>
          <span className="inline-block rounded-full border border-border px-1.5 text-[10px] font-medium text-muted-foreground">Free</span>
        </div>
        <button className={iconBtn} aria-label="Settings"><Settings size={16} /></button>
      </div>
    </div>
  );
}

export function Sidebar(props: Props) {
  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: props.open ? 260 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 34 }}
        className="glass relative z-20 hidden h-full shrink-0 overflow-hidden border-y-0 border-l-0 md:block"
        aria-label="Sidebar"
      >
        <SidebarBody {...props} />
      </motion.aside>

      <AnimatePresence>
        {props.mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={props.onCloseMobile}
            />
            <motion.aside
              className="glass-strong fixed inset-y-0 left-0 z-50 md:hidden"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              aria-label="Sidebar"
            >
              <SidebarBody {...props} mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
