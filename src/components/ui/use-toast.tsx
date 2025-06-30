import { useCallback } from "react";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  [key: string]: any;
}

// Simple toast state management
let toastList: ToastProps[] = [];
let listeners: (() => void)[] = [];

const addToast = (props: Omit<ToastProps, "id">) => {
  const id = Math.random().toString(36).substr(2, 9);
  const toast = { ...props, id };
  toastList = [...toastList, toast];
  listeners.forEach((listener) => listener());

  // Auto remove after 5 seconds
  setTimeout(() => {
    toastList = toastList.filter((t) => t.id !== id);
    listeners.forEach((listener) => listener());
  }, 5000);
};

const removeToast = (id: string) => {
  toastList = toastList.filter((t) => t.id !== id);
  listeners.forEach((listener) => listener());
};

export function useToast() {
  const toast = useCallback((props: Omit<ToastProps, "id">) => {
    addToast(props);
  }, []);

  return {
    toast,
    toasts: toastList,
    dismiss: removeToast,
  };
}
