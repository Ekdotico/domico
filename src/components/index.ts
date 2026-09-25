/**
 * Shared components.
 *
 * Only components that are genuinely generic across the documentation site,
 * the institutional site, and the internal tools live here. Anything tied to
 * one application's information architecture — page headers, navigation,
 * requirement tables, glossary tooltips — stays in that application.
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
export { Tab, Tabs } from './Tabs.js';
