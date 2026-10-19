import { type HTMLAttributes } from 'react';
import type { CollaboratorSlot } from '../../tokens/generated/tokens.js';
import { Avatar, type AvatarSize } from './Avatar.js';

/**
 * Who has a document open: a row of overlapping pictures that is, to a screen
 * reader, a list of names and roles.
 *
 *   <AvatarStack
 *     label="People in this document"
 *     people={[
 *       { id: 'u1', name: 'Maria Papadopoulou', role: 'Editor', collaboratorSlot: 1, you: 'you' },
 *       { id: 'u2', name: 'Nikos Georgiou', role: 'Viewer', collaboratorSlot: 2 },
 *     ]}
 *     max={4}
 *     more={(n) => (n === 1 ? 'and 1 more person' : `and ${n} more people`)}
 *   />
 *
 * **Markup.** A `<ul>` named by `label`, with `role="list"` written out because
 * Safari drops the list from the accessibility tree when its markers are
 * removed, and a bar of people with no list is a row of unnamed pictures. Each
 * person is a list item holding two things: the picture, which is
 * `aria-hidden`, and a line of text, hidden from the page and kept for a
 * screen reader, that reads the name, then the `you` words in parentheses if
 * there are any, then the role: "Maria Papadopoulou (you), Editor". The text
 * is inside the item and the item is positioned, so the hidden words lie
 * within their own item and cannot widen a scroll container the stack is put
 * in (`styles/table.css` found this for a checkbox in a cell).
 *
 * **Not focusable, deliberately.** A person in the stack has nothing to do in
 * the application today, and a Tab stop that does nothing is a stop the reader
 * has to pass and a control that is not one (WCAG 4.1.2). So the stack is read
 * in reading order, as a list, and a screen-reader user gets every name
 * without moving focus. The day a person has an action, such as a link to
 * their cursor, that is a new prop and a button inside the item. The
 * stylesheet already raises an item that holds focus above its neighbours, so
 * the overlap will not cover its ring.
 *
 * **The words are the application's.** `label` names the list. `more` takes the
 * number of people not drawn and returns the words for them, so the plural, in
 * every language, is the application's to get right; it is called only when
 * someone is hidden. `you` is the application's word for the reader
 * ("you"), set on the person who is the reader, and `role` is the role in
 * the application's words. The package has none of these as defaults.
 *
 * **What is drawn.** `max` people (4 unless set), in the order given, and
 * then, if there are more, one item with their count (`+3`). The count is
 * drawn and `aria-hidden`; what a screen reader hears is `more(3)`. A
 * person with `you` has a ring in `--fg-1` as well as the words. The pictures
 * are the initials on the person's collaborator colour, or `src`; see `Avatar`.
 * Each overlaps the one before by 4px (2px at `sm`), which stops short of the
 * second letter of its initials. When the row is wider than its container it
 * wraps, and nothing overflows the page, down to 320 pixels.
 *
 * It renders nothing for no people. Its other attributes pass through to the
 * list.
 *
 * Styles ship in `@ekdotico/domico/styles/avatar.css`.
 */
export type AvatarStackPerson = {
  /** A stable identity, used as the list key. */
  id: string;
  name: string;
  /** Read after the name. The application's words: "Editor", "Can view". */
  role?: string;
  /** The person's colour, 1 to 10. */
  collaboratorSlot: CollaboratorSlot;
  /** Overrides the letters derived from `name`. */
  initials?: string;
  /** A picture, drawn over the letters. */
  src?: string;
  /** The application's word for the reader, set on the person who is the reader. */
  you?: string;
};

export type AvatarStackProps = Omit<
  HTMLAttributes<HTMLUListElement>,
  'children' | 'role' | 'aria-label' | 'aria-labelledby'
> & {
  /** The name of the list: "People in this document". */
  label: string;
  people: readonly AvatarStackPerson[];
  /** The most people drawn before the rest are counted. 4 unless set. */
  max?: number;
  size?: AvatarSize;
  /** The words for the people not drawn, given their number. */
  more: (hidden: number) => string;
};

const DEFAULT_MAX = 4;

export function AvatarStack({
  label,
  people,
  max = DEFAULT_MAX,
  size = 'md',
  more,
  className,
  ...list
}: AvatarStackProps) {
  if (people.length === 0) return null;
  const shown = people.slice(0, max >= 0 ? Math.floor(max) : DEFAULT_MAX);
  const hidden = people.length - shown.length;
  const sized = size === 'md' ? '' : ` ekd-avatar--${size}`;

  return (
    <ul
      {...list}
      role="list"
      aria-label={label}
      className={['ekd-avatar-stack', size === 'sm' ? 'ekd-avatar-stack--sm' : null, className].filter(Boolean).join(' ')}
    >
      {shown.map((person) => (
        <li key={person.id} className="ekd-avatar-stack-item" data-you={person.you ? 'true' : undefined}>
          <Avatar
            name={person.name}
            initials={person.initials}
            src={person.src}
            collaboratorSlot={person.collaboratorSlot}
            size={size}
            decorative
          />
          <span className="ekd-avatar-text">
            {person.name}
            {person.you ? ` (${person.you})` : ''}
            {person.role ? `, ${person.role}` : ''}
          </span>
        </li>
      ))}
      {hidden > 0 ? (
        <li className="ekd-avatar-stack-item">
          <span className={`ekd-avatar${sized}`} aria-hidden="true">
            <span className="ekd-avatar-letters">{`+${hidden}`}</span>
          </span>
          <span className="ekd-avatar-text">{more(hidden)}</span>
        </li>
      ) : null}
    </ul>
  );
}
