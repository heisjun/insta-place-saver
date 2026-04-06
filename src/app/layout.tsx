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
    data: { session },
  } = await supabase.auth.getSession();

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
