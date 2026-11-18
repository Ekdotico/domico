---
'@ekdotico/domico': minor
---

feat: twelve icons, and an `icon` on Button and ButtonLink

`@ekdotico/domico/icons` gains twelve Tabler outline icons, copied verbatim and
recorded in `scripts/icon-sources.json`: `PilcrowIcon`, `Heading1Icon`,
`Heading2Icon`, `Heading3Icon`, `ListIcon`, `ListNumbersIcon`, `PhotoIcon`,
`CopyIcon`, `UsersIcon`, `TrashIcon`, `BellIcon` and `SettingsIcon`.

`Button` and `ButtonLink` take an optional `icon`, a domico icon component,
drawn at `1em` before the label. With an icon and no children the control is
icon-only: a 20×20 box holding a 16×16 glyph, with a 24×24 pointer target (a
transparent `::after` reaching 2px past the box), that takes a required `label`, which is its
`aria-label` and the text of a `Tooltip` shown on hover and on keyboard focus.
The props are a union, so an icon-only button with no `label` does not
compile; beside children, `label` is refused. `children` on `Button` and
`ButtonLink` is now a required key in the labelled shape (a button with no
children and no icon no longer type-checks). Icon-only needs
`styles/tooltip.css` as well as `styles/button.css`. No token is added.

**Icon size rule, which changes a shipped default.** An icon with no `size` is
now `1em`, the font size of where it sits, where it was a fixed 16px. At 16px
text nothing moves; in 15px (`--fs-base`) text it is 15px and in 13px
(`--fs-sm`) text it is 13px, so every unsized icon in an application (a
callout's, a select's or menu's chevron, the sync mark, a toolbar's) follows
its context. Pass `size` to keep a fixed pixel size; the package's own dialog
and drawer icons do.

The editor's empty-line prompt can start after a leading control: set the
optional property `--ekd-editor-placeholder-offset` on the editor (or an
ancestor) and `.ekd-editor [data-placeholder]::before` takes it as
`padding-inline-start`, so it holds in right-to-left. It is a new public
property, not a token, and unset it is `0`: nothing moves.

Controls that belong to one block can rest faint: put `data-dim-at-rest` on the
container, and set `data-active` on it while the caret is in that block. Inside
it the secondary, quiet and destructive Button and ButtonLink, the MenuButton
trigger and the code block header rest in `--fg-3` (a colour change, not
opacity) and return on the container's `:hover` and `:focus-within`, and under
`data-active`. Always full strength under `hover: none`, `prefers-contrast:
more` and forced colours; the fade is `--dur-fast` and drops under reduced
motion. No token is added.
