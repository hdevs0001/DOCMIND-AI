# DocMindAI Landing Page

## Overview
Build a polished, single-page DocMindAI product site at `/` using the supplied dark SaaS direction, responsive layouts, and subtle motion. The page will remain presentation-only; upload and chat controls will demonstrate the experience without processing real files.

## Page structure
- Add a sticky translucent navigation bar with desktop links, mobile menu, login action, theme toggle, and primary CTA.
- Create the hero with the RAG badge, supplied copy, two actions, privacy note, upload drop zone, and a floating split PDF/chat product mockup.
- Add anchored sections for the three-step workflow, six product features, interactive-looking chat preview, four use cases, RAG flow explanation, five-item FAQ accordion, final CTA, and footer.
- Use smooth in-page navigation exactly as requested.

## Interaction and accessibility
- Implement a working light/dark appearance toggle with dark as the initial theme.
- Add a working mobile navigation drawer, FAQ accordion, suggested-question updates in the demo, drag-over feedback, and lightweight typing/fade/floating motion.
- Respect reduced-motion settings and include keyboard focus treatment, semantic headings, labeled controls, and descriptive icon usage.

## Visual system
- Define the requested navy, indigo/violet, and cyan palette as semantic theme tokens in the global stylesheet, with paired light-theme values.
- Load Inter and Plus Jakarta Sans, use restrained glass panels, soft ambient hero glows, generous spacing, and rounded 16–24px surfaces.
- Keep all visuals locally rendered with CSS and Lucide icons for fast loading; no fake statistics, logos, or testimonials.

## Technical details
- Keep the experience in the existing TanStack React index route and add small reusable landing-page components.
- Add Motion for React for scroll and micro-interactions.
- Add unique page metadata for search and social sharing.
- Validate the build, lint, runtime rendering, desktop layout, mobile layout, menu, theme toggle, and FAQ behavior.
