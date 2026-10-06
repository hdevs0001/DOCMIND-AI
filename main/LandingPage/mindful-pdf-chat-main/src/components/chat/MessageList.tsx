import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { AlertCircle, ArrowDown, Check, Copy, FileText, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { LogoMark } from "./Logo";
import { ThinkingIndicator, Reasoning } from "./ThinkingIndicator";
import { CitationChip } from "./CitationChip";
import { formatSize, type ChatMessage } from "./types";

type Props = {
  messages: ChatMessage[];
  isThinking: boolean;
  thinkingStartedAt: number;
  onRegenerate: () => void;
  onCitation: (page: number) => void;
};

const actBtn =
  "grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:text-primary";

function AssistantActions({ text, onRegenerate }: { text: string; onRegenerate: () => void }) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  return (
    <div className="mt-2 flex gap-0.5">
      <button className={actBtn} aria-label="Copy answer" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
      <button className={actBtn} aria-label="Regenerate answer" onClick={onRegenerate}><RotateCcw size={15} /></button>
      <button className={actBtn} aria-label="Good answer" aria-pressed={vote === "up"} onClick={() => setVote(vote === "up" ? null : "up")}><ThumbsUp size={15} /></button>
      <button className={actBtn} aria-label="Bad answer" aria-pressed={vote === "down"} onClick={() => setVote(vote === "down" ? null : "down")}><ThumbsDown size={15} /></button>
    </div>
  );
}

export function MessageList({ messages, isThinking, thinkingStartedAt, onRegenerate, onCitation }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && atBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking, atBottom]);

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
        }}
        className="h-full overflow-y-auto"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-6" aria-live="polite">
          {messages.map((m) =>
            m.role === "user" ? (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col items-end gap-2">
                {m.attachment && (
                  <div className="glass inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5">
                    <FileText size={14} className="text-primary" />
                    <span className="max-w-[200px] truncate text-sm">{m.attachment.name}</span>
                    <span className="text-xs text-muted-foreground">{formatSize(m.attachment.size)}</span>
                  </div>
                )}
                <div className="glass max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg px-4 py-2.5 text-[15px]">{m.content}</div>
              </motion.div>
            ) : (
              <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <LogoMark className="mt-0.5 size-7 shrink-0 rounded-lg" size={14} />
                <div className="min-w-0 flex-1">
                  {m.error ? (
                    <div role="alert" className="flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      <AlertCircle size={16} /> {m.error}
                      <button onClick={onRegenerate} className="ml-auto rounded-md px-2 py-1 font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Retry</button>
                    </div>
                  ) : (
                    <>
                      <Reasoning duration={m.thinkingDuration} steps={m.reasoning} />
                      <div className="prose-chat text-[15px] text-foreground/90">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                      {!m.streaming && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          {m.citations.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {m.citations.map((p) => <CitationChip key={p} page={p} onClick={() => onCitation(p)} />)}
                            </div>
                          )}
                          <AssistantActions text={m.content} onRegenerate={m.id === lastAssistantId ? onRegenerate : () => {}} />
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ),
          )}
          {isThinking && (
            <div className="flex gap-3">
              <LogoMark className="size-7 shrink-0 rounded-lg" size={14} />
              <ThinkingIndicator startedAt={thinkingStartedAt} />
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {!atBottom && (
          <motion.button
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            aria-label="Scroll to bottom"
            onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })}
            className="glass-strong absolute bottom-3 left-1/2 grid size-9 -translate-x-1/2 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
