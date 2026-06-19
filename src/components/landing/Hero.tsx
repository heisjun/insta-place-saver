"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STAGGER = 0.07;
const RISE = { opacity: 0, y: 12 };
const RISE_IN = { opacity: 1, y: 0 };

export default function Hero() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const trimmed = url.trim();
  const canSubmit = trimmed.length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    router.push(`/add?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <section className="relative isolate overflow-hidden bg-white">
      {/* dot pattern background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.45) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)",
        }}
      />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-6 sm:pt-8">
        <span className="text-base font-bold tracking-tight">Plaver</span>
        <Link
          href="/login"
          className="text-sm font-medium text-gray-700 underline-offset-4 hover:underline"
        >
          로그인
        </Link>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pt-16 pb-24 text-center sm:pt-24 sm:pb-32">
        <motion.p
          initial={RISE}
          animate={RISE_IN}
          transition={{ duration: 0.45, delay: 0 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs font-medium tracking-wide text-gray-600 backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
          인스타 → 카카오맵 자동 저장
        </motion.p>

        <motion.h1
          initial={RISE}
          animate={RISE_IN}
          transition={{ duration: 0.5, delay: STAGGER }}
          className="font-heading text-[clamp(2.25rem,7vw,4.5rem)] leading-[1.05] font-bold tracking-[-0.04em] text-gray-950"
        >
          인스타에서 본 그 가게,
          <br />
          <span className="relative inline-block">
            <span className="relative z-10">지도에 옮겨 담아요.</span>
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-[#F59E0B]/70 sm:bottom-2 sm:h-4"
            />
          </span>
        </motion.h1>

        <motion.p
          initial={RISE}
          animate={RISE_IN}
          transition={{ duration: 0.5, delay: STAGGER * 2 }}
          className="mt-6 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg"
        >
          게시글 URL만 붙여넣으면 AI가 가게 이름·주소·카테고리를 뽑아
          개인 지도에 핀으로 저장해요. <span className="font-medium text-gray-900">로그인 없이 먼저 확인</span>해보세요.
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          initial={RISE}
          animate={RISE_IN}
          transition={{ duration: 0.5, delay: STAGGER * 3 }}
          className="mt-10 w-full max-w-xl"
        >
          <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_1px_0_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.18)] sm:flex-row sm:gap-1 sm:p-1.5">
            <label htmlFor="hero-url" className="sr-only">
              인스타그램 게시글 URL
            </label>
            <Input
              id="hero-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className={cn(
                "h-12 flex-1 border-0 bg-transparent px-4 text-base shadow-none focus-visible:ring-0 sm:text-base",
              )}
            />
            <Button
              type="submit"
              disabled={!canSubmit}
              className="group h-12 rounded-xl px-5 text-base font-semibold disabled:opacity-40"
            >
              가게 찾기
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-enabled:group-hover:translate-x-0.5" />
            </Button>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            결과는 즉시 화면에서 확인 — 저장할 때만 로그인이 필요해요.
          </p>
        </motion.form>
      </div>
    </section>
  );
}
