# Mindful PDF Chat

Build a modern, polished, fully responsive landing website for "DocMindAI", an AI-powered RAG (Retrieval-Augmented Generation) app where users upload a PDF and ask questions about it in plain English. Answers come only from the document and include page citations.

TECH

- React + Tailwind CSS (single-page, smooth scroll between sections)

- Lucide icons, Framer Motion for subtle animations

- Fonts: "Inter" for body, "Plus Jakarta Sans" or "Sora" for headings

DESIGN STYLE

- Modern SaaS look, similar to Linear, Vercel, and Notion AI

- Dark theme by default with a light/dark toggle

- Colors: deep navy/near-black background (#0B0F1A), indigo-to-violet gradient accents (#6366F1 to #8B5CF6), soft cyan highlights (#22D3EE)

- Glassmorphism cards (subtle border, blurred background), soft glowing gradient blobs behind the hero

- Rounded corners (16-24px), generous whitespace, large bold headings

- Subtle fade-up animations on scroll, hover lift on cards, gradient button glow on hover

- Mobile-first, with a hamburger menu on small screens

SECTIONS (in order)

1. NAVBAR (sticky, blurred background)

   - Left: logo (brain/document icon) + "DocMindAI"

   - Center links: Features, How it Works, Use Cases, FAQ

   - Right: "Log in" text link + "Get Started" gradient button

2. HERO

   - Small pill badge: "✨ Powered by RAG"

   - Headline: "Chat with your PDFs. Get answers instantly."

   - Subheadline: "Upload any document and ask questions in plain English. DocMindAI finds the answer and shows you exactly where it came from."

   - Buttons: "Upload a PDF" (primary gradient) and "See how it works" (outline)

   - Trust line: "No signup needed to try · Your files stay private"

   - Visual: a floating mockup of the app UI, a PDF preview on the left and a chat on the right, with a sample question "What is the refund policy?" and an answer with a citation chip "Source: Page 12". Add a gentle floating animation.

3. HOW IT WORKS

   - 3 numbered step cards connected by a line: 1. Upload (drop in your PDF), 2. Ask (type any question), 3. Get Answers (accurate responses with page references)

4. FEATURES (6-card grid with icons)

   - Accurate answers from your document

   - Source citations on every answer

   - Lightning-fast search, even in 500-page files

   - Instant summaries

   - Chat history

   - Private and secure

5. LIVE DEMO PREVIEW

   - A chat window showing a realistic Q&A conversation with a typing animation, citation chips, and suggested question buttons ("Summarize this document", "What are the key points?")

6. USE CASES

   - 4 cards: Students, Professionals, Researchers, Business Teams, each with an icon and a one-line benefit

7. HOW IT WORKS UNDER THE HOOD (short, for credibility)

   - A simple horizontal flow diagram: PDF → Chunking → Embeddings → Vector Search → LLM → Answer

   - One line explaining that RAG retrieves relevant parts of the document first, which reduces made-up answers

   - Tech stack badges: LangChain, FAISS/Chroma, FastAPI, OpenAI/Gemini

8. FAQ

   - Accordion with 5 questions: supported file types, data safety, whether it answers outside the document, scanned PDFs, accuracy

9. FINAL CTA BANNER

   - Gradient card: "Stop scrolling through pages. Start asking." with an "Upload your PDF" button

10. FOOTER

   - Logo + one-line description, link columns (Product, Resources, Legal), GitHub/LinkedIn icons, "© 2026 DocMindAI"

ALSO INCLUDE

- A drag-and-drop upload box component (non-functional UI is fine) with dashed border and hover glow

- Clean, reusable components and placeholder content that's easy to edit

- Good accessibility (contrast, focus states, alt text) and fast load

- Do not invent fake statistics, customer logos, or testimonials

Output the complete working code.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e62a7cc3-c4aa-53da-8d4c-1f7750296b78).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
