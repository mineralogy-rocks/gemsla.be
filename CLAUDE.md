Gemological services website for Olena Rybnikova. Single-page marketing site with contact form.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS 4** (custom theme in `globals.css`)
- **Framer Motion** (animations)
- **Three.js / React Three Fiber** (3D diamond wireframe)
- **Supabase** (contact form storage)
- **Resend** (transactional email)

## Project Structure

```
app/
├── api/contact/route.ts    # POST endpoint for contact form
├── components/             # UI components
├── contact/page.tsx        # Contact form page
├── pricing/page.tsx        # Pricing tiers page
├── lib/animations.ts       # Framer Motion variants
├── layout.tsx              # Root layout with metadata
├── page.tsx                # Homepage
└── globals.css             # Theme variables + base styles
lib/
└── supabase/
    ├── client.ts           # Browser client
    └── server.ts           # Server client (cookies)
```

## Development

```bash
cd ../main && docker-compose up -d gems-labe
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

## Debugging

- we are running Next.js in docker container using docker-compose from `main` folder, so you can use `cd ../main && docker-compose exec -it gems-labe bash` to get into container
