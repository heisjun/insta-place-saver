"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginContent() {
  const [loading, setLoading] = useState<"kakao" | "google" | null>(null);
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "auth_failed";
  const supabase = createClient();

  async function signIn(provider: "kakao" | "google") {
    setLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/api/auth/callback`,
      },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      {/* 인증 실패 에러 */}
      {hasError && (
        <div className="mb-6 w-full max-w-xs rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          로그인에 실패했습니다. 다시 시도해주세요.
        </div>
      )}

      {/* 로고 */}
      <div className="mb-12 text-center">
        <img src="/logo.svg" alt="Plaver" className="mx-auto mb-4 w-44" />
        <p className="text-sm text-gray-500">
          인스타그램 맛집을 지도에 저장하세요
        </p>
      </div>

      {/* 로그인 버튼 */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        {/* 카카오 로그인 */}
        <button
          onClick={() => signIn("kakao")}
          disabled={loading !== null}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] font-medium text-[#191919] transition-opacity disabled:opacity-60"
        >
          {loading === "kakao" ? (
            <span className="text-sm">로그인 중...</span>
          ) : (
            <>
              <KakaoIcon />
              <span className="text-sm">카카오로 로그인</span>
            </>
          )}
        </button>

        {/* 구글 로그인 */}
        <button
          onClick={() => signIn("google")}
          disabled={loading !== null}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          {loading === "google" ? (
            <span className="text-sm">로그인 중...</span>
          ) : (
            <>
              <GoogleIcon />
              <span className="text-sm">Google로 로그인</span>
            </>
          )}
        </button>
      </div>
    </main>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1C4.582 1 1 3.896 1 7.455c0 2.26 1.453 4.244 3.643 5.378L3.8 16.1a.3.3 0 0 0 .44.326L8.1 13.87c.295.028.596.043.9.043 4.418 0 8-2.895 8-6.456C17 3.896 13.418 1 9 1Z"
        fill="#191919"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
