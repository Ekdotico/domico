/**
 * Shared components.
 *
 * Only components that are genuinely generic across the documentation site,
 * the institutional site, and the internal tools live here. Anything tied to
 * one application's information architecture — page headers, navigation,
 * requirement tables, glossary tooltips — stays in that application.
 *
 * "Navigation" there means the content: which pages exist, how they group, and
 * what a sidebar lists. The chrome that carries it is not tied to any of that,
 * and two pieces of it now ship here: `NavDrawer`, which takes the
 * application's sidebar as its children, and `OnThisPage`, which reads
 * whatever headings the page has. Each was two copies of one component that
 * had already drifted apart, and neither knows a route: an application passes
 * its route as a key, so nothing here imports a router.
 *
 * "Page headers" there means the same: what a header holds, such as a trail, a
 * status and the actions of one page. `PageHeading` is none of that. It is the
 * type of a page's `h1` and takes its words from the application.
 *
 * `@supersedes` names the local component an export replaced, where the name
 * changed on the way in. `ekdotico-check discipline` reads it from this file,
 * so a copy left behind under its old name is reported as a reimplementation
 * like one under the new name.
 *
 * Styles ship separately and must be imported once at the application root:
 *
 *   import '@ekdotico/domico/tokens.css';
 *   import '@ekdotico/domico/styles.css';
 */

export {
  Cluster,
  Container,
  Stack,
  type SpaceStep,
} from './primitives.js';

export { Badge, type BadgeVariant } from './Badge.js';
export { Callout, type CalloutType } from './Callout.js';
export { DocMeta } from './DocMeta.js';
export { Figure, type FigureAlign } from './Figure.js';
export { KeyValue, KeyValueList, type KeyValueTone } from './KeyValue.js';
export { Logo, LogoMark, type LogoMarkVariant } from './Logo.js';
export { SectionRule } from './SectionRule.js';
export { SkipLink } from './SkipLink.js';
export { Stat, StatGrid } from './Stat.js';
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from './Table.js';
export { StickyTableHead } from './StickyTableHead.js';
export { Tab, Tabs } from './Tabs.js';

// Form controls, the dialog and the tooltip. The application signs a person in,
// takes feedback and asks for confirmation with these; none replaces a local
// component, because no application had drawn one yet.
export {
  Button,
  ButtonLink,
  type ButtonContent,
  type ButtonIcon,
  type ButtonVariant,
} from './Button.js';
export { TextField, OneTimeCodeField, type TextFieldProps } from './TextField.js';
export { PasswordField } from './PasswordField.js';
export { TextArea } from './TextArea.js';
export { Checkbox, RadioGroup, type RadioOption } from './Choice.js';
export { FormFault, type FormFaultAnnounce, type FormFaultItem, type FormFaultTone } from './FormFault.js';
export { Dialog } from './Dialog.js';
export { Tooltip } from './Tooltip.js';
// The heading of an application page. The application had composed one from
// tokens, with a class of its own to set a Greek letter in the sans.
export { PageHeading, type PageHeadingProps } from './PageHeading.js';
// A QR code, for the secret of a second sign-in factor. Dark on light in every
// theme, encoded by the package, and rendered on the server.
export { QrCode } from './QrCode.js';

// The controls round a document being written: a select, a row of toggles, a
// menu of actions, and whether the document is saved. Added before the editor
// was built, so that it draws none of its own. The document itself is not a
// component: `styles/editor.css` and `styles/code.css` style the markup an
// editor produces, by class and attribute, and this package imports no editor.
export { Select, type SelectProps } from './Select.js';
export { Toolbar, ToolbarSeparator, ToggleButton } from './Toolbar.js';
export { MenuButton, type MenuButtonItem } from './MenuButton.js';
export { SyncStatus, type SyncState } from './SyncStatus.js';
// The list an editor opens at the cursor, on "/" or "@", with focus left in
// the text. `Select` says a drawn listbox is not provided, and for a choice in
// a form that still holds; this one is for the place a native select cannot
// go. The control never has focus, so the keys and the attributes of the text
// region are the application's, and the helpers beside it are how every
// application gets the same ones.
export { OptionList, type OptionListDismissReason, type OptionListProps } from './OptionList.js';
export {
  optionListAttributes,
  optionListKey,
  optionListNavigating,
  optionListOptionId,
  placeOptionList,
  type OptionListAnchor,
  type OptionListItem,
  type OptionListKeyEvent,
  type OptionListKeyResult,
  type OptionListPlacement,
  type OptionListTextAttributes,
} from './optionListHelpers.js';

// A person as a picture, and the people who have a document open as a row of
// them. Initials on the person's collaborator colour, with room for an image
// later; the application passes every word a screen reader hears.
export { Avatar, avatarInitials, type AvatarProps, type AvatarSize } from './Avatar.js';
export { AvatarStack, type AvatarStackPerson, type AvatarStackProps } from './AvatarStack.js';

/** @supersedes UnlockScreen, ResearchUnlockScreen */
export { AccessGate } from './AccessGate.js';
/** @supersedes UnlockSubmitButton */
export { GateSubmitButton } from './GateSubmitButton.js';
/** @supersedes MobileNav, ResearchMobileNav */
export { NavDrawer } from './NavDrawer.js';
export { OnThisPage } from './OnThisPage.js';
export { InPageLinkDirection, type InPageLinkDirectionProps } from './InPageLinkDirection.js';
/** @supersedes PageLoader */
export { OpeningSequence } from './OpeningSequence.js';
