"use client";

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import Lenis from "lenis";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileSearch,
  FileText,
  Github,
  GraduationCap,
  History,
  Linkedin,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Moon,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

const navLinks = [
  ["Features", "#features"],
  ["How it works", "#how-it-works"],
  ["Use cases", "#use-cases"],
  ["FAQ", "#faq"],
] as const;

const featureItems = [
  {
    icon: FileCheck2,
    title: "Grounded answers",
    text: "Every response is based on the document you provide—nothing else.",
  },
  {
    icon: BookOpen,
    title: "Page-level citations",
    text: "Jump straight to the source passage behind every answer.",
  },
  {
    icon: Zap,
    title: "Long-document search",
    text: "Find the right context quickly, even across 500-page files.",
  },
  {
    icon: Sparkles,
    title: "Instant summaries",
    text: "Turn dense documents into clear, useful overviews in seconds.",
  },
  {
    icon: History,
    title: "Conversation history",
    text: "Keep your questions and answers together while you explore.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    text: "Your documents remain private and under your control.",
  },
] as const;

const useCases = [
  {
    icon: GraduationCap,
    title: "Students",
    text: "Study papers, textbooks, and lecture notes without losing your place.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Professionals",
    text: "Extract decisions and details from contracts, reports, and policies.",
  },
  {
    icon: Search,
    title: "Researchers",
    text: "Trace every insight back to the exact supporting page.",
  },
  {
    icon: Users,
    title: "Business teams",
    text: "Give everyone a faster way to understand shared knowledge.",
  },
] as const;

const faqs = [
  [
    "What file types are supported?",
    "DocMindAI is designed for PDF documents. Support for more document formats can be added as the product grows.",
  ],
  [
    "Is my data safe?",
    "Your files stay private and are used only to answer your questions. The interface is designed around secure, document-scoped sessions.",
  ],
  [
    "Will it answer questions outside my document?",
    "No. DocMindAI is designed to answer from the uploaded document and cite the pages it used. If the answer is not there, it tells you.",
  ],
  [
    "Does it work with scanned PDFs?",
    "Scanned PDFs need readable text recognition. Clear scans work best; low-resolution or handwritten pages may need OCR first.",
  ],
  [
    "How accurate are the answers?",
    "Accuracy depends on the quality and clarity of the source document. Citations make every answer easy to verify against the original page.",
  ],
] as const;

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href="#top"
      className="group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="DocMindAI home"
    >
      <span className="logo-mark" aria-hidden="true">
        <FileText />
        <BrainCircuit />
      </span>
      {!compact && (
        <span className="font-heading text-base font-bold text-foreground">
          DocMind<span className="text-gradient">AI</span>
        </span>
      )}
    </a>
  );
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={onToggle}
      aria-label={dark ? "Use light theme" : "Use dark theme"}
      aria-pressed={!dark}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("docmind-theme");
    const nextDark = savedTheme !== "light";
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.style.colorScheme = nextDark ? "dark" : "light";
  }, []);

  const toggleTheme = () => {
    setDark((current) => {
      const nextDark = !current;
      document.documentElement.classList.toggle("dark", nextDark);
      document.documentElement.style.colorScheme = nextDark ? "dark" : "light";
      window.localStorage.setItem("docmind-theme", nextDark ? "dark" : "light");
      return nextDark;
    });
  };

  return (
    <header className="site-header">
      <div className="page-shell flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {navLinks.map(([label, href]) => (
            <a key={href} href={href} className="nav-link">
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle dark={dark} onToggle={toggleTheme} />
          <a href="#demo" className="nav-link px-2">
            Log in
          </a>
          <Link to="/chat">
            <Button asChild variant="brand" size="sm">
              <a href="#upload">
                Get started <ArrowRight />
              </a>
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle dark={dark} onToggle={toggleTheme} />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav md:hidden" aria-label="Mobile navigation">
          {navLinks.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
              <ChevronRight />
            </a>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" asChild>
              <a href="#demo">Log in</a>
            </Button>
            <Button variant="brand" asChild>
              <a href="#upload">Get started</a>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function UploadBox() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    setFileName(event.dataTransfer.files[0]?.name ?? "");
  };
  return (
    <div
      id="upload"
      className={cn("upload-box", dragging && "is-dragging")}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      role="button"
      tabIndex={0}
      aria-label="Choose or drop a PDF file"
    >
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="application/pdf"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
      />
      <span className="upload-icon">
        <Upload />
      </span>
      <span className="font-heading font-semibold text-foreground">
        {fileName || "Drop your PDF here"}
      </span>
      <span className="text-xs text-muted-foreground">
        {fileName ? "Ready for your questions" : "or click to browse · PDF only"}
      </span>
    </div>
  );
}

function ProductMockup() {
  return (
    <motion.div
      className="product-window"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="window-bar">
        <span className="window-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="text-xs text-muted-foreground">employee-handbook.pdf</span>
        <span className="text-xs text-success">
          <Check /> Ready
        </span>
      </div>
      <div className="mockup-grid">
        <div className="pdf-pane">
          <div className="mb-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs font-semibold">
              <FileText className="size-4 text-destructive" />
              Employee handbook
            </span>
            <span className="text-xs text-muted-foreground">12 / 48</span>
          </div>
          <h3>Returns &amp; refunds</h3>
          <div className="doc-line w-11/12" />
          <div className="doc-line w-full" />
          <div className="doc-line w-10/12" />
          <div className="citation-highlight">
            <span>Refund requests must be submitted within 30 days of purchase.</span>
          </div>
          <div className="doc-line w-full" />
          <div className="doc-line w-8/12" />
        </div>
        <div className="chat-pane">
          <div className="chat-heading">
            <span className="avatar-small">
              <BrainCircuit />
            </span>
            <div>
              <strong>DocMind</strong>
              <span>Grounded in your PDF</span>
            </div>
          </div>
          <div className="mt-auto space-y-4">
            <div className="user-bubble">What is the refund policy?</div>
            <div className="assistant-row">
              <span className="avatar-tiny">
                <BrainCircuit />
              </span>
              <div>
                <p>
                  Refund requests are accepted within <strong>30 days of purchase</strong>, provided
                  the request follows the process in the handbook.
                </p>
                <span className="citation-chip">
                  <BookOpen /> Source: Page 12
                </span>
              </div>
            </div>
          </div>
          <div className="mock-input">
            <span>Ask a follow-up...</span>
            <Send />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}

function Hero() {
  return (
    <main id="top">
      <section className="hero-section">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="page-shell relative z-10 grid items-center gap-14 pb-24 pt-20 lg:grid-cols-[.86fr_1.14fr] lg:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="hero-badge">
              <Sparkles /> Powered by RAG
            </span>
            <h1 className="mt-7">
              Chat with your PDFs. <span className="text-gradient">Get answers instantly.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Upload any document and ask questions in plain English. DocMindAI finds the answer and
              shows you exactly where it came from.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="brand" size="xl">
                <a href="#upload">
                  <Upload />
                  Upload a PDF
                </a>
              </Button>
              <Button asChild variant="glass" size="xl">
                <a href="#how-it-works">
                  See how it works
                  <ArrowRight />
                </a>
              </Button>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <LockKeyhole className="size-4 text-cyan" />
              No signup needed to try <span aria-hidden="true">·</span> Your files stay private
            </p>
            <div className="mt-8 max-w-md">
              <UploadBox />
            </div>
          </motion.div>
          <div className="relative lg:-mr-14">
            <ProductMockup />
          </div>
        </div>
      </section>
    </main>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: "Upload",
      text: "Drop in your PDF. We prepare it for fast, accurate retrieval.",
    },
    {
      icon: MessageSquareText,
      title: "Ask",
      text: "Type any question using the words you would normally use.",
    },
    {
      icon: FileSearch,
      title: "Get answers",
      text: "Receive a clear response with exact page references.",
    },
  ];
  return (
    <section id="how-it-works" className="section-band">
      <div className="page-shell">
        <Reveal>
          <SectionHeading eyebrow="Three simple steps" title="From document to answer in moments" />
        </Reveal>
        <div className="steps-grid">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} className="step-wrap">
              <article className="glass-card step-card">
                <span className="step-number">0{i + 1}</span>
                <span className="feature-icon">
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="section-band section-muted">
      <div className="page-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Built for trustworthy answers"
            title="Everything you need to understand any PDF"
            body="A focused reading workspace that helps you find, verify, and remember what matters."
          />
        </Reveal>
        <div className="feature-grid">
          {featureItems.map(({ icon: Icon, title, text }) => (
            <Reveal key={title}>
              <article className="glass-card feature-card">
                <span className="feature-icon">
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const demoReplies: Record<string, string> = {
  "Summarize this document":
    "This employee handbook outlines workplace expectations, benefits, leave, expense policies, and the 30-day refund procedure for approved purchases.",
  "What are the key points?":
    "Key points include a 30-day refund window, manager approval for expenses, flexible leave guidelines, and documented security responsibilities.",
};

function Demo() {
  const [question, setQuestion] = useState("What is the refund policy?");
  const [answer, setAnswer] = useState(
    "Refund requests must be submitted within 30 days of purchase. Requests should include the original receipt and follow the approval process outlined in the handbook.",
  );
  const [typing, setTyping] = useState(false);
  const ask = (next: string) => {
    setQuestion(next);
    setTyping(true);
    window.setTimeout(() => {
      setAnswer(demoReplies[next] ?? "I couldn't find that answer in this document.");
      setTyping(false);
    }, 900);
  };
  return (
    <section id="demo" className="section-band">
      <div className="page-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Live preview"
            title="Ask naturally. Verify instantly."
            body="Try a suggested question to see how document-grounded answers stay connected to their source."
          />
        </Reveal>
        <Reveal className="demo-shell">
          <div className="demo-sidebar">
            <div className="flex items-center gap-3">
              <span className="pdf-icon">
                <FileText />
              </span>
              <div>
                <strong>employee-handbook.pdf</strong>
                <span>48 pages · Ready</span>
              </div>
            </div>
            <div className="mt-8">
              <span className="sidebar-label">In this document</span>
              {["Overview", "Workplace policies", "Benefits & leave", "Returns & refunds"].map(
                (item, i) => (
                  <div key={item} className={cn("outline-row", i === 3 && "active")}>
                    {item}
                    <span>{i === 3 ? "12" : i * 4 + 2}</span>
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="demo-chat">
            <div className="demo-top">
              <div className="chat-heading">
                <span className="avatar-small">
                  <BrainCircuit />
                </span>
                <div>
                  <strong>Ask DocMind</strong>
                  <span>Answers use this PDF only</span>
                </div>
              </div>
              <span className="status-dot">Ready</span>
            </div>
            <div className="demo-messages" aria-live="polite">
              <Message from="user">
                <MessageContent>{question}</MessageContent>
              </Message>
              <Message from="assistant">
                <div className="flex items-start gap-3">
                  <span className="avatar-tiny mt-1">
                    <BrainCircuit />
                  </span>
                  <MessageContent>
                    {typing ? (
                      <Shimmer className="text-muted-foreground">
                        Searching your document...
                      </Shimmer>
                    ) : (
                      <>
                        <MessageResponse>{answer}</MessageResponse>
                        <span className="citation-chip mt-3">
                          <BookOpen /> Source: Page 12
                        </span>
                      </>
                    )}
                  </MessageContent>
                </div>
              </Message>
            </div>
            <div className="suggestions">
              <span>Try asking</span>
              <div>
                {Object.keys(demoReplies).map((item) => (
                  <Button
                    key={item}
                    variant="suggestion"
                    size="sm"
                    onClick={() => ask(item)}
                    disabled={typing}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
            <div className="demo-input">
              <span>Ask anything about this document...</span>
              <Button variant="brand" size="icon" aria-label="Send question">
                <Send />
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section id="use-cases" className="section-band section-muted">
      <div className="page-shell">
        <Reveal>
          <SectionHeading
            eyebrow="For every kind of reader"
            title="Spend less time searching. More time thinking."
          />
        </Reveal>
        <div className="use-grid">
          {useCases.map(({ icon: Icon, title, text }) => (
            <Reveal key={title}>
              <article className="glass-card use-card">
                <span className="use-icon">
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="learn-link">
                  Explore the possibilities <ArrowRight />
                </span>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function UnderTheHood() {
  const flow = [
    [FileText, "PDF"],
    [FileSearch, "Chunking"],
    [Sparkles, "Embeddings"],
    [Search, "Vector search"],
    [BrainCircuit, "LLM"],
    [MessageSquareText, "Answer"],
  ] as const;
  return (
    <section className="section-band">
      <div className="page-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Under the hood"
            title="Context first. Answer second."
            body="RAG retrieves the most relevant parts of your document before generating an answer, reducing made-up responses."
          />
        </Reveal>
        <Reveal className="flow-card">
          <div className="flow-row">
            {flow.map(([Icon, label], i) => (
              <div key={label} className="contents">
                <div className="flow-node">
                  <Icon />
                  <span>{label}</span>
                </div>
                {i < flow.length - 1 && <ArrowRight className="flow-arrow" />}
              </div>
            ))}
          </div>
          <div className="stack-row">
            {["LangChain", "FAISS / Chroma", "FastAPI", "OpenAI / Gemini"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="section-band section-muted">
      <div className="page-shell faq-layout">
        <Reveal>
          <SectionHeading
            eyebrow="Questions, answered"
            title="Everything you need to know"
            body="A few details about how DocMindAI handles your documents and answers."
          />
        </Reveal>
        <Reveal>
          <Accordion type="single" collapsible defaultValue="item-0" className="faq-list">
            {faqs.map(([q, a], i) => (
              <AccordionItem value={`item-${i}`} key={q} className="faq-item">
                <AccordionTrigger className="text-base hover:no-underline">{q}</AccordionTrigger>
                <AccordionContent className="pr-8 leading-7 text-muted-foreground">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-4 py-20">
      <Reveal className="cta-banner">
        <div>
          <span className="eyebrow eyebrow-light">Your document already has the answer</span>
          <h2>
            Stop scrolling through pages.
            <br />
            Start asking.
          </h2>
          <p>Upload a PDF and turn it into a conversation.</p>
        </div>
        <Button asChild variant="cta" size="xl">
          <a href="#upload">
            <Upload />
            Upload your PDF
          </a>
        </Button>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="page-shell">
        <div className="footer-main">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Clear answers from your documents, backed by the pages they came from.
            </p>
          </div>
          {[
            ["Product", "Features", "How it works", "Use cases"],
            ["Resources", "Documentation", "Privacy guide", "Help center"],
            ["Legal", "Privacy", "Terms", "Security"],
          ].map(([title, ...links]) => (
            <div key={title}>
              <h3>{title}</h3>
              {links.map((link) => (
                <a key={link} href="#top">
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 DocMindAI. Built for better reading.</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" aria-label="DocMindAI on GitHub">
              <Github />
            </Button>
            <Button variant="ghost" size="icon" aria-label="DocMindAI on LinkedIn">
              <Linkedin />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function DocMindLanding() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      anchors: { offset: -64 },
      duration: 1.05,
      smoothWheel: true,
    });

    return () => lenis.destroy();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Header />
      <Hero />
      <HowItWorks />
      <Features />
      <Demo />
      <UseCases />
      <UnderTheHood />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
