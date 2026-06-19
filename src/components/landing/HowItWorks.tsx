"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_COLORS = {
  맛집: "#EF4444",
  카페: "#8B5CF6",
  디저트: "#F59E0B",
  술집: "#3B82F6",
  기타: "#6B7280",
} as const;

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="mx-auto max-w-5xl px-5 pb-24 sm:pb-32"
      aria-labelledby="how-it-works-title"
    >
      <div className="mb-12 text-center sm:mb-16">
        <p className="mb-2 text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">
          How it works
        </p>
        <h2
          id="how-it-works-title"
          className="font-heading text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl"
        >
          어떻게 동작해요
        </h2>
      </div>

      <ol className="grid gap-5 sm:grid-cols-3 sm:gap-6">
        <StepCard
          step="01"
          title="URL 붙여넣기"
          description="인스타 게시글의 공유 링크를 입력해요."
        >
          <TypingUrlPreview active={inView} />
        </StepCard>
        <StepCard
          step="02"
          title="AI가 정보 추출"
          description="가게 이름·주소·카테고리를 자동으로 뽑아내요."
        >
          <ExtractCardPreview active={inView} />
        </StepCard>
        <StepCard
          step="03"
          title="지도에 저장"
          description="카테고리 색 핀으로 내 지도에 모여요."
        >
          <MapPinsPreview active={inView} />
        </StepCard>
      </ol>
    </section>
  );
}

interface StepCardProps {
  step: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function StepCard({ step, title, description, children }: StepCardProps) {
  return (
    <li className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <span className="font-heading text-lg font-bold tracking-tight text-gray-300 tabular-nums">
          {step}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-gray-200" />
      </div>
      <div className="flex h-44 items-center justify-center bg-gray-50/60 px-5">
        {children}
      </div>
      <div className="px-5 pt-4 pb-5">
        <h3 className="font-heading text-base font-semibold text-gray-950">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          {description}
        </p>
      </div>
    </li>
  );
}

// ─── 1단계: URL 타이핑 ────────────────────────────
function TypingUrlPreview({ active }: { active: boolean }) {
  const fullUrl = "instagram.com/p/CxYzAb1";
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!active) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(fullUrl.slice(0, i));
      if (i >= fullUrl.length) clearInterval(id);
    }, 55);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
        <span className="text-xs text-gray-400">https://</span>
        <span className="flex-1 truncate text-sm font-medium text-gray-900">
          {typed}
          <span
            className="ml-0.5 inline-block h-3.5 w-[2px] -translate-y-[1px] bg-gray-900 align-middle"
            style={{ animation: "ios-blade 0.9s steps(1) infinite" }}
          />
        </span>
      </div>
    </div>
  );
}

// ─── 2단계: 스켈레톤 → 추출 카드 ────────────────────
function ExtractCardPreview({ active }: { active: boolean }) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setFilled(true), 700);
    return () => clearTimeout(id);
  }, [active]);

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      {filled ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-1.5"
        >
          <p className="text-sm font-semibold text-gray-950">테라로사</p>
          <p className="text-xs text-gray-500">서울 성동구 성수동2가</p>
          <Badge
            variant="secondary"
            className="mt-0.5 w-fit border-0 px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${CATEGORY_COLORS.카페}1A`,
              color: CATEGORY_COLORS.카페,
            }}
          >
            카페
          </Badge>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      )}
    </div>
  );
}

// ─── 3단계: 지도에 핀 떨어지기 ───────────────────
type PinSpec = {
  category: keyof typeof CATEGORY_COLORS;
  top: string;
  left: string;
};
const PINS: PinSpec[] = [
  { category: "맛집", top: "22%", left: "32%" },
  { category: "카페", top: "55%", left: "20%" },
  { category: "디저트", top: "38%", left: "68%" },
  { category: "술집", top: "70%", left: "56%" },
  { category: "기타", top: "18%", left: "78%" },
];

function MapPinsPreview({ active }: { active: boolean }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
        backgroundSize: "14px 14px",
      }}
    >
      {PINS.map((pin, i) => (
        <motion.div
          key={pin.category}
          initial={{ opacity: 0, y: -18, scale: 0.8 }}
          animate={active ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{
            duration: 0.45,
            delay: 0.3 + i * 0.12,
            type: "spring",
            stiffness: 320,
            damping: 18,
          }}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ top: pin.top, left: pin.left }}
        >
          <MapPin
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
            size={22}
            strokeWidth={2.4}
            color={CATEGORY_COLORS[pin.category]}
            fill={CATEGORY_COLORS[pin.category]}
            fillOpacity={0.18}
          />
        </motion.div>
      ))}
    </div>
  );
}
