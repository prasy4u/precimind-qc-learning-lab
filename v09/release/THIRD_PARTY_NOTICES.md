# Third-Party Notices

This document inventories externally-sourced software components used
by PreciMind QC Learning Lab, distinguishing what is actually bundled
into the shipped application from what is used only during development
or testing.

## Runtime dependencies (bundled into the shipped production application)

| Component | Version | Source | License |
|---|---|---|---|
| react | 19.2.8 | npm (`react`) | MIT |
| react-dom | 19.2.8 | npm (`react-dom`) | MIT |

## Build-time-only tools (NOT bundled into the shipped application)

| Component | Version | Source | License |
|---|---|---|---|
| vite | 8.2.2 | npm (`vite`) | MIT |
| @vitejs/plugin-react | 6.1.1 | npm (`@vitejs/plugin-react`) | MIT |

## Development/test-only dependencies (NOT shipped in any distribution package)

| Component | Source | License |
|---|---|---|
| jsdom | npm (`jsdom`) | MIT |
| playwright-core | npm (`playwright-core`) | Apache-2.0 |

These are used only to run the automated test suite and browser-based
QA in the development environment; they are never included in the
Web, Offline, or learner-facing production distribution.

## Fonts

The application's stylesheet specifies `"IBM Plex Sans"` and
`"IBM Plex Mono"` as preferred `font-family` values, with standard
system-font fallbacks (`-apple-system`, `BlinkMacSystemFont`,
`"Segoe UI"`, `Roboto`, `Helvetica`, `Arial`, `sans-serif`, and
monospace equivalents). **No font files are bundled or fetched** — if
IBM Plex is not installed on the viewer's system, the browser silently
falls back to the listed system fonts. This is a CSS preference
declaration only, not a distributed or externally-loaded asset.

## Icons / images / illustrations

No bundled third-party icon sets, image libraries, or illustration
assets were found in the production build's asset directory for the
v0.9.0 release.

## Scientific literature references (not software dependencies)

The application displays DOI links and citations to published
scientific literature (e.g., biological-variation databases, CLSI
standards, peer-reviewed clinical-chemistry papers) as **read-only text
content** within educational panels. These are citations of scientific
sources the application's content is based on — they are not software
dependencies, are never fetched at runtime, and carry no separate
licensing/distribution implication for the application itself.

## Uncertain provenance

No component was identified during this audit with uncertain ownership
or licensing that would require flagging as
`RELEASE BLOCKER — LICENSE/PROVENANCE UNRESOLVED`.
