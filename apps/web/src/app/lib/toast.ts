type ToastType = "success" | "error" | "info";
type Listener = (message: string, type: ToastType) => void;

let _listener: Listener | null = null;

export function subscribeToast(fn: Listener) {
  _listener = fn;
  return () => { _listener = null; };
}

export function toast(message: string, type: ToastType = "success") {
  _listener?.(message, type);
}
