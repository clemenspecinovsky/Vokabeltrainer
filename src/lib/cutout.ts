import { removeBackground } from "@imgly/background-removal-node";
import { makeTransparent } from "@/lib/transparent";

function sniffMime(input: Buffer): string {
  if (input.length >= 4 && input[0] === 0x89 && input[1] === 0x50 && input[2] === 0x4e && input[3] === 0x47) {
    return "image/png";
  }
  if (
    input.length >= 12 &&
    input.toString("ascii", 0, 4) === "RIFF" &&
    input.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return "image/jpeg";
}

export async function removeImageBackground(input: Buffer): Promise<Buffer> {
  try {
    const blob = new Blob([input], { type: sniffMime(input) });
    const result = await removeBackground(blob, {
      model: "small",
      output: { format: "image/png" },
    });
    const buffer = Buffer.from(await result.arrayBuffer());
    if (buffer.length < 1000) {
      throw new Error("background removal returned an empty image");
    }
    return buffer;
  } catch (error) {
    console.error("background removal failed, using keying fallback", error);
    return makeTransparent(input);
  }
}
