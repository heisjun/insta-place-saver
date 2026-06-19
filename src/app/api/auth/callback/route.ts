import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/map";
  // open redirect 방지 — 내부 경로만 허용 ("/foo" OK, "//evil.com" 차단)
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/map";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 인증 실패 시 로그인 페이지로 (에러 표시)
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
