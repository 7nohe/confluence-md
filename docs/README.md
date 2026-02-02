# Documentation Site

This directory contains the documentation site for confluence-md, built with [Starlight](https://starlight.astro.build/) (Astro).

## Prerequisites

- Node.js 20+
- npm

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at http://localhost:4321

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (output: `dist/`) |
| `npm run preview` | Preview production build locally |

## Directory Structure

```
docs/
├── astro.config.mjs          # Starlight configuration
├── package.json
├── tsconfig.json
├── public/
│   └── favicon.svg
└── src/
    ├── content.config.ts     # Content collection config
    └── content/
        └── docs/
            ├── index.mdx                 # English home (splash page)
            ├── getting-started/          # Getting Started section
            │   ├── installation.mdx
            │   └── quick-start.mdx
            ├── guides/                   # Guides section
            │   ├── basic-usage.mdx
            │   ├── frontmatter.mdx
            │   ├── images.mdx
            │   └── mermaid.mdx
            ├── reference/                # Reference section
            │   ├── inputs.mdx
            │   ├── outputs.mdx
            │   └── conversion-rules.mdx
            ├── development/              # Development section
            │   ├── architecture.mdx
            │   └── contributing.mdx
            └── ja/                       # Japanese translations
                └── ...                   # (same structure as above)
```

## Adding New Pages

1. Create a new `.mdx` file in the appropriate directory under `src/content/docs/`
2. Add frontmatter with at least `title` and `description`:

```mdx
---
title: My New Page
description: A brief description of this page.
---

# Content goes here
```

3. The page will automatically appear in the sidebar if using `autogenerate`

## Internationalization (i18n)

The site supports English (default) and Japanese.

### Adding translations

1. Create the same file path under `src/content/docs/ja/`
2. Translate the content while keeping the same frontmatter structure

### Sidebar translations

Sidebar labels are configured in `astro.config.mjs`:

```javascript
sidebar: [
  {
    label: 'Getting Started',
    translations: { ja: 'はじめに' },
    autogenerate: { directory: 'getting-started' },
  },
]
```

## Configuration

Main configuration is in `astro.config.mjs`:

- `title` - Site title
- `locales` - Language configuration
- `social` - Social links in header
- `sidebar` - Navigation structure

See [Starlight Configuration Reference](https://starlight.astro.build/reference/configuration/) for all options.

## Deployment

Build the site:

```bash
npm run build
```

The static output will be in the `dist/` directory, ready to deploy to any static hosting service (GitHub Pages, Netlify, Vercel, etc.).
