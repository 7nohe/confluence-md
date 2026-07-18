# Markdown to Confluence

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Confluence%20MD-blue?logo=github)](https://github.com/marketplace/actions/confluence-md)

Convert Markdown (GFM) to Confluence Cloud storage format and update an existing page.

Available as both a **GitHub Action** and a **CLI tool**.

## Features
- GFM conversion with tables, strikethrough, task list text fallback
- Mermaid code fences to Confluence mermaid macro
- Local image uploads or external image URLs
- Auto-create new pages with `space_key` (page ID written back to frontmatter)
- Skip update when content is unchanged
- Dry run mode to inspect generated storage XML
- Directory sync for multiple Markdown files

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
npx @7nohe/confluence-md docs/page.md \
  --url https://example.atlassian.net \
  --email you@example.com

# With page ID specified
npx @7nohe/confluence-md docs/page.md \
  --url https://example.atlassian.net \
  --email you@example.com \
  --page-id 123456

# Dry run (preview without updating)
npx @7nohe/confluence-md docs/page.md --dry-run

# JSON output for scripting
npx @7nohe/confluence-md docs/page.md --json

# Directory sync (page IDs must be defined in frontmatter)
npx @7nohe/confluence-md docs/ \
  --url https://example.atlassian.net \
  --email you@example.com

# Short alias
cfmd docs/page.md --dry-run
```

#### CLI Options

```
-u, --url <url>            Confluence base URL (or CONFLUENCE_BASE_URL env)
-e, --email <email>        Confluence account email (or CONFLUENCE_EMAIL env)
-p, --page-id <id>         Confluence page ID (or use frontmatter)
-s, --space-key <key>      Confluence space key (creates new page if no page_id)
--parent-page-id <id>      Parent page ID for new pages
--no-write-page-id         Disable writing created page ID back to frontmatter
--title <title>            Override page title
--attachments-base <path>  Base directory for resolving image paths
--image-mode <mode>        Image handling: upload or external (default: upload)
--download-remote-images   Download remote images as attachments
--mermaid-macro <name>     Macro name for mermaid fences (match your Confluence Mermaid app)
--exclude <patterns>       Glob patterns to exclude files (comma-separated)
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

#### Directory Sync

You can pass a directory to `source` in both CLI and GitHub Action. The tool scans the directory recursively and syncs every `*.md` file in order.

Each Markdown file must define its own page ID in frontmatter:

```markdown
---
confluence_page_id: 123456
---

# Page title
```

When `source` is a directory:

- `page_id` is ignored to prevent accidental overwrites
- Files without a frontmatter page ID are skipped, unless `space_key` is set (then a new page is created — see below)
- `attachments_base` defaults to each file's own directory when not explicitly set
- CLI `--json` returns aggregate results and per-file details

#### Auto-creating pages

If a file has no page ID and `space_key` is provided, a new page is created in that
space (under `parent_page_id` if set). By default (`write_page_id: true`), the created
page ID is written back to the file's frontmatter so subsequent runs update the same
page instead of creating duplicates. Nothing is written in dry-run mode.

```bash
npx @7nohe/confluence-md docs/ \
  --url https://example.atlassian.net \
  --email you@example.com \
  --space-key DOCS
```

Note for GitHub Actions: the frontmatter write-back modifies the file in the runner's
workspace only. Commit the change back to your repository (e.g. with a commit step or
`stefanzweifel/git-auto-commit-action`) to persist the page IDs.

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
      - uses: actions/checkout@v5
      - uses: 7nohe/confluence-md@v0.2.2
        with:
          confluence_base_url: https://example.atlassian.net
          email: you@example.com
          api_token: ${{ secrets.CONFLUENCE_API_TOKEN }}
          source: docs/
          # Optional: create pages for files without a page ID
          space_key: DOCS
```

### Frontmatter page ID

```markdown
---
confluence_page_id: 123456
title: My Confluence Page
---

# Page title
```

You can also pass `page_id` directly as an input for single-file syncs.
If frontmatter includes `title`, it is used as the Confluence page title. In single-file mode,
`title_override` still takes precedence.

## GitHub Action Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| confluence_base_url | yes | - | Confluence base URL (e.g. https://example.atlassian.net) |
| page_id | no | - | Confluence page ID (fallback if frontmatter missing in single-file mode) |
| space_key | no | - | Confluence space key (creates new page if no page ID is found) |
| parent_page_id | no | - | Parent page ID for newly created pages |
| write_page_id | no | true | Write created page ID back to the file's frontmatter |
| email | yes | - | Confluence account email |
| api_token | yes | - | Confluence API token |
| source | yes | - | Markdown file or directory path |
| attachments_base | no | dir(source) | Base directory for resolving relative image paths |
| title_override | no | - | Override page title |
| frontmatter_page_id_key | no | confluence_page_id | Frontmatter key used to extract the page ID |
| image_mode | no | upload | Image handling mode: upload or external |
| download_remote_images | no | false | Download remote images and upload as attachments |
| mermaid_macro | no | mermaid | Macro name emitted for mermaid code fences (match your Confluence Mermaid app) |
| skip_if_unchanged | no | true | Skip update when storage output is identical |
| exclude | no | - | Glob patterns to exclude files in directory mode (comma or newline separated) |
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
| created | Whether a new page was created (true or false) |
| attachments_uploaded | Number of attachments uploaded |
| content_hash | Hash of the generated storage content |
| total_files | Total number of Markdown files processed in directory mode |
| succeeded_files | Number of files processed successfully in directory mode |
| failed_files | Number of files that failed in directory mode |
| updated_files | Number of files updated in directory mode |
| attachments_uploaded_total | Total attachments uploaded in directory mode |
| results_json | JSON array of per-file results in directory mode |
| failures_json | JSON array of per-file failures in directory mode |
| skipped_files | Number of files skipped (no page ID) in directory mode |
| skipped_json | JSON array of per-file skipped entries in directory mode |

Single-file outputs (`page_url`, `page_id`, `version`, `updated`, `created`, `attachments_uploaded`, `content_hash`) are only populated for single-file runs. Directory runs use the aggregate outputs above.

## Image handling
- Local images are resolved relative to `attachments_base`.
- Remote images use `ri:url` when `image_mode=external`.
- If `download_remote_images=true`, remote images are downloaded and uploaded as attachments.
- In directory mode without `attachments_base`, local images are resolved relative to each Markdown file.

## Mermaid

Confluence Cloud has no built-in Mermaid macro, so rendering relies on a Mermaid
app installed in your site. ` ```mermaid ` code fences are converted to
`<ac:structured-macro ac:name="...">` with the diagram source as the macro body.

Because each Mermaid app uses a different macro name, set `mermaid_macro` to match
the app installed in your site (for example `mermaid-cloud`). The default is
`mermaid`. If no matching Mermaid app is installed, the diagram renders as an
unknown macro — in that case, pre-render the diagram to an image and reference it
as a normal Markdown image instead.

## Limitations
- Confluence Cloud only (no Server or Data Center support).
- Each Markdown file maps to a single Confluence page. Directory mode syncs multiple files sequentially.
- Raw HTML in Markdown is stripped for safety.
- For line breaks inside table cells, use `<br>` or `<br/>`. Literal newlines inside GFM table cells are not supported and may be parsed as separate rows.

## Versioning
This project follows Semantic Versioning. See `CHANGELOG.md` for release notes.

## License
MIT. See `LICENSE`.
