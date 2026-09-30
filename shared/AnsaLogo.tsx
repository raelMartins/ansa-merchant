import { useId } from "react";

const VIEW_W = 300;
const VIEW_H = 66;
const ASPECT = VIEW_W / VIEW_H;

type AnsaLogoProps = {
  height: number;
  className?: string;
};

/**
 * Official ansa wordmark (raster source). Fill is `currentColor` — sage on light, linen on dark.
 * Replace `ansa-wordmark-source.png` when a path-based master SVG is available.
 */
export function AnsaLogo({ height, className }: AnsaLogoProps) {
  const maskId = useId().replace(/:/g, "");

  return (
    <svg
      className={className}
      width={height * ASPECT}
      height={height}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      fill="none"
      role="img"
      aria-label="ansa"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={VIEW_W} height={VIEW_H}>
          <image
            href="/brand/ansa-wordmark-source.png"
            width={VIEW_W}
            height={VIEW_H}
            preserveAspectRatio="xMidYMid meet"
          />
        </mask>
      </defs>
      <rect width={VIEW_W} height={VIEW_H} fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}
