import { createClient } from "@/lib/supabase/server";

const BUCKET = "instagram-images";
const MAX_PARALLEL = 3;
const DOWNLOAD_TIMEOUT_MS = 15_000;

export interface UploadInput {
  url: string;
  shortcode: string;
  index: number;
}

export interface UploadResult {
  url: string;
  uploaded: boolean;
}

export async function uploadInstagramImages(
  inputs: UploadInput[],
  userId: string
): Promise<UploadResult[]> {
  const supabase = await createClient();
  const results: UploadResult[] = new Array(inputs.length);

  for (let i = 0; i < inputs.length; i += MAX_PARALLEL) {
    const batch = inputs.slice(i, i + MAX_PARALLEL);
    const settled = await Promise.all(
      batch.map(async (input) => uploadOne(supabase, input, userId))
    );
    settled.forEach((r, j) => {
      results[i + j] = r;
    });
  }

  return results;
}

async function uploadOne(
  supabase: Awaited<ReturnType<typeof createClient>>,
  { url, shortcode, index }: UploadInput,
  userId: string
): Promise<UploadResult> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
    if (!res.ok) return { url, uploaded: false };

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";

    const blob = await res.blob();
    const path = `${userId}/${shortcode}-${index}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, {
        contentType,
        upsert: true,
        cacheControl: "31536000",
      });

    if (error) {
      console.error("[storage] upload failed", path, error.message);
      return { url, uploaded: false };
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, uploaded: true };
  } catch (err) {
    console.error("[storage] fetch/upload error", err);
    return { url, uploaded: false };
  }
}
