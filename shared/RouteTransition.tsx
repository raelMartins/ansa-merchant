import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

/** Top-level routes (auth, storefront, landing) without a shared layout. */
export function RouteTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="page-stage page-stage--root" key={pathname}>
      <div className="page-enter">{children}</div>
    </div>
  );
}
