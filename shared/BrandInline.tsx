import { AnsaLogo } from "./AnsaLogo";
import { wordmarkHeightForFontSize } from "./brandInlineSizing";

type BrandInlineProps = {
  height?: number;
  /** Match wordmark height to companion text `fontSize`. */
  fontSize?: number;
  className?: string;
};

/** Wordmark at inline copy size — use instead of typing “ansa” in UI. */
export function BrandInline({ height, fontSize, className }: BrandInlineProps) {
  const h = height ?? (fontSize !== undefined ? wordmarkHeightForFontSize(fontSize) : 14);
  return <AnsaLogo height={h} className={className ?? "brand-inline"} />;
}
