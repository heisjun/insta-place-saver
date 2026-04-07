"use client";

import { Place, PlaceCategory } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const PLACES_KEY = (category?: PlaceCategory) =>
  category ? ["places", category] : ["places"];

// 목록 조회
export function usePlaces(category?: PlaceCategory) {
  return useQuery<Place[]>({
    queryKey: PLACES_KEY(category),
    queryFn: async () => {
      const url = category
        ? `/api/places?category=${encodeURIComponent(category)}`
        : "/api/places";
      const res = await fetch(url);
      if (!res.ok) throw new Error("장소 목록을 불러오지 못했습니다");
      return res.json();
    },
    staleTime: 30_000,   // 30초 내 재방문 시 캐시 즉시 표시
    gcTime: 5 * 60_000,  // 5분간 캐시 유지
  });
}

// 저장
export function useSavePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Omit<Place, "id" | "user_id" | "created_at" | "updated_at">) => {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "저장에 실패했습니다");
      }
      return res.json() as Promise<Place>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] });
    },
  });
}

// 수정 (낙관적 업데이트)
export function useUpdatePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Place> & { id: string }) => {
      const res = await fetch(`/api/places/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "수정에 실패했습니다");
      }
      return res.json() as Promise<Place>;
    },
    onMutate: async ({ id, ...updates }) => {
      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({ queryKey: ["places"] });

      // 현재 캐시 스냅샷 저장
      const previousQueriesData = queryClient.getQueriesData<Place[]>({ queryKey: ["places"] });

      // 모든 places 쿼리 캐시를 낙관적으로 업데이트
      queryClient.setQueriesData<Place[]>({ queryKey: ["places"] }, (old) =>
        old?.map((p) => (p.id === id ? { ...p, ...updates } : p)) ?? old
      );

      return { previousQueriesData };
    },
    onError: (_err, _vars, context) => {
      // 실패 시 롤백
      if (context?.previousQueriesData) {
        for (const [queryKey, data] of context.previousQueriesData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] });
    },
  });
}

// 삭제
export function useDeletePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/places/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "삭제에 실패했습니다");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] });
    },
  });
}
