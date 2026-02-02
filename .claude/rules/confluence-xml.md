# Confluence Storage Format Rules

## XML Structure

Confluence uses XHTML-based storage format with custom namespaces:
- `ac:` - Confluence macros and structured content
- `ri:` - Resource identifiers (attachments, pages, URLs)

## Macro Patterns

### Code Block
```xml
<ac:structured-macro ac:name="code">
  <ac:parameter ac:name="language">javascript</ac:parameter>
  <ac:plain-text-body><![CDATA[code here]]></ac:plain-text-body>
</ac:structured-macro>
```

### Mermaid Diagram
```xml
<ac:structured-macro ac:name="mermaid">
  <ac:plain-text-body><![CDATA[graph LR; A-->B]]></ac:plain-text-body>
</ac:structured-macro>
```

### Local Image (Attachment)
```xml
<ac:image>
  <ri:attachment ri:filename="image.png"/>
</ac:image>
```

### Remote Image
```xml
<ac:image>
  <ri:url ri:value="https://example.com/image.png"/>
</ac:image>
```

## Escaping Rules

- Use `escapeXml()` for text content
- Use `escapeCdataContent()` for CDATA sections
- Never put raw `]]>` in CDATA - split into `]]` + `>` if needed
