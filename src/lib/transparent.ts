import sharp from "sharp";

const BACKGROUND_DISTANCE = 55;

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function sampleBackground(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): { r: number; g: number; b: number } {
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const [x, y] of corners) {
    const i = (y * width + x) * channels;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return { r: r / corners.length, g: g / corners.length, b: b / corners.length };
}

function floodFillBackground(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  background: { r: number; g: number; b: number },
): void {
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue: number[] = [];

  const matches = (index: number): boolean => {
    const i = index * channels;
    return (
      colorDistance(data[i], data[i + 1], data[i + 2], background.r, background.g, background.b) <=
      BACKGROUND_DISTANCE
    );
  };

  const enqueue = (index: number): void => {
    if (visited[index]) return;
    if (!matches(index)) return;
    visited[index] = 1;
    queue.push(index);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (queue.length > 0) {
    const index = queue.pop() as number;
    const x = index % width;
    const y = (index - x) / width;
    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y < height - 1) enqueue(index + width);
  }

  for (let index = 0; index < total; index += 1) {
    if (visited[index]) {
      data[index * channels + 3] = 0;
    }
  }
}

export async function makeTransparent(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const background = sampleBackground(data, width, height, channels);
  floodFillBackground(data, width, height, channels, background);
  return sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}
