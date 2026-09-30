import { Outlet, useLocation } from "react-router-dom";

/** Dashboard (and nested) routes: soft enter on each navigation. */
export function AnimatedOutlet() {
  const { pathname } = useLocation();

  return (
    <div className="page-stage" key={pathname}>
      <div className="page-enter">
        <Outlet />
      </div>
    </div>
  );
}
