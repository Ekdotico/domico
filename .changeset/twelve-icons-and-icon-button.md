---
'@ekdotico/domico': minor
---

feat: twelve icons, and an `icon` on Button and ButtonLink

`@ekdotico/domico/icons` gains twelve Tabler outline icons, copied verbatim and
recorded in `scripts/icon-sources.json`: `PilcrowIcon`, `Heading1Icon`,
`Heading2Icon`, `Heading3Icon`, `ListIcon`, `ListNumbersIcon`, `PhotoIcon`,
`CopyIcon`, `UsersIcon`, `TrashIcon`, `BellIcon` and `SettingsIcon`.

`Button` and `ButtonLink` take an optional `icon`, a domico icon component,
drawn at 16px before the label. With an icon and no children the control is
icon-only: a 32px square that takes a required `label`, which is its
`aria-label` and the text of a `Tooltip` shown on hover and on keyboard focus.
The props are a union, so an icon-only button with no `label` does not
compile; beside children, `label` is refused. `children` on `Button` and
`ButtonLink` is now a required key in the labelled shape (a button with no
children and no icon no longer type-checks). Icon-only needs
`styles/tooltip.css` as well as `styles/button.css`. No token is added.

The editor's empty-line prompt can start after a leading control: set the
optional property `--ekd-editor-placeholder-offset` on the editor (or an
ancestor) and `.ekd-editor [data-placeholder]::before` takes it as
`padding-inline-start`, so it holds in right-to-left. It is a new public
property, not a token, and unset it is `0`: nothing moves.
