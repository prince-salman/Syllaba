/**
 * Zero-dependency ISO/IEC 18004 QR Code matrix generator (Byte mode, EC Level M).
 * Supports Versions 1-12 (21x21 up to 65x65, up to 287 UTF-8 bytes) so every QR
 * code rendered on certificates is genuinely scannable by standard phone cameras.
 */

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsComputeEC(data: number[], ecCount: number): number[] {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Array<number>(data.length + ecCount).fill(0);
  for (let i = 0; i < data.length; i++) res[i] = data[i];
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return res.slice(data.length);
}

interface VersionSpec {
  version: number;
  totalDataBytes: number;
  ecPerBlock: number;
  g1Blocks: number;
  g1DataBytes: number;
  g2Blocks: number;
  g2DataBytes: number;
  alignmentCoords: number[];
}

// ISO/IEC 18004 Table 9 — Error Correction Level M
const VERSION_SPECS_M: VersionSpec[] = [
  { version: 1, totalDataBytes: 16, ecPerBlock: 10, g1Blocks: 1, g1DataBytes: 16, g2Blocks: 0, g2DataBytes: 0, alignmentCoords: [] },
  { version: 2, totalDataBytes: 28, ecPerBlock: 16, g1Blocks: 1, g1DataBytes: 28, g2Blocks: 0, g2DataBytes: 0, alignmentCoords: [6, 18] },
  { version: 3, totalDataBytes: 44, ecPerBlock: 26, g1Blocks: 1, g1DataBytes: 44, g2Blocks: 0, g2DataBytes: 0, alignmentCoords: [6, 22] },
  { version: 4, totalDataBytes: 64, ecPerBlock: 18, g1Blocks: 2, g1DataBytes: 32, g2Blocks: 0, g2DataBytes: 0, alignmentCoords: [6, 26] },
  { version: 5, totalDataBytes: 86, ecPerBlock: 24, g1Blocks: 2, g1DataBytes: 43, g2Blocks: 0, g2DataBytes: 0, alignmentCoords: [6, 30] },
  { version: 6, totalDataBytes: 108, ecPerBlock: 16, g1Blocks: 4, g1DataBytes: 27, g2Blocks: 0, g2DataBytes: 0, alignmentCoords: [6, 34] },
  { version: 7, totalDataBytes: 124, ecPerBlock: 18, g1Blocks: 4, g1DataBytes: 31, g2Blocks: 0, g2DataBytes: 0, alignmentCoords: [6, 22, 38] },
  { version: 8, totalDataBytes: 154, ecPerBlock: 22, g1Blocks: 2, g1DataBytes: 38, g2Blocks: 2, g2DataBytes: 39, alignmentCoords: [6, 24, 42] },
  { version: 9, totalDataBytes: 182, ecPerBlock: 22, g1Blocks: 3, g1DataBytes: 36, g2Blocks: 2, g2DataBytes: 37, alignmentCoords: [6, 26, 46] },
  { version: 10, totalDataBytes: 216, ecPerBlock: 26, g1Blocks: 4, g1DataBytes: 43, g2Blocks: 1, g2DataBytes: 44, alignmentCoords: [6, 28, 50] },
  { version: 11, totalDataBytes: 254, ecPerBlock: 30, g1Blocks: 1, g1DataBytes: 50, g2Blocks: 4, g2DataBytes: 51, alignmentCoords: [6, 30, 54] },
  { version: 12, totalDataBytes: 290, ecPerBlock: 22, g1Blocks: 6, g1DataBytes: 36, g2Blocks: 2, g2DataBytes: 37, alignmentCoords: [6, 32, 58] },
];

const MASK_FUNCTIONS: Array<(r: number, c: number) => boolean> = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function computeFormatBitsM(maskPattern: number): number {
  // EC Level M = 00 in 2-bit format indicator
  const data = (0 << 3) | (maskPattern & 0x7);
  let rem = data << 10;
  const poly = 0x537;
  for (let bit = 14; bit >= 10; bit--) {
    if ((rem >> bit) & 1) {
      rem ^= poly << (bit - 10);
    }
  }
  const combined = ((data << 10) | rem) ^ 0x5412;
  return combined;
}

function computeVersionBits(version: number): number {
  let rem = version << 12;
  const poly = 0x1f25;
  for (let bit = 17; bit >= 12; bit--) {
    if ((rem >> bit) & 1) {
      rem ^= poly << (bit - 12);
    }
  }
  return (version << 12) | rem;
}

function encodeDataCodewords(bytes: Uint8Array, spec: VersionSpec): number[] {
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  // Mode: Byte (0100)
  pushBits(0b0100, 4);
  // Character count indicator: 8 bits (v1-9), 16 bits (v10+)
  pushBits(bytes.length, spec.version <= 9 ? 8 : 16);

  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8);
  }

  const maxBits = spec.totalDataBytes * 8;
  const terminatorLen = Math.min(4, maxBits - bits.length);
  for (let i = 0; i < terminatorLen; i++) bits.push(0);

  while (bits.length % 8 !== 0) bits.push(0);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let k = 0; k < 8; k++) b = (b << 1) | bits[i + k];
    codewords.push(b);
  }

  let padToggle = 0;
  while (codewords.length < spec.totalDataBytes) {
    codewords.push(padToggle % 2 === 0 ? 0xec : 0x11);
    padToggle++;
  }

  return codewords;
}

function buildFinalBitStream(codewords: number[], spec: VersionSpec): number[] {
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;

  for (let i = 0; i < spec.g1Blocks; i++) {
    const block = codewords.slice(offset, offset + spec.g1DataBytes);
    offset += spec.g1DataBytes;
    dataBlocks.push(block);
    ecBlocks.push(rsComputeEC(block, spec.ecPerBlock));
  }

  for (let i = 0; i < spec.g2Blocks; i++) {
    const block = codewords.slice(offset, offset + spec.g2DataBytes);
    offset += spec.g2DataBytes;
    dataBlocks.push(block);
    ecBlocks.push(rsComputeEC(block, spec.ecPerBlock));
  }

  const interleaved: number[] = [];
  const maxDataLen = Math.max(spec.g1DataBytes, spec.g2DataBytes);
  for (let i = 0; i < maxDataLen; i++) {
    for (const blk of dataBlocks) {
      if (i < blk.length) interleaved.push(blk[i]);
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (const blk of ecBlocks) {
      interleaved.push(blk[i]);
    }
  }

  const bitStream: number[] = [];
  for (const byteVal of interleaved) {
    for (let b = 7; b >= 0; b--) {
      bitStream.push((byteVal >> b) & 1);
    }
  }
  return bitStream;
}

function createFunctionGrid(spec: VersionSpec): {
  size: number;
  isFunction: boolean[][];
  modules: boolean[][];
} {
  const size = spec.version * 4 + 17;
  const isFunction = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false)
  );
  const modules = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false)
  );

  const setFunc = (r: number, c: number, dark: boolean) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    isFunction[r][c] = true;
    modules[r][c] = dark;
  };

  // Finder patterns + 1-module light separator
  const drawFinder = (top: number, left: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = top + dr;
        const c = left + dc;
        if (r < 0 || c < 0 || r >= size || c >= size) continue;
        const dist = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
        const dark = dist !== 2 && dist !== 4;
        setFunc(r, c, dark);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const dark = i % 2 === 0;
    if (!isFunction[6][i]) setFunc(6, i, dark);
    if (!isFunction[i][6]) setFunc(i, 6, dark);
  }

  // Dark module
  setFunc(size - 8, 8, true);

  // Alignment patterns
  const coords = spec.alignmentCoords;
  for (const rCenter of coords) {
    for (const cCenter of coords) {
      // Skip corners overlapping finders
      if (
        (rCenter <= 8 && cCenter <= 8) ||
        (rCenter <= 8 && cCenter >= size - 9) ||
        (rCenter >= size - 9 && cCenter <= 8)
      ) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setFunc(rCenter + dr, cCenter + dc, dist !== 1);
        }
      }
    }
  }

  // Reserve format info slots
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
    if (i < 7) isFunction[size - 1 - i][8] = true;
  }

  // Version info (versions >= 7)
  if (spec.version >= 7) {
    const vBits = computeVersionBits(spec.version);
    for (let i = 0; i < 18; i++) {
      const bit = ((vBits >> i) & 1) === 1;
      const a = Math.floor(i / 3);
      const b = (i % 3) + size - 11;
      setFunc(a, b, bit);
      setFunc(b, a, bit);
    }
  }

  return { size, isFunction, modules };
}

function applyFormatBits(modules: boolean[][], size: number, maskPattern: number) {
  const fmt = computeFormatBitsM(maskPattern);
  // Copy 1: top-left (bits 0..14)
  for (let i = 0; i <= 5; i++) modules[8][i] = ((fmt >> (14 - i)) & 1) === 1;
  modules[8][7] = ((fmt >> 8) & 1) === 1;
  modules[8][8] = ((fmt >> 7) & 1) === 1;
  modules[7][8] = ((fmt >> 6) & 1) === 1;
  for (let i = 9; i < 15; i++) {
    modules[14 - i][8] = ((fmt >> (14 - i)) & 1) === 1;
  }

  // Copy 2: bottom-left & top-right
  for (let i = 0; i < 7; i++) {
    modules[size - 1 - i][8] = ((fmt >> (14 - i)) & 1) === 1;
  }
  for (let i = 0; i < 8; i++) {
    modules[8][size - 8 + i] = ((fmt >> (7 - i)) & 1) === 1;
  }
}

function evaluatePenalty(modules: boolean[][], size: number): number {
  let penalty = 0;

  // Rule 1: 5+ consecutive same-color modules in row/col
  const checkLine = (getCell: (i: number) => boolean) => {
    let runColor = getCell(0);
    let runLen = 1;
    for (let i = 1; i < size; i++) {
      const c = getCell(i);
      if (c === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = c;
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  };

  for (let r = 0; r < size; r++) checkLine((c) => modules[r][c]);
  for (let c = 0; c < size; c++) checkLine((r) => modules[r][c]);

  // Rule 2: 2x2 same-color blocks
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const color = modules[r][c];
      if (
        modules[r][c + 1] === color &&
        modules[r + 1][c] === color &&
        modules[r + 1][c + 1] === color
      ) {
        penalty += 3;
      }
    }
  }

  // Rule 3: 1:1:3:1:1 finder-like ratio
  const checkFinderLike = (getCell: (i: number) => boolean) => {
    for (let i = 0; i <= size - 11; i++) {
      // Pattern 1: B W BBB W B WWWW or WWWW B W BBB W B
      const matchA =
        getCell(i) &&
        !getCell(i + 1) &&
        getCell(i + 2) &&
        getCell(i + 3) &&
        getCell(i + 4) &&
        !getCell(i + 5) &&
        getCell(i + 6) &&
        !getCell(i + 7) &&
        !getCell(i + 8) &&
        !getCell(i + 9) &&
        !getCell(i + 10);
      const matchB =
        !getCell(i) &&
        !getCell(i + 1) &&
        !getCell(i + 2) &&
        !getCell(i + 3) &&
        getCell(i + 4) &&
        !getCell(i + 5) &&
        getCell(i + 6) &&
        getCell(i + 7) &&
        getCell(i + 8) &&
        !getCell(i + 9) &&
        getCell(i + 10);
      if (matchA || matchB) penalty += 40;
    }
  };
  for (let r = 0; r < size; r++) checkFinderLike((c) => modules[r][c]);
  for (let c = 0; c < size; c++) checkFinderLike((r) => modules[r][c]);

  // Rule 4: dark ratio balance
  let darkCount = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) darkCount++;
    }
  }
  const percent = (darkCount * 100) / (size * size);
  const k = Math.floor(Math.abs(percent - 50) / 5);
  penalty += k * 10;

  return penalty;
}

export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);

  // Choose smallest Version (EC Level M) that holds payload
  let chosen = VERSION_SPECS_M[VERSION_SPECS_M.length - 1];
  for (const spec of VERSION_SPECS_M) {
    const headerBytes = spec.version <= 9 ? 2 : 3;
    const capacityBytes = spec.totalDataBytes - headerBytes;
    if (bytes.length <= capacityBytes) {
      chosen = spec;
      break;
    }
  }

  const maxPayload =
    chosen.totalDataBytes - (chosen.version <= 9 ? 2 : 3);
  const safeBytes =
    bytes.length > maxPayload ? bytes.slice(0, maxPayload) : bytes;

  const dataCodewords = encodeDataCodewords(safeBytes, chosen);
  const bitStream = buildFinalBitStream(dataCodewords, chosen);
  const { size, isFunction, modules: baseModules } = createFunctionGrid(chosen);

  // Place raw unmasked data bits in zig-zag order
  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let step = 0; step < size; step++) {
      const r = upward ? size - 1 - step : step;
      for (let dc = 0; dc < 2; dc++) {
        const c = right - dc;
        if (!isFunction[r][c]) {
          const bit = bitIdx < bitStream.length ? bitStream[bitIdx] === 1 : false;
          baseModules[r][c] = bit;
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }

  // Try all 8 mask patterns and select lowest penalty
  let bestMask = 0;
  let bestPenalty = Infinity;
  let bestGrid = baseModules;

  for (let mask = 0; mask < 8; mask++) {
    const candidate = baseModules.map((row) => [...row]);
    const maskFn = MASK_FUNCTIONS[mask];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!isFunction[r][c] && maskFn(r, c)) {
          candidate[r][c] = !candidate[r][c];
        }
      }
    }
    applyFormatBits(candidate, size, mask);
    const p = evaluatePenalty(candidate, size);
    if (p < bestPenalty) {
      bestPenalty = p;
      bestMask = mask;
      bestGrid = candidate;
    }
  }

  // Ensure format bits match bestMask
  applyFormatBits(bestGrid, size, bestMask);
  return bestGrid;
}
