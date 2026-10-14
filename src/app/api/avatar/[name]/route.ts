import { avatarContentType, readAvatarImage } from "@/lib/avatarImage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
): Promise<Response> {
  const { name } = await params;
  const buffer = await readAvatarImage(name);
  if (!buffer) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": avatarContentType(name),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
