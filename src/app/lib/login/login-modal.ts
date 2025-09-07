import { create } from "zustand";

type LoginModalState = {
  isOpen: null | "login" | "signup";
  open: () => void;
  close: () => void;
  toggle: () => void;
  switchToLogin: () => void;
  switchToSignup: () => void;
};

export const useLoginModal = create<LoginModalState>((set) => ({
  isOpen: null,
  open: () => set({ isOpen: "login" }),
  close: () => set({ isOpen: null }),
  toggle: () =>
    set((state) => ({
      isOpen: state.isOpen ? null : "login",
    })),
  switchToLogin: () => set({ isOpen: "login" }),
  switchToSignup: () => set({ isOpen: "signup" }),
}));
