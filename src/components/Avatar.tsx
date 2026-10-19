'use client';

import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { collaboratorSlots, type CollaboratorSlot } from '../../tokens/generated/tokens.js';

/**
 * A person's picture: their initials on their collaborator colour, or an image.
 *
 *   <Avatar name="Maria Papadopoulou" collaboratorSlot={3} label="Maria Papadopoulou" />
 *   <Avatar name="Μαρία Παπαδοπούλου" collaboratorSlot={3} decorative />
 *   <Avatar initials="MP" collaboratorSlot={3} src={person.picture} decorative />
 *
 * **The colour is the person's slot.** `collaboratorSlot` is 1 to 10, the same
 * number that colours that person's caret and selection in a shared document
 * (`--collab-N`, with `--collab-N-ink` for the letters), so one person is one
 * colour wherever the application draws them. Anything else is a `RangeError`
 * at render: a picture with no colour would be drawn and would pass for a
 * choice.
 *
 * **The letters** are `initials` where the caller has them, cut to two
 * graphemes. Otherwise they are derived from `name` by `avatarInitials`: the
 * first grapheme of the first word and of the last, capitalised, so a name in
 * Greek or with an accent or a combining mark is not cut through a character.
 * One of the two is required.
 *
 * **Every call states whether the picture is named.** Either `label`, which
 * makes it an image with that name, for an avatar that stands alone; or
 * `decorative`, which hides it from a screen reader, for one that sits beside
 * the person's name or in an `AvatarStack`, where the name is text and the
 * letters would be read as a second, shorter name. There is no default: both
 * are the right answer somewhere, and the wrong one is silent.
 *
 * **An image replaces the letters.** `src` is drawn over them, filling the
 * circle, with no alternative text of its own, since the name is `label` or
 * the text beside it. The letters stay under it and show if the image fails
 * to load. Nothing here uploads, resizes or fetches a picture.
 *
 * Three sizes, 24, 32 and 40 pixels at least (`--sp-6`, `--sp-7`, `--sp-8`).
 * The circle is a minimum and grows with the letters, so a reader who raises
 * the text size gets a larger picture and not clipped letters (WCAG 1.4.4).
 * The letters are set in `--font-sans`, which has Greek.
 *
 * It is not a control and takes no focus. Its other attributes pass through.
 *
 * Styles ship in `@ekdotico/domico/styles/avatar.css`.
 */
export type AvatarSize = 'sm' | 'md' | 'lg';

export type AvatarProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'role' | 'aria-hidden' | 'aria-label' | 'aria-labelledby'
> & {
  /** The person's colour, 1 to 10: the slot of `--collab-N`. */
  collaboratorSlot: CollaboratorSlot;
  size?: AvatarSize;
  /** A picture. Drawn over the letters, which stay beneath it. */
  src?: string;
} & (
    | { name: string; initials?: string }
    | { initials: string; name?: string }
  ) &
  (
    | { label: string; decorative?: never }
    | { decorative: true; label?: never }
  );

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

/** The first `count` graphemes of a string: user-perceived characters, not code units. */
function graphemes(text: string, count: number): string[] {
  const out: string[] = [];
  for (const part of segmenter ? segmenter.segment(text) : Array.from(text, (segment) => ({ segment }))) {
    if (out.length === count) break;
    out.push(part.segment);
  }
  return out;
}

/**
 * The initials of a name: the first grapheme of its first word and of its
 * last, capitalised; of a single word, its first grapheme. `''` if the name
 * has no word. Cutting by grapheme keeps a letter with its accent and an emoji
 * whole, and `toUpperCase` is the same in every locale, so the server and the
 * browser draw the same letters.
 */
export function avatarInitials(name: string): string {
  const words = name.split(/\s+/u).filter(Boolean);
  const first = words[0];
  const last = words[words.length - 1];
  if (first === undefined || last === undefined) return '';
  const picked = words.length === 1 ? [first] : [first, last];
  return picked.map((word) => graphemes(word, 1).join('').toUpperCase()).join('');
}

/** @internal The letters an avatar draws: the caller's initials if it gave any, else those of its name. */
export function avatarLetters(initials: string | undefined, name: string | undefined): string {
  const given = initials?.trim();
  return given ? graphemes(given, 2).join('') : avatarInitials(name ?? '');
}

/** @internal The class of a slot, validated: a slot outside 1 to 10 has no colour. */
export function avatarSlotClass(slot: number): string {
  if (!(collaboratorSlots as readonly number[]).includes(slot)) {
    throw new RangeError(
      `Avatar: collaboratorSlot is ${String(slot)}, and the slots are ${collaboratorSlots[0]} to ${collaboratorSlots[collaboratorSlots.length - 1]}`,
    );
  }
  return `ekd-avatar-slot-${slot}`;
}

export function Avatar(props: AvatarProps) {
  const { collaboratorSlot, size = 'md', src, name, initials, label, decorative, className, ...rest } = props;
  const slotClass = avatarSlotClass(collaboratorSlot);

  // The image that failed, by its address, so a new `src` is tried afresh.
  const [failed, setFailed] = useState<string | null>(null);
  const image = useRef<HTMLImageElement>(null);
  // An image that failed before React could listen has already said so.
  useEffect(() => {
    const element = image.current;
    if (element && element.complete && element.naturalWidth === 0) setFailed(src ?? null);
  }, [src]);

  const classes = ['ekd-avatar', size === 'md' ? null : `ekd-avatar--${size}`, slotClass, className];
  return (
    <span
      {...rest}
      className={classes.filter(Boolean).join(' ')}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      <span className="ekd-avatar-letters">{avatarLetters(initials, name)}</span>
      {src && failed !== src ? (
        <img
          ref={image}
          className="ekd-avatar-image"
          src={src}
          alt=""
          draggable={false}
          onError={() => setFailed(src)}
        />
      ) : null}
    </span>
  );
}
