---
name: gfm-validation
description: Validates GitHub Flavored Markdown files for Confluence conversion compatibility. Use when checking markdown files before conversion or troubleshooting conversion issues.
allowed-tools: Read, Grep, Glob
---

# GFM Validation for Confluence Conversion

Validate markdown files to ensure they will convert properly to Confluence storage format.

## Validation Checklist

### 1. Code Fences
- All code blocks should have language tags
- `mermaid` language produces Mermaid macro
- Other languages produce code macro with syntax highlighting

### 2. Images
- Local images: relative paths from markdown file location
- Remote images: full URLs (https://)
- Avoid data: URIs (not supported)
- Check for duplicate basenames (will get `_1`, `_2` suffixes)

### 3. Tables
- Must follow GFM pipe table syntax
- Header row required
- Alignment markers supported (`:---`, `:---:`, `---:`)

### 4. Task Lists
- Use `- [ ]` and `- [x]` syntax
- Note: renders as text in Confluence (no native checkbox support)

### 5. HTML Blocks
- Will be stripped for security
- Recommend using markdown alternatives

### 6. Frontmatter
- Must have valid YAML between `---` markers
- Required field: `confluence_page_id`

## Output Format

Report issues as:
```
[WARN/ERROR] file.md:line - Description of issue
  Suggestion: How to fix
```
