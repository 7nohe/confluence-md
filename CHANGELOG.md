# Changelog

All notable changes to this project will be documented in this file.
The format is based on Keep a Changelog, and this project adheres to
Semantic Versioning.

## [0.1.2](https://github.com/7nohe/confluence-md/compare/confluence-md-v0.1.1...confluence-md-v0.1.2) (2026-03-18)


### Features

* enable GitHub Action usage via `uses:` and prepare for Marketplace ([fcb86df](https://github.com/7nohe/confluence-md/commit/fcb86df7c824385c3d42e4c64caa7e4547dad74d))
* enable GitHub Action usage via uses: and Marketplace listing ([9026809](https://github.com/7nohe/confluence-md/commit/902680963021a76385a62b4bc22169eaa92782a3))


### Bug Fixes

* rename action to Confluence MD for unique Marketplace slug ([355e028](https://github.com/7nohe/confluence-md/commit/355e0282f1597c1ee237f382a766c96cdfe45139))

## [0.1.1](https://github.com/7nohe/confluence-md/compare/confluence-md-v0.1.0...confluence-md-v0.1.1) (2026-03-11)


### Features

* support directory-based markdown sync ([5eef13c](https://github.com/7nohe/confluence-md/commit/5eef13c7813e00abaf89cf2ee823d86484ea94f3))
* support directory-based markdown sync ([b50e272](https://github.com/7nohe/confluence-md/commit/b50e272b3ae6abc0afed72cd944203a917cf94a7))
* support frontmatter title for page sync ([76583c2](https://github.com/7nohe/confluence-md/commit/76583c248279e1887edc57089adcba175e67b8ba))
* support frontmatter title for page sync ([6643f5f](https://github.com/7nohe/confluence-md/commit/6643f5fa823362993842be74a15fd1b7dcdb6962))


### Bug Fixes

* satisfy lint checks for directory sync ([4cef1ff](https://github.com/7nohe/confluence-md/commit/4cef1ff40fb27a33cbbd1b1f62b280317c9b6fb9))

## [Unreleased]

## [0.1.0] - 2026-03-11
### Added
- Convert Markdown (GFM) to Confluence storage format.
- Support Mermaid code fences and core formatting elements.
- Upload local images and optionally download remote images.
- Skip updates when content is unchanged and support dry runs.
- CLI support: run as `npx confluence-md` or `cfmd` command.
- Config file support (`.confluence.yml`, `.confluence.yaml`, `.confluence.json`).
- JSON output mode (`--json`) for scripting integration.
- Verbose output mode (`--verbose`) for debugging.
