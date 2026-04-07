"use client";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (session === null) {
      router.replace("/login");
    }
  }, [session, router]);

  // 세션 확인 전 또는 미인증 상태면 아무것도 렌더링하지 않음
  if (!session) return null;

  return <>{children}</>;
}
