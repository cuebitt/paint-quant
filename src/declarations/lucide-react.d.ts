import type { LucideProps } from "lucide-react";

declare module "lucide-react" {
  interface LucideProps {
    className?: string;
    style?: Preact.JSX.CSSProperties;
  }
}
