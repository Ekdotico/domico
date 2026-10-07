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
export { Button, type ButtonVariant } from './Button.js';
export { TextField, OneTimeCodeField, type TextFieldProps } from './TextField.js';
export { PasswordField } from './PasswordField.js';
export { TextArea } from './TextArea.js';
export { Checkbox, RadioGroup, type RadioOption } from './Choice.js';
export { FormFault, type FormFaultItem } from './FormFault.js';
export { Dialog } from './Dialog.js';
export { Tooltip } from './Tooltip.js';

/** @supersedes UnlockScreen, ResearchUnlockScreen */
export { AccessGate } from './AccessGate.js';
/** @supersedes UnlockSubmitButton */
export { GateSubmitButton } from './GateSubmitButton.js';
/** @supersedes MobileNav, ResearchMobileNav */
export { NavDrawer } from './NavDrawer.js';
export { OnThisPage } from './OnThisPage.js';
/** @supersedes PageLoader */
export { OpeningSequence } from './OpeningSequence.js';
