// hooks/use-toast.ts
import { toast } from "sonner";

export function useToast() {
  return {
    toast,
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast(message),
  };
}
