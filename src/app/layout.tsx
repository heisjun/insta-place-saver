import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import SupabaseProvider from "@/components/providers/SupabaseProvider";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "InstaPlaceSaver",
  description: "인스타그램 맛집을 지도에 저장",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // getUser()는 서버에서 세션을 직접 검증 — getSession()보다 안전
  const session = user
    ? (await supabase.auth.getSession()).data.session
    : null;

  return (
    <html lang="ko" className="h-full">
      <body className="h-full bg-white text-gray-900">
        <SupabaseProvider initialSession={session}>
          <QueryProvider>{children}</QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
