# Vidit Jain — Academic Portfolio

Static portfolio site for [viditjain.me](https://viditjain.me), highlighting research in quantum computing, machine learning, and reliable systems alongside selected projects.

The site is intentionally dependency-free so it can be deployed directly with GitHub Pages. The clean page routes are `/`, `/research/`, `/projects/`, and `/about/`; update the corresponding directory `index.html` files as new papers, project images, and results become available.

The homepage is a minimal introduction with animated canvas backgrounds. Research and projects use a sticky contents index, sticky case-study headings, and always-visible methods, results, and limitations. All content remains readable without JavaScript. The dark palette, typography, navigation, and canvas vocabulary are shared across all four pages.

Motion includes native cross-document view transitions (where supported), one-time scroll reveals, diagram tracing, and canvas artwork adapted from two @designali-in components retrieved through the 21st.dev MCP. See [visual credits](THIRD_PARTY_NOTICES.md). Motion runs continuously as part of the visual system; canvas animation pauses offscreen and in background tabs, caps at 30fps, and uses a maximum device-pixel ratio of 2.

Preview locally with `python -m http.server 4173`. No install/build step or runtime API key is required. Push to the configured GitHub Pages branch to publish; the shared assets use a version query to avoid stale caches.

Backup before this redesign: `backup/pre-21st-redesign-20260918`.
