"use client";

import { useAddModal } from "@/store/addModal";
import { extractInstagramUrl } from "@/lib/instagram";
import { useRouter } from "next/navigation";

export default function ClipboardAddModal() {
  const { open, closeModal } = useAddModal();
  const router = useRouter();

  if (!open) return null;

  async function handleClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      const url = extractInstagramUrl(text);
      if (url) {
        closeModal();
        router.push(`/add?url=${encodeURIComponent(url)}`);
        return;
      }
    } catch {
      // 권한 거부 또는 미지원
    }
    // 클립보드에 인스타 URL 없음 → 직접 입력 페이지로
    closeModal();
    router.push("/add");
  }

  function handleManual() {
    closeModal();
    router.push("/add");
  }

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={closeModal}
      />
      {/* 모달 카드 */}
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-3rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xl">📋</span>
          <p className="text-base font-bold text-gray-900">복사한 링크 등록하기</p>
        </div>
        <p className="mb-6 text-sm text-gray-500">
          인스타그램에서 복사한 링크를 바로 저장할 수 있어요
        </p>
        <button
          onClick={handleClipboard}
          className="mb-2 h-12 w-full rounded-xl bg-black text-sm font-semibold text-white"
        >
          복사한 링크로 등록하기
        </button>
        <button
          onClick={handleManual}
          className="h-10 w-full text-sm text-gray-400"
        >
          직접 입력할게요
        </button>
      </div>
    </>
  );
}
