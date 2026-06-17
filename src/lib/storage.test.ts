import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// supabase server client는 cookies()에 의존하므로 모킹 필수
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { uploadInstagramImages } from "./storage";
import { createClient } from "@/lib/supabase/server";

interface MockUploadCall {
  path: string;
  contentType: string;
}

function makeMockSupabase(opts: {
  uploadError?: (path: string) => string | null;
  publicUrlFor?: (path: string) => string;
}) {
  const calls: MockUploadCall[] = [];

  const upload = vi.fn(async (path: string, _blob: Blob, options: { contentType: string }) => {
    calls.push({ path, contentType: options.contentType });
    const err = opts.uploadError?.(path);
    return { error: err ? { message: err } : null };
  });

  const getPublicUrl = vi.fn((path: string) => ({
    data: { publicUrl: opts.publicUrlFor?.(path) ?? `https://test.supabase.co/${path}` },
  }));

  return {
    client: {
      storage: {
        from: vi.fn(() => ({ upload, getPublicUrl })),
      },
    },
    calls,
  };
}

function makeFetchResponse(opts: {
  ok: boolean;
  contentType?: string;
}): Response {
  return new Response(opts.ok ? new Blob(["x"]) : "", {
    status: opts.ok ? 200 : 404,
    headers: opts.contentType ? { "content-type": opts.contentType } : undefined,
  });
}

describe("uploadInstagramImages", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("빈 입력에는 빈 배열을 반환한다 (불변식)", async () => {
    const { client } = makeMockSupabase({});
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await uploadInstagramImages([], "user-1");
    expect(result).toEqual([]);
  });

  it("입력 순서가 출력 순서로 보존된다 (계약)", async () => {
    const { client } = makeMockSupabase({
      publicUrlFor: (path) => `https://cdn/${path}`,
    });
    vi.mocked(createClient).mockResolvedValue(client as never);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => makeFetchResponse({ ok: true, contentType: "image/jpeg" }))
    );

    const inputs = [
      { url: "a.jpg", shortcode: "XYZ", index: 0 },
      { url: "b.jpg", shortcode: "XYZ", index: 1 },
      { url: "c.jpg", shortcode: "XYZ", index: 2 },
      { url: "d.jpg", shortcode: "XYZ", index: 3 },
      { url: "e.jpg", shortcode: "XYZ", index: 4 },
    ];
    const result = await uploadInstagramImages(inputs, "user-1");

    expect(result).toHaveLength(5);
    expect(result.map((r) => r.url)).toEqual([
      "https://cdn/user-1/XYZ-0.jpg",
      "https://cdn/user-1/XYZ-1.jpg",
      "https://cdn/user-1/XYZ-2.jpg",
      "https://cdn/user-1/XYZ-3.jpg",
      "https://cdn/user-1/XYZ-4.jpg",
    ]);
  });

  it("RLS 정책과 일치하는 경로 형식으로 업로드한다 (계약)", async () => {
    const { client, calls } = makeMockSupabase({});
    vi.mocked(createClient).mockResolvedValue(client as never);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => makeFetchResponse({ ok: true, contentType: "image/jpeg" }))
    );

    await uploadInstagramImages(
      [{ url: "x.jpg", shortcode: "ABC123", index: 2 }],
      "user-uuid"
    );

    // storage RLS: (storage.foldername(name))[1] = auth.uid()
    // → 경로 첫 폴더가 반드시 user_id 와 일치해야 함
    expect(calls[0].path).toBe("user-uuid/ABC123-2.jpg");
  });

  it("content-type에 따라 확장자를 결정한다", async () => {
    const { client, calls } = makeMockSupabase({});
    vi.mocked(createClient).mockResolvedValue(client as never);

    const cases = [
      { contentType: "image/png", expectedExt: "png" },
      { contentType: "image/webp", expectedExt: "webp" },
      { contentType: "image/jpeg", expectedExt: "jpg" },
      { contentType: "image/gif", expectedExt: "jpg" }, // 기본값
    ];

    for (let i = 0; i < cases.length; i++) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => makeFetchResponse({ ok: true, contentType: cases[i].contentType }))
      );
      await uploadInstagramImages([{ url: "x", shortcode: "S", index: i }], "u");
    }

    cases.forEach((c, i) => {
      expect(calls[i].path).toBe(`u/S-${i}.${c.expectedExt}`);
    });
  });

  it("다운로드 실패 시 원본 URL을 반환한다 (graceful fallback 약속)", async () => {
    const { client } = makeMockSupabase({});
    vi.mocked(createClient).mockResolvedValue(client as never);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => makeFetchResponse({ ok: false }))
    );

    const result = await uploadInstagramImages(
      [{ url: "original-cdn-url.jpg", shortcode: "S", index: 0 }],
      "u"
    );

    expect(result[0]).toEqual({ url: "original-cdn-url.jpg", uploaded: false });
  });

  it("업로드 실패 시 원본 URL을 반환한다 (graceful fallback 약속)", async () => {
    const { client } = makeMockSupabase({
      uploadError: () => "permission denied",
    });
    vi.mocked(createClient).mockResolvedValue(client as never);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => makeFetchResponse({ ok: true, contentType: "image/jpeg" }))
    );

    const result = await uploadInstagramImages(
      [{ url: "original.jpg", shortcode: "S", index: 0 }],
      "u"
    );

    expect(result[0]).toEqual({ url: "original.jpg", uploaded: false });
  });

  it("일부 실패가 다른 입력의 처리에 영향을 주지 않는다 (격리 약속)", async () => {
    const { client } = makeMockSupabase({
      publicUrlFor: (path) => `https://cdn/${path}`,
    });
    vi.mocked(createClient).mockResolvedValue(client as never);

    // 2번 인덱스만 다운로드 실패
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const shouldFail = callCount === 2;
        callCount += 1;
        return makeFetchResponse({
          ok: !shouldFail,
          contentType: "image/jpeg",
        });
      })
    );

    const inputs = [
      { url: "orig-0", shortcode: "S", index: 0 },
      { url: "orig-1", shortcode: "S", index: 1 },
      { url: "orig-2", shortcode: "S", index: 2 },
      { url: "orig-3", shortcode: "S", index: 3 },
    ];
    const result = await uploadInstagramImages(inputs, "u");

    expect(result[0]).toMatchObject({ uploaded: true });
    expect(result[1]).toMatchObject({ uploaded: true });
    expect(result[2]).toEqual({ url: "orig-2", uploaded: false });
    expect(result[3]).toMatchObject({ uploaded: true });
  });
});
