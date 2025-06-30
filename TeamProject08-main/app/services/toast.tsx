import { toast } from "sonner";

export function successToast(message: string) {
  toast.success(message, {
    className: "!rounded-xl !py-2",
  });
}

export function warningToast(message: string) {
  toast.warning(message, {
    className: "!rounded-xl !py-2",
  });
}

export function errorToast(message: string) {
  toast.error(message, {
    className: "!rounded-xl !py-2",
  });
}
