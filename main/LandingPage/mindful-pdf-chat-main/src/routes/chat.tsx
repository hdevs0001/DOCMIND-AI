import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { FileUp } from "lucide-react";
import { askDocument } from "@/lib/askDocument";
import { Sidebar } from "@/components/chat/Sidebar";
import { TopBar } from "@/components/chat/TopBar";
import { Greeting, Suggestions } from "@/components/chat/EmptyState";
import { PromptBox } from "@/components/chat/PromptBox";
import { MessageList } from "@/components/chat/MessageList";
import { PdfPreviewPanel } from "@/components/chat/PdfPreviewPanel";
import type { ChatMessage, ChatSummary } from "@/components/chat/types";
import { createChat, deleteChat, listChats, renameChat, toggleChatPin } from "@/lib/chat.functions";
import { uploadDocument } from "@/lib/document.functions";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat with your PDF — DocMindAI" },
      { name: "description", content: "Upload a PDF and get cited answers drawn only from your document." },
      { property: "og:title", content: "Chat with your PDF — DocMindAI" },
      { property: "og:description", content: "Upload a PDF and get cited answers drawn only from your document." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatRoom,
});



const spring = { type: "spring" as const, stiffness: 260, damping: 32, mass: 0.9 };
const uid = () => Math.random().toString(36).slice(2, 10);

function ChatRoom() {
  const [dark, setDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingStartedAt, setThinkingStartedAt] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [previewPage, setPreviewPage] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    let cancelled = false;

    listChats()
      .then((items) => {
        if (!cancelled) {
          setChats(items);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const inChat = messages.length > 0;
  const busy = isThinking || isStreaming;
  const chatTitle = chats.find((c) => c.id === activeChatId)?.title ?? "New chat";

  const handleFile = async (f: File | null) => {
    setFileError(null);
    setUploaded(false);

    if (!f) {
      setAttachedFile(null);
      setDocFile(null);
      return;
    }

    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Only PDF files are supported.");
      return;
    }

    if (f.size === 0) {
      setFileError("Couldn't read this PDF.");
      return;
    }

    setAttachedFile(f);
    setDocFile(f);
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", f);

      await uploadDocument({ data: form });
      setUploaded(true);
    } catch (error) {
      setFileError((error as Error).message || "Couldn't upload this PDF.");
      setAttachedFile(null);
      setDocFile(null);
    } finally {
      setUploading(false);
    }
  };

  const run = useCallback(async (question: string, file: File | null) => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const started = Date.now();
    setThinkingStartedAt(started);
    setIsThinking(true);
    const id = uid();
    try {
      const res = await askDocument(question, file, ctrl.signal);
      const duration = (Date.now() - started) / 1000;
      setIsThinking(false);
      setIsStreaming(true);
      setMessages((m) => [...m, { id, role: "assistant", content: "", citations: res.citations, reasoning: res.reasoning, thinkingDuration: duration, streaming: true }]);
      const words = res.answer.split(/(\s+)/);
      let i = 0;
      streamTimer.current = setInterval(() => {
        i += 2;
        const done = i >= words.length;
        setMessages((m) => m.map((x) => (x.id === id && x.role === "assistant" ? { ...x, content: words.slice(0, i).join(""), streaming: !done } : x)));
        if (done) {
          clearInterval(streamTimer.current!);
          setIsStreaming(false);
        }
      }, 35);
    } catch (e) {
      setIsThinking(false);
      if ((e as Error).name === "AbortError") return;
      setMessages((m) => [...m, { id, role: "assistant", content: "", citations: [], reasoning: [], thinkingDuration: 0, error: (e as Error).message || "Couldn't read this PDF" }]);
    }
  }, []);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy || uploading) return;

    const file = attachedFile ?? docFile;

    setMessages((m) => [
      ...m,
      {
        id: uid(),
        role: "user",
        content: q,
        attachment: attachedFile ? { name: attachedFile.name, size: attachedFile.size } : undefined,
      },
    ]);

    if (!activeChatId) {
      try {
        const created = await createChat({
          data: { title: q.length > 48 ? q.slice(0, 48) + "…" : q },
        });
        setChats((items) => [created, ...items]);
        setActiveChatId(created.id);
      } catch (error) {
        setFileError((error as Error).message || "Couldn't create the chat.");
        return;
      }
    }

    setInput("");
    setAttachedFile(null);
    void run(q, file);
  };

  const stop = () => {
    abortRef.current?.abort();
    if (streamTimer.current) clearInterval(streamTimer.current);
    setIsThinking(false);
    setIsStreaming(false);
    setMessages((m) => m.map((x) => (x.role === "assistant" && x.streaming ? { ...x, streaming: false } : x)));
  };

  const regenerate = () => {
    if (busy) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((m) => (m[m.length - 1]?.role === "assistant" ? m.slice(0, -1) : m));
    run(lastUser.content, docFile);
  };

  const newChat = () => {
    stop();
    setMessages([]);
    setActiveChatId(null);
    setDocFile(null);
    setAttachedFile(null);
    setUploaded(false);
    setMobileOpen(false);
  };

  const handleRename = async (id: string, title: string) => {
    const updated = await renameChat({ data: { id, title } });
    setChats((items) => items.map((chat) => (chat.id === id ? updated : chat)));
  };

  const handleTogglePin = async (id: string) => {
    const updated = await toggleChatPin({ data: { id } });
    setChats((items) => items.map((chat) => (chat.id === id ? updated : chat)));
  };

  const handleDelete = async (id: string) => {
    await deleteChat({ data: { id } });
    setChats((items) => items.filter((chat) => chat.id !== id));
    if (id === activeChatId) newChat();
  };

  return (
    <div
      className="relative flex h-dvh w-full overflow-hidden bg-background"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0] ?? null); }}
    >
      <Sidebar
        open={sidebarOpen}
        mobileOpen={mobileOpen}
        onClose={() => setSidebarOpen(false)}
        onCloseMobile={() => setMobileOpen(false)}
        chats={chats}
        activeChatId={activeChatId}
        onSelect={(id) => { stop(); setActiveChatId(id); setMessages([]); setMobileOpen(false); }}
        onNewChat={newChat}
        onRename={handleRename}
        onTogglePin={(id) => void handleTogglePin(id)}
        onDelete={(id) => void handleDelete(id)}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <AnimatePresence>
          {!inChat && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              aria-hidden
              className="blob pointer-events-none absolute left-1/2 top-[38%] size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            />
          )}
        </AnimatePresence>

        <TopBar
          inChat={inChat}
          title={chatTitle}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenMobile={() => setMobileOpen(true)}
          dark={dark}
          onToggleTheme={() => setDark((d) => !d)}
        />

        <LayoutGroup>
          {inChat ? (
            <MessageList
              messages={messages}
              isThinking={isThinking}
              thinkingStartedAt={thinkingStartedAt}
              onRegenerate={regenerate}
              onCitation={setPreviewPage}
            />
          ) : (
            <div className="flex-1" />
          )}

          <motion.div layout transition={spring} className={`relative z-10 mx-auto w-full px-4 ${inChat ? "max-w-3xl pb-3" : "max-w-2xl"}`}>
            <AnimatePresence>{!inChat && <Greeting key="greet" />}</AnimatePresence>
            <motion.div layoutId="prompt-box" transition={spring}>
              <PromptBox
                value={input}
                onChange={setInput}
                onSubmit={() => send()}
                onStop={stop}
                busy={busy}
                file={attachedFile}
                onFile={(file) => void handleFile(file)}
                fileError={fileError}
                uploading={uploading}
                uploaded={uploaded}
              />
            </motion.div>
            <AnimatePresence>{!inChat && <Suggestions key="sugg" onPick={(s) => send(s)} />}</AnimatePresence>
            {inChat && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-2 text-center text-xs text-muted-foreground">
                DocMindAI answers only from your document. Please verify important information.
              </motion.p>
            )}
          </motion.div>

          {!inChat && <div className="flex-[1.3]" />}
        </LayoutGroup>
      </main>

      <PdfPreviewPanel page={previewPage} fileName={docFile?.name ?? "Document.pdf"} onClose={() => setPreviewPage(null)} />

      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[60] grid place-items-center bg-background/70 p-6 backdrop-blur-md"
          >
            <div className="flex w-full max-w-lg flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-primary/70 p-12 text-center shadow-glow">
              <FileUp size={36} className="text-cyan" />
              <p className="font-display text-lg font-semibold">Drop your PDF here</p>
              <p className="text-sm text-muted-foreground">Only .pdf files are supported</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}