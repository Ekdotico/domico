import type { SVGAttributes } from 'react';
import { encodeQr } from './qr.js';

/** Light modules on each side of the symbol. ISO/IEC 18004 asks for four. */
const QUIET_ZONE = 4;

/**
 * A QR code, drawn as an inline SVG.
 *
 *   <QrCode value={otpauthUri} label="QR code for your authenticator app" />
 *
 * `value` is the text a camera reads back. `label` is the accessible name and
 * has no default: the image is `role="img"`, which leaves a screen reader its
 * name and nothing else, and what the code is for is the application's to
 * say. A code is never the only way in. Show the same value as text beside
 * it, for a person who cannot use a camera.
 *
 * **It is dark on light in every theme.** A phone reads dark modules on a
 * light ground and cannot read the reverse, so the two colours are
 * `--scan-ink` and `--scan-plate`, which are the same in all eight palettes,
 * and the code stands on its own light plate in a dark theme. The plate
 * includes the quiet zone, four modules on each side, which the standard
 * requires and a reader needs to find the code. Do not crop it, and do not
 * give the code a rounded corner that cuts into it.
 *
 * The colours are set through `style`, as `LogoMark` sets its own, because an
 * SVG presentation attribute does not resolve `var()`. So the control needs
 * the tokens and no stylesheet entry. `forced-color-adjust: none` keeps the
 * two colours where a reader has forced a palette: a code redrawn in the
 * system's colours can come out light on dark.
 *
 * `size` is the width and the height in CSS pixels, 200 unless the
 * application says otherwise, and it includes the quiet zone. A value of 200
 * bytes makes a code of 65 modules across with its quiet zone, a little over
 * 3 pixels a module at 200. Keep 3 pixels a module or more, and raise `size`
 * for a longer value: a decoder read every rendering tried at 2.8 and above
 * and failed one at 2.3.
 *
 * There is no hook and no client boundary: the matrix is computed in render,
 * so a server component renders the code and the value is not sent to the
 * browser a second time to be encoded there. The encoding is byte mode at
 * error-correction level M, in the smallest version that holds the value,
 * with the package's own encoder. A value over 2331 bytes of UTF-8 does not
 * fit the largest version and throws a `RangeError` at render.
 */
export function QrCode({
  value,
  label,
  size = 200,
  className,
  style,
  ...svg
}: Omit<SVGAttributes<SVGSVGElement>, 'children' | 'role' | 'aria-label' | 'viewBox' | 'width' | 'height'> & {
  /** The text to encode. */
  value: string;
  /** The accessible name of the image. */
  label: string;
  /** Width and height in CSS pixels, quiet zone included. */
  size?: number;
}) {
  const modules = encodeQr(value);
  const side = modules.length + QUIET_ZONE * 2;

  // One path, a rectangle for each run of dark modules in a row.
  let d = '';
  modules.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (!row[x]) continue;
      let end = x;
      while (row[end + 1]) end++;
      d += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h${end - x + 1}v1h${x - end - 1}z`;
      x = end;
    }
  });

  return (
    <svg
      {...svg}
      role="img"
      aria-label={label}
      className={['ekd-qr', className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${side} ${side}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ forcedColorAdjust: 'none', ...style }}
    >
      <rect width={side} height={side} style={{ fill: 'var(--scan-plate)' }} />
      <path d={d} style={{ fill: 'var(--scan-ink)' }} />
    </svg>
  );
}
