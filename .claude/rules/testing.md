# Testing Rules

## Test Organization

Tests are in `tests/` directory using Vitest:
- `converter.test.ts` - Main converter tests
- Additional test files as needed

## Running Tests

```bash
# All tests
npm test

# Single file
npx vitest run tests/converter.test.ts

# By name pattern
npx vitest run -t "should convert h1"

# Watch mode
npm run test:watch
```

## Test Categories

### XML Utilities
- `escapeXml()` - HTML entity escaping
- `escapeCdataContent()` - CDATA-safe escaping
- `element()` - XML element creation
- `macro()` - Confluence macro creation

### Markdown Conversion
- Headings (h1-h6)
- Text formatting (bold, italic, code)
- Lists (ordered, unordered, nested, task)
- Code blocks (with/without language, mermaid)
- Tables (header, body, alignment)
- Images (local, remote)
- Links (inline, reference)

### Frontmatter
- YAML parsing
- `confluence_page_id` extraction

## Writing Tests

```typescript
it('should convert feature X', () => {
  const md = '# Test';
  const result = convert(md);
  expect(result).toContain('<h1>Test</h1>');
});
```
