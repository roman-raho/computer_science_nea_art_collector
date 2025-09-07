import { create } from "zustand";

type LoginModalState = {
  isOpen: null | "login" | "signup" | "email-verif";
  open: () => void;
  close: () => void;
  toggle: () => void;
  switchToLogin: () => void;
  switchToSignup: () => void;
  switchToEmailVerif: () => void;
  userCreated: object | null;
  setUserCreated: (user: object) => void;
  clearUserCreated: () => void;
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
  switchToEmailVerif: () => set({ isOpen: "email-verif" }),
  userCreated: null,
  setUserCreated: (user) => set({ userCreated: user }),
  clearUserCreated: () => set({ userCreated: null }),
}));
