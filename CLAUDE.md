Gemological services website for Olena Rybnikova. Single-page marketing site with contact form.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS 4** (custom theme in `globals.css`)
- **Framer Motion** (animations)
- **Three.js / React Three Fiber** (3D diamond wireframe)
- **Supabase** (RESTful API, database, auth, storage)
- **Resend** (transactional email)

## Project Structure

```
app/
├── api/contact/route.ts    # POST endpoint for contact form
├── about/                  # About page
├── actions/                # Server actions
├── auth/                   # Auth callback handling
├── components/             # UI components
├── contact/page.tsx        # Contact form page
├── dashboard/              # Dashboard (protected)
├── error/                  # Error page
├── lib/animations.ts       # Framer Motion variants
├── pricing/page.tsx        # Pricing tiers page
├── sign-in/                # Sign-in page
├── layout.tsx              # Root layout with metadata
├── page.tsx                # Homepage
├── sitemap.ts              # Dynamic sitemap
├── manifest.ts             # PWA manifest
└── globals.css             # Theme variables + base styles
lib/
└── supabase/
    ├── client.ts           # Browser client
    ├── middleware.ts       # Auth middleware helpers
    └── server.ts           # Server client (cookies)
supabase/
├── config.toml             # Supabase local config
├── migrations/             # Database migrations
├── seed.sql                # Database seed data
└── snippets/               # SQL snippets
middleware.ts               # Next.js middleware (auth)
```

## Supabase

The `supabase/` folder contains Supabase CLI configuration for local development and migrations.

- **config.toml** - Local Supabase configuration
- **migrations/** - Database schema migrations
- **seed.sql** - Seed data for development

## Local Development and debugging

Assume that docker container is already running when you work on any task.
Execute all commands ONLY through docker container:

```bash
docker-compose -f ./main/docker-compose.yaml exec -it gems-labe bash
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
RESEND_API_KEY
```

## Component Patterns

### Animation Variants
Import from `app/lib/animations.ts`:
- `fadeInUp`, `fadeInLeft`, `scaleIn` - Element animations
- `staggerContainer`, `staggerItem` - Container/child stagger
- `paragraphReveal`, `calloutReveal` - Content reveal

### Button Components
- `Button` (`app/components/Button/`) - Standard button with loading state
- `Button3D` (`app/components/Button3D.tsx`) - 3D effect button for CTAs

### Form Components
- `Input` (`app/components/Input/`)
- `TextArea` (`app/components/TextArea/`)

### Layout Components
- `CalloutCard` - Service/info cards with accent border
- `PricingCard` - Pricing tier display
- `DiamondWireframe` - 3D diamond (dynamically imported, SSR disabled)

## Theme Variables

Defined in `globals.css` via CSS custom properties and Tailwind's `@theme`:

| Variable | Usage |
|----------|-------|
| `--background` | Main bg (`#fff`) |
| `--background-creme` | Alt bg (`#f5f0e8`) |
| `--foreground` | Primary text (`#000`) |
| `--text-gray` | Muted text (`#5c5c5c`) |
| `--callout-accent` | Accent gold (`#c4a77d`) |
| `--border` / `--border-light` | Borders |

## API Routes

### POST `/api/contact`
Accepts `{ name, email, message }`. Stores in Supabase `contact_submissions` table and sends email via Resend.

## Conventions

- **Tabs** for indentation (size 4)
- **"use client"** only where needed (pages with interactivity)
- Keep first JSX attribute inline, stack remaining vertically
- Dynamic imports with `ssr: false` for Three.js components
- Accessibility: skip links, ARIA attributes, reduced-motion support

## Testing

- we are not using tests for this application, so skip tests
