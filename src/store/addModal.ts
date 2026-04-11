"use client";

import { create } from "zustand";

interface AddModalState {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useAddModal = create<AddModalState>((set) => ({
  open: false,
  openModal: () => set({ open: true }),
  closeModal: () => set({ open: false }),
}));
