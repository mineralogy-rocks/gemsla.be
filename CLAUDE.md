Gemological services website for Olena Rybnikova. Single-page marketing site with contact form, blog, stone inventory, invoicing, and client reports.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS 4** (custom theme in `globals.css`)
- **Framer Motion** (animations)
- **Three.js / React Three Fiber** (3D diamond wireframe)
- **Tiptap** (rich text editor)
- **Supabase** (RESTful API, database, auth, storage)
- **Resend** (transactional email)
- **OpenAI SDK** (AI features, e.g. invoice parsing)
- **pdf-lib** (PDF generation)
- **qrcode / qrcode.react** (QR code generation)
- **Zod** (schema validation)
- **react-hot-toast** (toast notifications)
- **bun** as a package manager

## Project Structure

```
app/
├── api/                    # API routes (see API Routes section)
├── about/                  # About page
├── actions/                # Server actions
├── auth/                   # Auth callback handling
├── blog/                   # Blog list + [slug]/ detail
├── components/             # UI components
├── contact/page.tsx        # Contact form page
├── dashboard/              # Dashboard (protected)
├── error/                  # Error page
├── invoices/               # Invoice list + [id]/ detail
├── pricing/page.tsx        # Pricing tiers page
├── reports/                # Report list + [uuid]/ detail
├── stones/                 # Stone list + [id]/ detail
├── lib/animations.ts       # Framer Motion variants
├── layout.tsx              # Root layout with metadata
├── page.tsx                # Homepage
├── sitemap.ts              # Dynamic sitemap
├── manifest.ts             # PWA manifest
└── globals.css             # Theme variables + base styles
lib/
└── supabase/
    ├── admin.ts            # Admin/service-role client (server-side only)
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
Execute the necessary commands ONLY through docker container:

```bash
docker-compose -f ./main/docker-compose.yaml exec -it gems-labe bash
```

## Environment Variables

### Next.js app (Docker container)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
RESEND_API_KEY
OPENAI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Supabase Edge Functions

Supabase reserves the `SUPABASE_` prefix for its own env vars, so edge functions use different names. Set via `supabase secrets set --project-ref <ref>`.

```
SERVICE_ROLE_KEY          # same value as SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
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
- `Select` (`app/components/Select/`)
- `Checkbox` (`app/components/Checkbox/`)
- `SearchInput` (`app/components/SearchInput/`)

### Layout Components
- `Header`, `Footer`, `MobileMenu` - Navigation
- `PageHeader` - Page title with accent bar
- `CalloutCard` - Service/info cards with accent border
- `PricingCard` - Pricing tier display
- `DiamondWireframe` - 3D diamond (dynamically imported, SSR disabled)

### Data & Content Components
- `Pagination` - Page navigation
- `BulkActionBar`, `DeleteDialog`, `ConfirmDialog` - Bulk/destructive actions
- `TiptapEditor`, `TiptapContent` - Rich text editing and rendering
- `ImageGallery`, `ImageUpload`, `Lightbox` - Image management
- `QRCode` - QR code generation
- `ToastProvider` - Toast notifications (react-hot-toast)
- `IssueIndicator` - Status/issue badges
- `InvoiceDetail`, `InvoiceForms` - Invoice-specific UI

## Theme Variables

Defined in `globals.css` via CSS custom properties and Tailwind's `@theme`:

| Variable | Usage |
|----------|-------|
| `--background` | Main bg (`#fff`) |
| `--background-creme` | Alt bg (`#f5f0e8`) |
| `--foreground` | Primary text (`#000`) |
| `--foreground-muted` | Muted text (`#3d3d3d`) |
| `--text-gray` | Secondary text (`#5c5c5c`) |
| `--callout-accent` | Callout accent (`#5c5c5c`) |
| `--callout-accent-hover` | Callout hover (`#3d3d3d`) |
| `--callout-accent-light` | Callout light border (`#e6e0d6`) |
| `--callout-accent-text` | Callout text (`#3d3d3d`) |
| `--callout-bg` | Callout background (`rgba(248,244,238,0.85)`) |
| `--page-header-accent` | Gold accent (`#c4a77d`) |
| `--border` / `--border-light` | Borders (`#d4cec4` / `#e6e0d6`) |

Tailwind also exposes `--color-gold: #c4a77d` for use in utility classes.

## API Routes

### POST `/api/contact`
Accepts `{ name, email, message, chosen_service? }`. Stores in Supabase `contact_submissions` table and sends email via Resend. `chosen_service` is optional and validated against allowed service slugs.

### Blog (`/api/blog`)
- `GET/POST /api/blog` - List/create posts
- `GET/PUT/DELETE /api/blog/[id]` - Post CRUD
- `POST /api/blog/[id]/views` - Increment view count
- `GET /api/blog/tags` - List tags
- `POST /api/blog/upload` - Upload image

### Stones (`/api/stones`)
- `GET/POST /api/stones` - List/create stones
- `GET/PUT/DELETE /api/stones/[id]` - Stone CRUD
- `POST /api/stones/parse-invoice` - AI-powered invoice parsing (OpenAI)

### Invoices (`/api/invoices`)
- `GET/POST /api/invoices` - List/create invoices
- `GET/PUT/DELETE /api/invoices/[id]` - Invoice CRUD
- `POST /api/invoices/bulk-update` - Batch update
- `POST /api/invoices/bulk-delete` - Batch delete
- `POST /api/invoices/bulk-archive` - Batch archive

### Reports (`/api/reports`)
- `GET/POST /api/reports` - List/create reports
- `GET/PUT/DELETE /api/reports/[uuid]` - Report CRUD
- `POST /api/reports/[uuid]/toggle-public` - Toggle public visibility
- `POST /api/reports/upload` - Upload file
- `POST /api/reports/export-qr` - Export QR code

### Other
- `GET /api/og` - Open Graph image generation

## Conventions

- **Tabs** for indentation (size 4)
- **"use client"** only where needed (pages with interactivity)
- Keep first JSX attribute inline, stack remaining vertically
- Dynamic imports with `ssr: false` for Three.js components
- Accessibility: skip links, ARIA attributes, reduced-motion support

## Testing

- we are not using tests for this application, so skip tests
