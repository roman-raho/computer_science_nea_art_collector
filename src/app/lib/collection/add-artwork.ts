import { create } from "zustand";

type AddArtworkState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const useAddArtwork = create<AddArtworkState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () =>
    set((state) => ({
      isOpen: !state.isOpen,
    })),
}));
