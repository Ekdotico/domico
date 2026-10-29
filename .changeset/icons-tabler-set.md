---
"@ekdotico/domico": patch
---

The icon set is now domico's own, built on Tabler, in place of Lucide. Every export of `@ekdotico/domico/icons` keeps its name and props; only the drawings change.

- 28 icons are Tabler outline icons, copied unchanged from `@tabler/icons`.
- `MonitorIcon`, `MoonIcon`, `PaletteIcon`, `SearchIcon`, `CircleQuestionMarkIcon`, `HighlighterIcon` and `LightbulbIcon` are Phosphor regular icons redrawn as strokes on Tabler's 24-unit grid, Phosphor's design kept.
- `QuoteIcon` is drawn after MingCute's `quote-left-line` with the heads filled.

The house stroke stays 1.5 on the 24-unit grid, one pixel at the 16px default. `scripts/icon-sources.json` records each icon's source, and `check:icons` now holds every Tabler icon to `@tabler/icons` and requires the others to name what they were drawn from. `@tabler/icons` replaces `lucide-static` as the development dependency the check reads. THIRD-PARTY-NOTICES.md carries the MIT notices for Tabler and Phosphor and the Apache 2.0 licence for MingCute. The link arrow drawn by `reset.css` is unchanged.
