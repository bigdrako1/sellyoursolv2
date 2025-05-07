
import { toast as sonnerToast } from "sonner";

type ToastType = "default" | "success" | "error" | "warning" | "info";

interface ToastOptions {
  description?: string;
  duration?: number;
  dismissible?: boolean;
  style?: React.CSSProperties;
}

/**
 * Standardized toast notification service
 * Provides a unified interface for displaying toast notifications
 * across the application using the sonner library
 */
export const toast = {
  /**
   * Shows a default toast notification
   * @param message The main message to display
   * @param options Additional toast options
   */
  show: (message: string, options?: ToastOptions) => {
    sonnerToast(message, {
      ...options,
    });
  },

  /**
   * Shows a success toast notification
   * @param message The success message to display
   * @param options Additional toast options
   */
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      ...options,
    });
  },

  /**
   * Shows an error toast notification
   * @param message The error message to display
   * @param options Additional toast options
   */
  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      ...options,
    });
  },

  /**
   * Shows a warning toast notification
   * @param message The warning message to display
   * @param options Additional toast options
   */
  warning: (message: string, options?: ToastOptions) => {
    sonnerToast(message, {
      ...options,
      style: options?.style || { backgroundColor: "hsl(var(--warning))", color: "hsl(var(--warning-foreground))" },
    });
  },

  /**
   * Shows an info toast notification
   * @param message The information message to display
   * @param options Additional toast options
   */
  info: (message: string, options?: ToastOptions) => {
    sonnerToast(message, {
      ...options,
      style: options?.style || { backgroundColor: "hsl(var(--info))", color: "hsl(var(--info-foreground))" },
    });
  },

  /**
   * Shows a destructive/danger toast notification
   * @param message The destructive message to display
   * @param options Additional toast options
   */
  destructive: (message: string, options?: ToastOptions) => {
    sonnerToast(message, {
      ...options,
      style: options?.style || { backgroundColor: "hsl(var(--destructive))", color: "white" },
    });
  },
};
