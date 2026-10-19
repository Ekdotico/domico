// Type-checked, never run: `check:components` compiles this file against the
// built declarations. What an avatar must be told, and what it must be told
// not to do, is held by the compiler, because the cases below are the ones a
// render cannot refuse: an unnamed picture draws exactly as a named one.
import { Avatar, AvatarStack, avatarInitials } from '../../dist/src/components/index.js';
import type { AvatarStackPerson } from '../../dist/src/components/index.js';

// A picture is named, or it is decorative, and every call says which.
export const alone = <Avatar name="Maria Papadopoulou" collaboratorSlot={1} label="Maria Papadopoulou" />;
export const beside = <Avatar name="Μαρία Παπαδοπούλου" collaboratorSlot={10} size="sm" decorative />;
export const fromInitials = <Avatar initials="MP" collaboratorSlot={4} size="lg" src="/m.png" decorative />;
export const both = <Avatar name="Maria" initials="M" collaboratorSlot={2} className="x" id="y" label="Maria" />;

// @ts-expect-error neither named nor decorative: the silent case
export const unsaid = <Avatar name="Maria" collaboratorSlot={1} />;
// @ts-expect-error named and decorative at once
export const twice = <Avatar name="Maria" collaboratorSlot={1} label="Maria" decorative />;
// @ts-expect-error decorative is true or absent
export const notDecorative = <Avatar name="Maria" collaboratorSlot={1} decorative={false} />;
// @ts-expect-error no letters: neither a name nor initials
export const noLetters = <Avatar collaboratorSlot={1} decorative />;
// @ts-expect-error a slot is 1 to 10
export const slotEleven = <Avatar name="Maria" collaboratorSlot={11} decorative />;
// @ts-expect-error a slot is 1 to 10
export const slotZero = <Avatar name="Maria" collaboratorSlot={0} decorative />;
// @ts-expect-error a slot is a number
export const slotText = <Avatar name="Maria" collaboratorSlot="3" decorative />;
// @ts-expect-error the letters are not children
export const children = <Avatar name="Maria" collaboratorSlot={1} decorative children="x" />;
// @ts-expect-error a size is one of three
export const huge = <Avatar name="Maria" collaboratorSlot={1} decorative size="xl" />;
// @ts-expect-error the role is the component's
export const roled = <Avatar name="Maria" collaboratorSlot={1} decorative role="button" />;

const maria: AvatarStackPerson = {
  id: 'u1',
  name: 'Maria Papadopoulou',
  role: 'Editor',
  collaboratorSlot: 1,
  you: 'you',
  src: '/m.png',
  initials: 'MP',
};
const more = (hidden: number) => (hidden === 1 ? 'and 1 more person' : `and ${hidden} more people`);

export const stack = (
  <AvatarStack label="People in this document" people={[maria, { id: 'u2', name: 'Nikos', collaboratorSlot: 2 }]} max={4} size="sm" more={more} id="who" className="c" />
);

// @ts-expect-error the list has a name, and it is the application's
export const unnamed = <AvatarStack people={[maria]} more={more} />;
// @ts-expect-error the words for the people not drawn are the application's
export const mute = <AvatarStack label="People" people={[maria]} />;
// @ts-expect-error no list without its people
export const nobody = <AvatarStack label="People" more={more} />;
// @ts-expect-error a person needs a key
export const keyless: AvatarStackPerson = { name: 'Nikos', collaboratorSlot: 2 };
// @ts-expect-error a person needs a name, which is what a screen reader reads
export const nameless: AvatarStackPerson = { id: 'u3', collaboratorSlot: 2 };
// @ts-expect-error a person needs a colour
export const colourless: AvatarStackPerson = { id: 'u3', name: 'Nikos' };
// @ts-expect-error a slot is 1 to 10
export const slotless: AvatarStackPerson = { id: 'u3', name: 'Nikos', collaboratorSlot: 12 };
// @ts-expect-error `you` is the application's word, not a flag
export const flagged: AvatarStackPerson = { id: 'u3', name: 'Nikos', collaboratorSlot: 2, you: true };
// @ts-expect-error the stack names its own role
export const roledStack = <AvatarStack label="People" people={[maria]} more={more} role="group" />;
// @ts-expect-error `more` returns words
export const wordless = <AvatarStack label="People" people={[maria]} more={(hidden: number) => hidden} />;

export const letters: string = avatarInitials('Maria Papadopoulou');
