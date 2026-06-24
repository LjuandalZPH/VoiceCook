# Agent Instructions: VoiceCook Frontend Architecture

You are an expert Senior Fullstack Engineer specializing in **Next.js 16 (App Router)**, **TypeScript**, and **Conversational UI/UX**. Your goal is to build VoiceCook: a high-performance, hands-free smart cooking assistant optimized for speed, clarity, and kitchen environments.

## 1. Core Principles & Cost Efficiency

* **Token Parsimony**: Keep code highly modular. Do not rewrite existing files unless explicitly asked. Provide clean "diffs" or specific function updates.
* **Server-First**: Prioritize React Server Components (RSC) for data fetching and static layouts. Use `'use client'` strictly for UI interactivity (voice APIs, hooks, timers, event listeners).
* **Dry-ish**: Prioritize readability and readability from afar over complex, nested abstractions.

## 2. Tech Stack Standards

* **Framework**: Next.js 16 (App Router).
* **Language**: TypeScript (Strict Mode). No `any`. Use explicit `interfaces` for Data Models.
* **Styling**: Tailwind CSS + Lucide React for iconography.
* **Validation**: Zod for all forms, incoming recipe models, and API/Server Action inputs.
* **Database/Auth**: Supabase (via `@/lib/supabaseClient`) for global sync, alongside local persistence.
* **State Management**: URL state (via `next/navigation`) for recipe browsing filters, and React Context for managing active cooking states (current step, microphone toggle, timer intervals).

## 3. Cooking & Voice Logic Rules

* **State Coupling**: The active cooking session must handle three core states: `recipe`, `currentStepIndex` (integer), and `isListening` (boolean).
* **Voice APIs**: Use native Web Speech API (`SpeechRecognition` and `SpeechSynthesis`) for local voice processing. AI fallback (conversions, substitutions) must route through secure Server Actions or API routes to hide LLM keys.
* **Local-First Persistence**: User favorites and recipe history must be saved seamlessly in `localStorage` without enforcing authentication, keeping the onboarding friction to zero.

## 4. Design & UX Standards (Futuristic Culinary Glassmorphism)

* **Aesthetic**: Futuristic Culinary / Clean Glassmorphism. Do not use heavy textures. Use Tailwind CSS for pseudo-element borders, `backdrop-blur` utilities, soft drop-shadow glows (aurora teal for tech/voice cues, warm amber for heat/cooking status), and subtle, fluid background gradients that evoke a premium kitchen experience.
* **Typography**:
* Titles (`h1`, `h2`, Recipe Titles): Playfair Display or a refined, elegant Serif font.
* Body/Data/Voice Captions: Inter or Geist Sans for maximum readability and legibility from a distance while cooking.


* **Flow**:
* **Recipe Generation / AI Prompting**: MUST use a Modal, Bottom Sheet, or Drawer. The main dashboard should remain uncluttered, triggered by a sleek `[+] Inspire New Recipe` or `[•] Start Voice Assistant` action.
* **Cooking Step Completion**: No incremental micro-buttons per ingredient. Use a single, prominent, high-contrast "Step Complete / Next" action (optimized for voice or a single clean elbow tap) that provides immediate, satisfying visual feedback.



## 5. Coding Standards

* **Server Actions**: Use for all mutations (saving recipes to db, updating server-side logs).
* **Error Handling**: Use `try/catch` in Server Actions and return a standard response object: `{ success: boolean, data?: T, error?: string }`.
* **UI Components**: Follow the Atomic Design pattern in `@/components/ui`. Use Shadcn-like design patterns for accessibility, ARIA compliance, and strict layout composability.
* **File Naming**: Kebab-case for files (e.g., `recipe-card.tsx`), PascalCase for React components.

## 6. Directory Mapping

* `app/`: Routing and Page Layouts.
* `app/page.tsx`: Main Dashboard (Catalog, History, Favorites).
* `app/recipe/[id]/page.tsx`: Detail view with ingredients checklist and "Start Cooking" hub.
* `app/recipe/[id]/cook/page.tsx`: High-contrast, single-step Focus / Voice Mode.


* `components/voice/`: Voice hooks, microphone UI triggers, text-to-speech controllers.
* `components/recipe/`: Recipe displays, ingredient checkers, timer overlays.
* `services/`: Business logic for LLMs, recipe processing, and External APIs.
* `lib/`: Shared utilities, `localStorage` wrappers, and Supabase client initializations.
* `types/`: Data definitions (`Recipe`, `Step`, `VoiceCommand`).

## 7. Development Workflow

* Before generating code, check if a similar tailwind merging utility or string parser exists in `@/lib/utils.ts`.
* When creating new routes, ensure they have a proper skeleton or fallback state (`loading.tsx`).
* Keep LLM system prompts optimized for low token usage, instructing the AI to always return short, single-sentence culinary answers for effective Text-to-Speech playback.