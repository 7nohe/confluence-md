# Contributing

Thanks for helping improve confluence-md.

## Prerequisites
- Node.js 20+
- npm

## Setup
```bash
npm install
```

## Development
```bash
npm run test
npm run check
npm run typecheck
npm run build
```

## Notes
- This repository commits `dist/` outputs because GitHub Actions run from the bundled file.
- When you change `src/`, run `npm run build` to refresh `dist/`.
- Please include or update tests when changing conversion logic.

## Reporting issues
Include steps to reproduce, expected behavior, and logs when possible.
