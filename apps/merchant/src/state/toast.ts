import { create } from 'zustand';

export type ToastAction = { label: string; onPress: () => void };

type ToastState = {
  message: string | null;
  action: ToastAction | null;
  show: (message: string, action?: ToastAction) => void;
  hide: () => void;
};

let timer: ReturnType<typeof setTimeout> | undefined;

/** Long enough to read with glasses; longer when there is an undo button. */
const SHOW_MS = 5000;
const SHOW_WITH_ACTION_MS = 6500;

export const useToast = create<ToastState>((set) => ({
  message: null,
  action: null,
  show: (message, action) => {
    if (timer) clearTimeout(timer);
    set({ message, action: action ?? null });
    timer = setTimeout(() => set({ message: null, action: null }), action ? SHOW_WITH_ACTION_MS : SHOW_MS);
  },
  hide: () => {
    if (timer) clearTimeout(timer);
    set({ message: null, action: null });
  },
}));
