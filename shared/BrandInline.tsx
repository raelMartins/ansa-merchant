import { AnsaLogo } from "./AnsaLogo";

type BrandInlineProps = {
  height?: number;
  className?: string;
};

/** Wordmark at inline copy size — use instead of typing “ansa” in UI. */
export function BrandInline({ height = 14, className }: BrandInlineProps) {
  return <AnsaLogo height={height} className={className ?? "brand-inline"} />;
}
