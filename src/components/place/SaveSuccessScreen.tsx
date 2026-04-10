"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Props {
  savedCount: number;
  onContinue: () => void;
}

export default function SaveSuccessScreen({ savedCount, onContinue }: Props) {
  const router = useRouter();
  const success = savedCount > 0;

  return (
    <div className="flex flex-col items-center justify-center gap-7 pt-20 text-center">

      {/* 아이콘 */}
      <div className="relative flex items-center justify-center">
        {/* 펄스 링 — 성공 시 한 번 퍼지고 사라짐 */}
        {success && (
          <motion.span
            className="absolute inline-flex h-20 w-20 rounded-full bg-black"
            initial={{ scale: 1, opacity: 0.35 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
          />
        )}

        {/* 원 */}
        <motion.div
          className={`relative flex h-20 w-20 items-center justify-center rounded-full ${
            success ? "bg-black" : "bg-gray-100"
          }`}
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.05 }}
        >
          {success ? (
            /* 체크마크 SVG — pathLength 드로우 */
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <motion.path
                d="M9 19.5l7.5 7.5 12.5-15"
                stroke="white"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.38, delay: 0.32, ease: "easeOut" }}
              />
            </svg>
          ) : (
            /* X 마크 */
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <motion.path
                d="M10 10l14 14M24 10L10 24"
                stroke="#9ca3af"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.25, ease: "easeOut" }}
              />
            </svg>
          )}
        </motion.div>
      </div>

      {/* 텍스트 */}
      <div className="flex flex-col gap-2">
        <motion.p
          className="text-xl font-bold text-gray-900"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.38, ease: "easeOut" }}
        >
          {success ? "지도에 저장했어요" : "저장하지 않았어요"}
        </motion.p>

        <motion.p
          className="text-sm text-gray-400"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.36, ease: "easeOut" }}
        >
          {success
            ? `${savedCount}개 장소가 지도에 추가됐어요`
            : "모든 장소를 건너뛰었어요"}
        </motion.p>
      </div>

      {/* 버튼 */}
      <motion.div
        className="flex w-full flex-col gap-2.5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.76, duration: 0.36, ease: "easeOut" }}
      >
        {success && (
          <button
            onClick={() => router.push("/map")}
            className="h-12 w-full rounded-xl bg-black text-sm font-medium text-white active:opacity-80"
          >
            지도에서 보기
          </button>
        )}
        <button
          onClick={onContinue}
          className={`h-12 w-full rounded-xl border text-sm font-medium active:opacity-70 ${
            success
              ? "border-gray-200 bg-white text-gray-600"
              : "border-transparent bg-black text-white"
          }`}
        >
          {success ? "계속 추가하기" : "다시 시작하기"}
        </button>
      </motion.div>
    </div>
  );
}
