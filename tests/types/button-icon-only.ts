// Type test, run by `tsc -p tsconfig.json --noEmit` (part of `pnpm check`) and
// not part of the build. An `@ts-expect-error` that stops erroring is itself an
// error, so this fails if an icon-only button ever stops needing its name.
import { Button, ButtonLink } from '../../src/components/Button.js';
import { TrashIcon } from '../../src/components/icons.js';

// The forms that must compile.
export const iconOnly = Button({ icon: TrashIcon, label: 'Delete document' });
export const labelled = Button({ icon: TrashIcon, children: 'Delete document' });
export const plain = Button({ children: 'Save' });
export const link = ButtonLink({ href: '/x', icon: TrashIcon, label: 'Delete document' });

// `edge` is for the quiet variant alone.
export const edgeStart = Button({ variant: 'quiet', edge: 'start', children: 'Rename' });
export const edgeEnd = ButtonLink({ href: '/x', variant: 'quiet', edge: 'end', children: 'Open' });

// @ts-expect-error — a secondary button has no edge to give up.
export const edgeOnSecondary = Button({ edge: 'start', children: 'Save' });

// @ts-expect-error — nor does a primary one.
export const edgeOnPrimary = Button({ variant: 'primary', edge: 'end', children: 'Save' });

// @ts-expect-error — an icon and no children needs a `label`: the button has no name otherwise.
export const nameless = Button({ icon: TrashIcon });

// @ts-expect-error — `aria-label` alone is not the name the tooltip repeats.
export const ariaOnly = Button({ icon: TrashIcon, 'aria-label': 'Delete document' });

// @ts-expect-error — the same holds for a link.
export const namelessLink = ButtonLink({ href: '/x', icon: TrashIcon });

// @ts-expect-error — beside children, `label` is refused: the children are the name.
export const both = Button({ icon: TrashIcon, label: 'Delete', children: 'Delete document' });
