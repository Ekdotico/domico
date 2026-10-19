// Type-checked, never run: `check:components` compiles this file against the
// built declarations. It exists because a props type cannot be asserted at run
// time — the attribute reaches the DOM through the spread whatever the type
// says — and the type is what stops `scope` being refused at a call site.
import { Checkbox, TableCell, TableHeaderCell } from '../../dist/src/components/index.js';

export const rowHeader = (
  <TableHeaderCell scope="row" colSpan={2} abbr="Role" headers="a b">
    Editors
  </TableHeaderCell>
);
export const columnHeader = <TableHeaderCell scope="col">Rename</TableHeaderCell>;
export const spanning = <TableCell colSpan={3} rowSpan={2} headers="a">None</TableCell>;
export const hiddenLabel = <Checkbox name="rename" label="Editors can rename" labelHidden />;

// The attribute is typed, not `any`: React types `scope` as a string.
// @ts-expect-error
export const refused = <TableHeaderCell scope={3}>Editors</TableHeaderCell>;
