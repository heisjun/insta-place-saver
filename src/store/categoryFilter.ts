"use client";

import { PlaceCategory } from "@/lib/types";
import { create } from "zustand";

interface CategoryFilterState {
  selected: PlaceCategory | null; // null = 전체
  setSelected: (category: PlaceCategory | null) => void;
}

export const useCategoryFilter = create<CategoryFilterState>((set) => ({
  selected: null,
  setSelected: (category) => set({ selected: category }),
}));
