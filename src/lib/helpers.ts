import { useAppStore } from "@/app/store";

export function dispatchError(err: unknown, fallback: string) {
  useAppStore.getState().setError(err instanceof Error ? err.message : fallback);
}
