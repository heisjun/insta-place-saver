import type { Metadata, Viewport } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import SupabaseProvider from "@/components/providers/SupabaseProvider";
import BottomNav from "@/components/layout/BottomNav";
import SplashScreen from "@/components/layout/SplashScreen";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Plaver",
  description: "인스타그램 맛집을 지도에 저장",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "맛집지도",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
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
  const session = user ? (await supabase.auth.getSession()).data.session : null;

  // 스플래시 표시 여부: 세션 쿠키가 없으면 첫 방문
  const cookieStore = await cookies();
  const splashShown = cookieStore.has("splash_shown");

  return (
    <html lang="ko" className="h-full overflow-hidden">
      <body className="h-full overflow-hidden bg-white text-gray-900">
        <SupabaseProvider initialSession={session}>
          <QueryProvider>
            {children}
            <BottomNav />
            <SplashScreen serverShowSplash={!splashShown} />
          </QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
