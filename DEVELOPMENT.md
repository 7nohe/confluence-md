# Development Guide

This document explains how to develop and test confluence-md locally.

## Prerequisites

- Node.js 20+
- Docker Desktop
- [act](https://github.com/nektos/act) (for running GitHub Actions locally)

### Installing act (macOS)

```bash
brew install act
```

## Setup

```bash
# Install dependencies
npm install
```

## Development Commands

### Build

```bash
# Build both GitHub Action and CLI
npm run build

# GitHub Action only
npm run build:action

# CLI only
npm run build:cli
```

### Test

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Specific test file
npx vitest run tests/converter.test.ts

# Specific test name
npx vitest run -t "should convert h1"
```

### Lint & Format (Biome)

```bash
# Check only
npm run check

# Auto-fix
npm run check:fix

# Lint only
npm run lint
npm run lint:fix

# Format only
npm run format
npm run format:fix
```

### Type Check

```bash
npm run typecheck
```

### Run All CI Checks

```bash
# Runs Biome → TypeCheck → Test → Build sequentially
npm run ci
```

## Running GitHub Actions Locally with act

### Configuration

The `.actrc` file in the project root contains act settings:

```
--container-architecture linux/amd64
-P ubuntu-latest=catthehacker/ubuntu:act-latest
```

### List Available Workflows

```bash
act --list
```

### Run CI Workflow

```bash
# Run all jobs
act push

# Run specific job
act -j lint       # Biome check
act -j typecheck  # Type check
act -j test       # Tests
act -j build      # Build
```

### Test the Action Itself

You can verify the action works using dry-run mode (no Confluence API calls):

```bash
act -j test-action -W .github/workflows/test-action.yml
```

Test files:
- `test-fixtures/sample.md` - Sample Markdown file
- `.github/workflows/test-action.yml` - Test workflow

### Troubleshooting

#### Docker Disk Space Issues

```bash
docker system prune -af --volumes
```

#### act is Slow or Hanging

The workflow is configured without caching. If it's still slow, try restarting Docker.

#### Issues on M1/M2 Mac

The `.actrc` specifies `linux/amd64` architecture. If problems persist:

```bash
act push --container-architecture linux/amd64 -P ubuntu-latest=catthehacker/ubuntu:act-latest
```

## Project Structure

```
src/
├── main.ts           # GitHub Action entry point
├── cli.ts            # CLI entry point
├── core.ts           # Shared logic
├── inputs.ts         # Input parameter handling
├── frontmatter.ts    # YAML frontmatter parsing
├── logger.ts         # Logging abstraction
├── types.ts          # Type definitions
├── images.ts         # Image processing
├── converter/        # Markdown → Confluence conversion
│   ├── index.ts      # Conversion pipeline
│   ├── nodes.ts      # AST node converters
│   └── xml.ts        # XML utilities
└── confluence/       # Confluence API
    ├── client.ts     # HTTP client
    ├── pages.ts      # Page operations
    └── attachments.ts # Attachment operations

tests/                # Test files
test-fixtures/        # Test data
dist/                 # Build output (committed)
```

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated releases.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | Minor (0.x.0) |
| `fix` | Bug fix | Patch (0.0.x) |
| `perf` | Performance improvement | Patch |
| `docs` | Documentation only | None |
| `style` | Code style (formatting, etc.) | None |
| `refactor` | Code refactoring | None |
| `test` | Adding/updating tests | None |
| `chore` | Maintenance tasks | None |
| `ci` | CI/CD changes | None |

### Breaking Changes

For breaking changes, add `!` after the type or include `BREAKING CHANGE:` in the footer:

```bash
feat!: change API response format

# or

feat: change API response format

BREAKING CHANGE: The response format has changed from XML to JSON.
```

Breaking changes trigger a major version bump (x.0.0).

### Examples

```bash
# Feature
git commit -m "feat: add support for nested lists"

# Bug fix
git commit -m "fix: escape special characters in code blocks"

# Documentation
git commit -m "docs: update installation instructions"

# Breaking change
git commit -m "feat!: require Node.js 20+"
```

## Release Process

Releases are automated using [release-please](https://github.com/googleapis/release-please).

### How It Works

1. Push commits with Conventional Commits format to `main`/`master`
2. release-please automatically creates/updates a Release PR
3. The PR accumulates changes and updates:
   - `package.json` version
   - `CHANGELOG.md`
4. Merge the Release PR to publish:
   - GitHub Release is created
   - Version tag (e.g., `v1.2.3`) is created
   - Major version tag (e.g., `v1`) is updated

### Manual Verification (Optional)

Before merging a Release PR:

1. `npm run ci` passes
2. `act push` succeeds
3. `act -j test-action -W .github/workflows/test-action.yml` succeeds
4. Changes to `dist/` are committed
