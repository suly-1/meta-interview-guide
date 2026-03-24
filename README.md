# Meta IC6/IC7 Interview Guide

[![Deploy to GitHub Pages](https://github.com/suly-1/meta-interview-guide/actions/workflows/create%20deploy.yml/badge.svg)](https://github.com/suly-1/meta-interview-guide/actions/workflows/create%20deploy.yml)

> **Live site:** [metaengguide.pro](https://metaengguide.pro)

A comprehensive interview preparation guide for Meta IC6/IC7 engineering roles. Covers coding interviews, AI-enabled rounds, behavioral interviews, system design, study timelines, and readiness tracking.

---

## Development

```bash
pnpm install        # Install dependencies
pnpm dev            # Start local dev server
pnpm build          # Production build
pnpm test           # Run unit tests
```

## Deployment

Every push to `main` automatically triggers a GitHub Actions build and deploys to GitHub Pages at [metaengguide.pro](https://metaengguide.pro).

To deploy manually from your local machine:

```bash
pnpm deploy:github-pages   # Build + validate + push to GitHub (triggers CI deploy)
pnpm build:standalone      # Build the static frontend only (dist/public/)
```

## Quality Gates

Every deploy runs two automated checks before the site goes live:

| Check | What it does |
|-------|-------------|
| `pnpm validate:chunks` | Static analysis — detects TDZ bundling errors in JS chunks |
| `pnpm smoke:test` | Headless Chromium — verifies React mounts and no JS errors |

If either check fails, the deploy is **blocked** and the live site stays intact.

Run them locally at any time:

```bash
pnpm validate:chunks       # Fast static check (~2s)
pnpm smoke:test            # Headless browser test (~15s)
pnpm build:verify          # Build + both checks together
pnpm smoke:test:live       # Smoke test against the live site
```

## Tech Stack

- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS 4** + **shadcn/ui**
- **Framer Motion** for animations
- **Recharts** for readiness charts
- **GitHub Pages** for hosting

## CI/CD Pipeline

```
push to main
    ↓
GitHub Actions: Build
    ↓
Validate chunks (TDZ check)
    ↓
Smoke test (headless Chromium)
    ↓
Deploy to GitHub Pages → metaengguide.pro
```
