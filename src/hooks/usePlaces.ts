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

// 수정
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
    onSuccess: () => {
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
