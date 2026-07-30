# The Untold Stories: Creators Mark

AI Game Master text RPG — living worlds, lasting consequences, and deep creator tools.

**Live:** https://theuntoldstories.lovable.app  
**Lovable:** https://lovable.dev/projects/f9639322-3fc5-434a-84b9-6db72b6d4554

## Local setup

```sh
npm i
npm run dev
```

Copy `.env.example` → `.env` and fill in your Supabase URL + publishable key.

Dev server defaults to http://localhost:8080 (works in Opera GX).

## Workshop / creator tooling

- `/loadout-test` and `/inventory-test` are **dev/workshop only**
- Ctrl+Shift+D diagnostics only when workshop is enabled (`npm run dev`, or `localStorage.setItem('untold-workshop','1')`)
- Explicit cheat commands (`/cheat`) remain available for Creators Mark iteration

## Stack

Vite · TypeScript · React · shadcn/ui · Tailwind · Supabase
