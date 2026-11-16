import { create } from "zustand";

/** Short-lived "open this place" requests from one component to another. Not saved. */
export type OpenTarget = "fax" | "pc" | "phone-mail" | "phone-diary";
interface UiState {
  request: { target: OpenTarget; n: number } | null;
  open: (target: OpenTarget) => void;
  clear: () => void;
}
let counter = 0;
export const useUi = create<UiState>((set) => ({
  request: null,
  open: (target) => set({ request: { target, n: ++counter } }),
  clear: () => set({ request: null }),
}));
