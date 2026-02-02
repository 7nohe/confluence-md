# Markdown to Confluence

Convert Markdown (GFM) to Confluence Cloud storage format and update an existing page.

Available as both a **GitHub Action** and a **CLI tool**.

## Features
- GFM conversion with tables, strikethrough, task list text fallback
- Mermaid code fences to Confluence mermaid macro
- Local image uploads or external image URLs
- Skip update when content is unchanged
- Dry run mode to inspect generated storage XML

## Requirements
- Confluence Cloud site
- API token with permission to update the target page
- Mermaid macro enabled in Confluence if you use Mermaid fences

## Usage

### CLI

Install and run with npx:

```bash
# Set API token as environment variable (required)
export CONFLUENCE_API_TOKEN="your-api-token"

# Basic usage
npx confluence-md docs/page.md \
  --url https://example.atlassian.net \
  --email you@example.com

# With page ID specified
npx confluence-md docs/page.md \
  --url https://example.atlassian.net \
  --email you@example.com \
  --page-id 123456

# Dry run (preview without updating)
npx confluence-md docs/page.md --dry-run

# JSON output for scripting
npx confluence-md docs/page.md --json

# Short alias
cfmd docs/page.md --dry-run
```

#### CLI Options

```
-u, --url <url>            Confluence base URL (or CONFLUENCE_BASE_URL env)
-e, --email <email>        Confluence account email (or CONFLUENCE_EMAIL env)
-p, --page-id <id>         Confluence page ID (or use frontmatter)
--title <title>            Override page title
--attachments-base <path>  Base directory for resolving image paths
--image-mode <mode>        Image handling: upload or external (default: upload)
--download-remote-images   Download remote images as attachments
--no-skip-unchanged        Update even if content unchanged
--dry-run                  Preview without updating Confluence
--json                     Output results as JSON
-v, --verbose              Enable verbose output
-c, --config <path>        Path to config file
```

#### Config File

Create `.confluence.yml` in your project root:

```yaml
confluence_base_url: https://example.atlassian.net
email: you@example.com
frontmatter_page_id_key: confluence_page_id
image_mode: upload
skip_if_unchanged: true
```

Note: API token must be set via `CONFLUENCE_API_TOKEN` environment variable for security.

### GitHub Action

```yaml
name: Publish docs
on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./
        with:
          confluence_base_url: https://example.atlassian.net
          email: you@example.com
          api_token: ${{ secrets.CONFLUENCE_API_TOKEN }}
          source: docs/page.md
```

### Frontmatter page ID

```markdown
---
confluence_page_id: 123456
---

# Page title
```

You can also pass `page_id` directly as an input.

## GitHub Action Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| confluence_base_url | yes | - | Confluence base URL (e.g. https://example.atlassian.net) |
| page_id | no | - | Confluence page ID (fallback if frontmatter missing) |
| email | yes | - | Confluence account email |
| api_token | yes | - | Confluence API token |
| source | yes | - | Markdown file path |
| attachments_base | no | dir(source) | Base directory for resolving relative image paths |
| title_override | no | - | Override page title |
| frontmatter_page_id_key | no | confluence_page_id | Frontmatter key used to extract the page ID |
| image_mode | no | upload | Image handling mode: upload or external |
| download_remote_images | no | false | Download remote images and upload as attachments |
| skip_if_unchanged | no | true | Skip update when storage output is identical |
| dry_run | no | false | Build output but do not update Confluence |
| notify_watchers | no | false | Accepted but currently ignored |
| user_agent | no | confluence-md | HTTP user agent |

## GitHub Action Outputs

| Name | Description |
| --- | --- |
| page_url | URL of the updated Confluence page |
| page_id | ID of the updated Confluence page |
| version | New version number of the page |
| updated | Whether the page was actually updated (true or false) |
| attachments_uploaded | Number of attachments uploaded |
| content_hash | Hash of the generated storage content |

## Image handling
- Local images are resolved relative to `attachments_base`.
- Remote images use `ri:url` when `image_mode=external`.
- If `download_remote_images=true`, remote images are downloaded and uploaded as attachments.

## Limitations
- Confluence Cloud only (no Server or Data Center support).
- Updates a single page by ID; no multi-page publishing.
- Raw HTML in Markdown is stripped for safety.

## Versioning
This project follows Semantic Versioning. See `CHANGELOG.md` for release notes.

## License
MIT. See `LICENSE`.
