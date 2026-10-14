export type ComicGenerator = (input: Buffer) => Promise<Buffer>;

export async function getComicGenerator(): Promise<ComicGenerator | null> {
  const { comicGenerator } = await import("./comicProvider");
  return comicGenerator;
}
