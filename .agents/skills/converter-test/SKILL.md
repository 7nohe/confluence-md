---
name: converter-test
description: Tests the markdown to Confluence converter with specific inputs. Use when debugging conversion issues or verifying converter behavior.
allowed-tools: Read, Bash, Grep, Glob
---

# Converter Testing Skill

Test specific markdown inputs through the converter and analyze the output.

## Testing Approach

### Unit Test a Specific Feature
```bash
npx vitest run -t "test name pattern"
```

### Test Categories
- **XML utilities**: escaping, CDATA, element creation
- **Headings**: h1-h6 conversion
- **Formatting**: bold, italic, strikethrough, inline code
- **Lists**: ordered, unordered, nested, task lists
- **Code blocks**: language detection, mermaid handling
- **Tables**: header, body, alignment
- **Images**: local paths, remote URLs, collision handling
- **Links**: internal, external, reference-style

## Key Conversion Rules

| Markdown | Confluence Storage Format |
|----------|--------------------------|
| `# Heading` | `<h1>Heading</h1>` |
| `` `code` `` | `<code>code</code>` |
| `**bold**` | `<strong>bold</strong>` |
| Code fence | `<ac:structured-macro ac:name="code">` |
| Mermaid fence | `<ac:structured-macro ac:name="mermaid">` |
| Local image | `<ac:image><ri:attachment ri:filename="..."/></ac:image>` |
| Remote image | `<ac:image><ri:url ri:value="..."/></ac:image>` |

## Debugging Tips

1. Check `ConversionContext.images` for tracked images
2. Verify XML escaping in text content
3. Check CDATA wrapping for code blocks
