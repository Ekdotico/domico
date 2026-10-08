/**
 * A QR code symbol, as a matrix of modules.
 *
 * One encoder, the package's own, written from ISO/IEC 18004:2015 and
 * depending on nothing. It does the one job `QrCode` needs and none of the
 * others a library offers: byte mode, error-correction level M, the smallest
 * version from 1 to 40 that holds the value, and the mask the standard's four
 * penalty rules score lowest. There is no numeric, alphanumeric or kanji mode,
 * no other level, no structured append and no ECI header, so text outside
 * ASCII is written as UTF-8, which every current reader assumes.
 *
 * The two tables are the standard's Table 9 for level M. Everything else is
 * computed: the alignment centres, the two BCH codes and the Reed-Solomon
 * generator.
 *
 * Where the standard leaves the third penalty rule open, this reads it as
 * follows. A run of dark, light, three dark, light, dark scores 40 once, where
 * four light modules stand on either side of it, and the quiet zone outside
 * the symbol counts as light, since it is. Encoders differ here, so two of
 * them can choose different masks for one value. Both symbols are valid and
 * both decode.
 *
 * `check:components` holds the matrix for fixed values to matrices another
 * encoder produced.
 */

/** Error-correction codewords in each block, level M, by version. */
const ECC_PER_BLOCK = [
  0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26,
  26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
];
/** Blocks the codewords are split into, level M, by version. */
const BLOCKS = [
  0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16,
  17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
];

/** The centres of the alignment patterns along one axis. */
function alignmentCentres(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const last = version * 4 + 10;
  const step = version === 32 ? 26 : Math.ceil((last - 6) / (count * 2 - 2)) * 2;
  const centres = [6];
  for (let i = count - 2; i >= 0; i--) centres.push(last - i * step);
  return centres;
}

/** Codewords of every kind a version holds: its modules less the function patterns, in eights. */
function totalCodewords(version: number): number {
  const size = version * 4 + 17;
  const aligned = alignmentCentres(version).length;
  let modules = size * size - 3 * 64 - 2 * (size - 16) - 31;
  if (aligned) modules -= (aligned * aligned - 3) * 25 - (aligned - 2) * 10;
  if (version >= 7) modules -= 36;
  return Math.floor(modules / 8);
}

const dataCodewords = (version: number) =>
  totalCodewords(version) - (ECC_PER_BLOCK[version] as number) * (BLOCKS[version] as number);

/** Bytes of text a version holds, after the mode and the count. */
const capacity = (version: number) => Math.floor((dataCodewords(version) * 8 - 4 - (version < 10 ? 8 : 16)) / 8);

/** The largest value, in bytes of UTF-8. */
export const QR_MAX_BYTES = capacity(40);

// --- Reed-Solomon over GF(256), reduced by x^8 + x^4 + x^3 + x^2 + 1 ----------
const EXP: number[] = [];
const LOG: number[] = [];
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
}
const multiply = (a: number, b: number) =>
  a && b ? (EXP[((LOG[a] as number) + (LOG[b] as number)) % 255] as number) : 0;

/** The generator of a given degree, highest power first and without its leading 1. */
function generator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = [...poly, 0];
    for (let j = 0; j < poly.length; j++) next[j + 1] = (next[j + 1] as number) ^ multiply(poly[j] as number, EXP[i] as number);
    poly = next;
  }
  return poly.slice(1);
}

/** The error-correction codewords of one block. */
function remainder(block: number[], divisor: number[]): number[] {
  const rest = divisor.map(() => 0);
  for (const byte of block) {
    const factor = byte ^ (rest.shift() as number);
    rest.push(0);
    for (let i = 0; i < divisor.length; i++) rest[i] = (rest[i] as number) ^ multiply(divisor[i] as number, factor);
  }
  return rest;
}

/** The value as the final sequence of codewords: data and error correction, interleaved. */
function codewords(bytes: Uint8Array, version: number): number[] {
  const room = dataCodewords(version);
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  for (const byte of bytes) push(byte, 8);
  push(0, Math.min(4, room * 8 - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(Number.parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; data.length < room; pad ^= 0xec ^ 0x11) data.push(pad);

  // The blocks. The short ones come first and are one data codeword shorter.
  const count = BLOCKS[version] as number;
  const divisor = generator(ECC_PER_BLOCK[version] as number);
  const short = Math.floor(room / count);
  const long = room % count;
  const blocks: { data: number[]; ecc: number[] }[] = [];
  for (let i = 0, at = 0; i < count; i++) {
    const block = data.slice(at, (at += short + (i < count - long ? 0 : 1)));
    blocks.push({ data: block, ecc: remainder(block, divisor) });
  }

  const out: number[] = [];
  for (let i = 0; i <= short; i++) for (const block of blocks) if (i < block.data.length) out.push(block.data[i] as number);
  for (let i = 0; i < divisor.length; i++) for (const block of blocks) out.push(block.ecc[i] as number);
  return out;
}

/** A BCH code: `value` followed by the remainder of its division by `poly`. */
function bch(value: number, poly: number, bits: number): number {
  let rest = value << bits;
  for (let i = 31 - Math.clz32(rest); i >= bits; i--) if ((rest >>> i) & 1) rest ^= poly << (i - bits);
  return (value << bits) | rest;
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** The standard's four penalty rules, summed. */
function penalty(grid: boolean[][]): number {
  const size = grid.length;
  let score = 0;
  let dark = 0;
  const lines = [...grid, ...grid.map((_, x) => grid.map((row) => row[x] as boolean))];
  for (const line of lines) {
    // Rule 1: a run of five or more in one colour.
    for (let i = 0, run = 1; i < size; i++, run++) {
      if (line[i] === line[i + 1]) continue;
      if (run >= 5) score += run - 2;
      run = 0;
    }
    // Rule 3: the finder's 1:1:3:1:1, with four light modules on either side.
    const light = (from: number) => [0, 1, 2, 3].every((i) => !line[from + i]);
    for (let i = 0; i + 7 <= size; i++) {
      const found = line[i] && !line[i + 1] && line[i + 2] && line[i + 3] && line[i + 4] && !line[i + 5] && line[i + 6];
      if (found && (light(i - 4) || light(i + 7))) score += 40;
    }
  }
  for (let y = 0; y < size; y++) {
    const row = grid[y] as boolean[];
    const below = grid[y + 1];
    for (let x = 0; x < size; x++) {
      if (row[x]) dark++;
      // Rule 2: a block of two by two in one colour.
      if (below && x + 1 < size && row[x] === row[x + 1] && row[x] === below[x] && row[x] === below[x + 1]) score += 3;
    }
  }
  // Rule 4: each whole 5% the share of dark modules stands from a half.
  return score + Math.floor((Math.abs(dark * 2 - size * size) * 10) / (size * size)) * 10;
}

/**
 * Encode `value` and return the symbol, a square of rows in which `true` is a
 * dark module. The quiet zone is not part of it.
 *
 * Throws a `RangeError` for a value the largest version cannot hold.
 */
export function encodeQr(value: string): boolean[][] {
  const bytes = new TextEncoder().encode(value);
  if (bytes.length > QR_MAX_BYTES) {
    throw new RangeError(
      `QrCode: the value is ${bytes.length} bytes and a QR code at level M holds at most ${QR_MAX_BYTES}.`,
    );
  }
  let version = 1;
  while (capacity(version) < bytes.length) version++;
  const size = version * 4 + 17;

  const grid: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fixed: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (x: number, y: number, dark: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    (grid[y] as boolean[])[x] = dark;
    (fixed[y] as boolean[])[x] = true;
  };
  /** Concentric squares round a centre: dark except on the rings named. */
  const rings = (cx: number, cy: number, radius: number, lightRings: number[]) => {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        set(cx + dx, cy + dy, !lightRings.includes(Math.max(Math.abs(dx), Math.abs(dy))));
      }
    }
  };

  // The timing patterns, then the three finders with their separators over them.
  for (let i = 0; i < size; i++) {
    set(i, 6, i % 2 === 0);
    set(6, i, i % 2 === 0);
  }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]] as const) rings(cx, cy, 4, [2, 4]);
  // The alignment patterns, except where a finder stands.
  const centres = alignmentCentres(version);
  const end = centres.length - 1;
  centres.forEach((cy, j) =>
    centres.forEach((cx, i) => {
      if ((i === 0 && j === 0) || (i === end && j === 0) || (i === 0 && j === end)) return;
      rings(cx, cy, 2, [1]);
    }),
  );
  // The version, twice, from version 7.
  if (version >= 7) {
    const word = bch(version, 0x1f25, 12);
    for (let i = 0; i < 18; i++) {
      const dark = ((word >>> i) & 1) === 1;
      set(size - 11 + (i % 3), Math.floor(i / 3), dark);
      set(Math.floor(i / 3), size - 11 + (i % 3), dark);
    }
  }
  /** The format: the level, which for M is 00, and the mask. Twice. */
  const format = (mask: number) => {
    const word = bch(mask, 0x537, 10) ^ 0x5412;
    const bit = (i: number) => ((word >>> i) & 1) === 1;
    for (let i = 0; i < 15; i++) {
      // Round the top-left finder, stepping over the timing patterns.
      if (i < 8) set(8, i < 6 ? i : i + 1, bit(i));
      else set(i < 9 ? 7 : 14 - i, 8, bit(i));
      // Under the top-right finder, then beside the bottom-left.
      if (i < 8) set(size - 1 - i, 8, bit(i));
      else set(8, size - 15 + i, bit(i));
    }
    set(8, size - 8, true);
  };
  format(0);

  // The codewords, in columns of two from the right, up then down, skipping
  // the vertical timing pattern. What is left over stays light.
  const data = codewords(bytes, version);
  let placed = 0;
  for (let right = size - 1, upward = true; right >= 1; right -= 2, upward = !upward) {
    if (right === 6) right = 5;
    for (let step = 0; step < size; step++) {
      const y = upward ? size - 1 - step : step;
      for (const x of [right, right - 1]) {
        if ((fixed[y] as boolean[])[x]) continue;
        const byte = data[placed >>> 3];
        (grid[y] as boolean[])[x] = byte !== undefined && ((byte >>> (7 - (placed & 7))) & 1) === 1;
        placed++;
      }
    }
  }

  // Each mask in turn, keeping the one that scores lowest and the first of equals.
  const masked = (mask: number) => {
    const test = MASKS[mask] as (x: number, y: number) => boolean;
    format(mask);
    return grid.map((row, y) => row.map((dark, x) => ((fixed[y] as boolean[])[x] ? dark : dark !== test(x, y))));
  };
  let best = masked(0);
  let lowest = penalty(best);
  for (let mask = 1; mask < 8; mask++) {
    const candidate = masked(mask);
    const score = penalty(candidate);
    if (score < lowest) {
      best = candidate;
      lowest = score;
    }
  }
  return best;
}
