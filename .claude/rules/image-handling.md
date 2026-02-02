# Image Handling Rules

## Image Types

### Local Images
- Path relative to markdown file
- Uploaded as Confluence attachments
- Use `<ri:attachment ri:filename="..."/>`

### Remote Images
- Full URL (https://)
- Default: reference directly with `<ri:url ri:value="..."/>`
- With `download_remote_images`: download and upload as attachment

## Collision Handling

When multiple images have the same basename:

```
images/logo.png      → logo.png
assets/logo.png      → logo_1.png
other/logo.png       → logo_2.png
```

Tracked in `ConversionContext.images` Map.

## Path Traversal Protection

`attachmentsBase` resolves paths safely:
- Must be within allowed directory
- No `../` escape attempts
- Validates resolved path is under base

## Best Practices

1. Use unique image filenames when possible
2. Prefer local images over remote for reliability
3. Set `download_remote_images: true` for self-contained pages
