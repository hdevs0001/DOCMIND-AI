import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, Moon, PanelLeftOpen, Share, Sparkle, Sun } from "lucide-react";

const iconBtn =
  "grid size-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Props = {
  inChat: boolean;
  title: string;
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  onOpenMobile: () => void;
  dark: boolean;
  onToggleTheme: () => void;
};

export function TopBar({ inChat, title, sidebarOpen, onOpenSidebar, onOpenMobile, dark, onToggleTheme }: Props) {
  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center gap-2 px-3">
      <button className={`${iconBtn} md:hidden`} aria-label="Open menu" onClick={onOpenMobile}><Menu size={18} /></button>
      {!sidebarOpen && (
        <button className={`${iconBtn} hidden md:grid`} aria-label="Open sidebar" onClick={onOpenSidebar}><PanelLeftOpen size={18} /></button>
      )}

      <div className="relative flex flex-1 items-center">
        <AnimatePresence mode="wait" initial={false}>
          {inChat ? (
            <motion.button
              key="title"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="flex max-w-[60vw] items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Chat options"
            >
              <span className="truncate">{title}</span>
              <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
            </motion.button>
          ) : (
            <motion.div
              key="pill"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="absolute left-1/2 -translate-x-1/2"
            >
              <a href="#" className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Free plan <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1 font-medium text-cyan"><Sparkle size={11} /> Upgrade</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {inChat && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Share size={14} /> Share
          </motion.button>
        )}
      </AnimatePresence>
      <button className={iconBtn} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={onToggleTheme}>
        {dark ? <Sun size={17} /> : <Moon size={17} />}
      </button>
    </header>
  );
}
