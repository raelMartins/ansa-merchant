import { WORDMARK_ASPECT, WORDMARK_PATH, WORDMARK_VIEW_BOX } from "./brand/wordmarkGeometry";

type AnsaLogoProps = {
  height: number;
  className?: string;
};

/** Official ansa wordmark. Tint via `currentColor` (forest on light, linen on dark). */
export function AnsaLogo({ height, className }: AnsaLogoProps) {
  return (
    <svg
      className={className}
      width={height * WORDMARK_ASPECT}
      height={height}
      viewBox={WORDMARK_VIEW_BOX}
      fill="currentColor"
      role="img"
      aria-label="ansa"
    >
      <path fillRule="evenodd" d={WORDMARK_PATH} />
    </svg>
  );
}
