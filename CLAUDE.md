# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A GitHub Action and CLI tool that converts Markdown (GFM) files to Confluence Cloud storage format and updates Confluence pages. Available as both `npx confluence-md` (or `cfmd`) command and GitHub Action. Uses `@actions/http-client` for HTTP operations and `unified`/`remark` for Markdown parsing.

## Commands

```bash
# Build (bundles Action to dist/, CLI to dist/cli/)
npm run build

# Run tests
npm test

# Run single test file
npx vitest run tests/converter.test.ts

# Run tests in watch mode
npm run test:watch

# Lint & Format (Biome)
npm run check          # Check only
npm run check:fix      # Auto-fix

# Type checking
npm run typecheck

# Run all CI checks locally
npm run ci

# Test CLI locally
export CONFLUENCE_API_TOKEN="your-token"
node dist/cli/index.js docs/page.md --url https://example.atlassian.net --email you@example.com --dry-run

# Test with act (requires Docker)
act push                                                    # Full CI
act -j test-action -W .github/workflows/test-action.yml     # Test action
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for details.

## Architecture

### Entry Points
- `src/main.ts` - GitHub Action entry point
- `src/cli.ts` - CLI entry point (Commander.js)

### Execution Flow
1. **Input handling** (`src/inputs.ts`) - Reads inputs from Action or CLI, validates, normalizes base URL
2. **Frontmatter extraction** (`src/frontmatter.ts`) - Extracts YAML frontmatter using `gray-matter`, gets page ID
3. **Markdown conversion** (`src/converter/`) - Parses GFM with `remark-parse`/`remark-gfm`, converts AST to Confluence storage XML
4. **Confluence API** (`src/confluence/`) - Manages page read/update and attachment uploads
5. **Core orchestration** (`src/core.ts`) - Shared business logic for both Action and CLI

### Shared Infrastructure
- `src/logger.ts` - Logger abstraction (Actions logger vs console logger vs silent)
- `src/core.ts` - Common conversion/update logic used by both entry points

### Converter Module (`src/converter/`)
- `index.ts` - Entry point, creates `unified` processor pipeline, tracks image references
- `nodes.ts` - Recursive AST node converters (headings, lists, tables, code blocks, images, etc.)
- `xml.ts` - XML utilities: escaping, CDATA wrapping, element/macro creation

### Confluence Module (`src/confluence/`)
- `client.ts` - HTTP client wrapper with Basic auth, handles JSON and multipart requests
- `pages.ts` - Page read (v2 API) and update operations
- `attachments.ts` - Attachment upload (v1 API with multipart/form-data), image downloading

### Key Conversion Rules
- Code fences with `mermaid` language produce `<ac:structured-macro ac:name="mermaid">`
- Other code fences produce `<ac:structured-macro ac:name="code">` with language parameter
- Local images become `<ac:image><ri:attachment ri:filename="..."/></ac:image>`
- Remote images use `<ri:url ri:value="..."/>` (or download if `download_remote_images` is enabled)
- Task lists render as `[ ]`/`[x]` text (no macro support)
- HTML blocks are stripped for security

### Image Handling
- Images are tracked in `ConversionContext.images` during conversion
- Collision handling: duplicate basenames get `_1`, `_2` suffixes
- Path traversal protection in `attachmentsBase` resolution

## Testing

Tests are in `tests/` using Vitest. Main test file `converter.test.ts` covers:
- XML utilities (escaping, CDATA, element creation)
- Markdown conversion (headings, formatting, lists, code blocks, tables, images)
- Frontmatter extraction

Run a specific test by name:
```bash
npx vitest run -t "should convert h1"
```
