import { create } from "zustand";

type LoginModalState = {
  isOpen:
    | null
    | "login"
    | "signup"
    | "email-verif-signup"
    | "email-verif-login"
    | "forgot-password"
    | "email-verif-forgot-pass"
    | "new-password";
  open: () => void;
  close: () => void;
  toggle: () => void;
  switchToLogin: () => void;
  switchToSignup: () => void;
  switchToEmailVerifSignUp: () => void;
  switchToEmailVerifLogin: () => void;
  switchToEmailVerifPassword: () => void;
  switchToForgotPassword: () => void;
  switchToNewPassword: () => void;
  userCreated: any;
  setUserCreated: (user: any) => void;
  loginDetails: any;
  setLoginDetails: any;
  clearUserCreated: () => void;
  forgotEmail: string | null;
  setForgotEmail: (email: string | null) => void;
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
  switchToEmailVerifSignUp: () => set({ isOpen: "email-verif-signup" }),
  switchToEmailVerifLogin: () => set({ isOpen: "email-verif-login" }),
  switchToEmailVerifPassword: () => set({ isOpen: "email-verif-forgot-pass" }),
  switchToForgotPassword: () => set({ isOpen: "forgot-password" }),
  switchToNewPassword: () => set({ isOpen: "new-password" }),
  userCreated: null,
  setUserCreated: (user) => set({ userCreated: user }),
  loginDetails: null,
  setLoginDetails: (details: any) => set({ loginDetails: details }),
  clearUserCreated: () => set({ userCreated: null }),
  forgotEmail: null,
  setForgotEmail: (email: string | null) => set({ forgotEmail: email }),
}));
