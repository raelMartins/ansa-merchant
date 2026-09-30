import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "../shared/api";
import { ItemImage, Wordmark } from "../shared/ui";
import { MerchantProvider, useMerchant } from "./context";

const NAV: { to: string; label: string; end?: boolean; section?: string }[] = [
  { to: "/dashboard", label: "Overview", end: true, section: "Shop" },
  { to: "/dashboard/products", label: "Products" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/customers", label: "Customers" },
  { to: "/dashboard/storefront", label: "Storefront", section: "Sell everywhere" },
  { to: "/dashboard/social", label: "Social / Publish" },
  { to: "/dashboard/whatsapp", label: "WhatsApp" },
  { to: "/dashboard/settings", label: "Settings", section: "Account" },
];

const TABS = [
  { to: "/dashboard", label: "Home", end: true },
  { to: "/dashboard/products", label: "Products" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/whatsapp", label: "WhatsApp" },
  { to: "/dashboard/settings", label: "More" },
];

type Theme = "dark" | "light";

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("ansa.theme") as Theme) || "dark");
  useEffect(() => {
    localStorage.setItem("ansa.theme", theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))];
}

function Sidebar({ theme, toggleTheme, onNavigate }: { theme: Theme; toggleTheme: () => void; onNavigate?: () => void }) {
  const { shop } = useMerchant();
  const nav = useNavigate();
  return (
    <aside className="m-side" onClick={(e) => e.stopPropagation()}>
      <div className="m-side-brand">
        <Wordmark size={24} tag="shop" />
      </div>
      <nav className="m-nav">
        {NAV.map((n) => (
          <div key={n.to}>
            {n.section ? <div className="m-nav-section">{n.section}</div> : null}
            <NavLink to={n.to} end={n.end} className={({ isActive }) => (isActive ? "active" : "")} onClick={onNavigate}>
              <span className="nav-dot" />
              {n.label}
            </NavLink>
          </div>
        ))}
      </nav>
      <div className="m-side-foot">
        <a className="m-shop-chip" href={`/shop/${shop.slug}`} target="_blank" rel="noreferrer">
          <span className="avatar">
            <ItemImage src={shop.logoUrl} alt={shop.name} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span className="cell-title" style={{ display: "block" }}>
              {shop.name}
            </span>
            <span className="cell-sub">View storefront ↗</span>
          </span>
        </a>
        <div className="spread">
          <button className="btn btn-ghost btn-sm" type="button" onClick={toggleTheme}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={async () => {
              await signOut();
              nav("/signin");
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

function Shell() {
  const [theme, toggleTheme] = useTheme();
  const [drawer, setDrawer] = useState(false);
  const loc = useLocation();
  useEffect(() => setDrawer(false), [loc.pathname]);

  return (
    <div className={`app-root theme-${theme}`}>
      <div className="m-mobilebar">
        <Wordmark size={20} tag="shop" />
        <button className="icon-btn" type="button" aria-label="Menu" onClick={() => setDrawer(true)}>
          ≡
        </button>
      </div>
      {drawer ? (
        <div className="m-drawer" onClick={() => setDrawer(false)}>
          <Sidebar theme={theme} toggleTheme={toggleTheme} onNavigate={() => setDrawer(false)} />
        </div>
      ) : null}
      <div className="m-shell">
        <Sidebar theme={theme} toggleTheme={toggleTheme} />
        <main className="m-main">
          <Outlet />
        </main>
      </div>
      <nav className="m-tabbar">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? "active" : "")}>
            <span />
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function MerchantLayout() {
  return (
    <MerchantProvider>
      <Shell />
    </MerchantProvider>
  );
}

export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string;
  title: string;
  sub?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="m-top">
      <div className="m-top-titles">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {sub ? <p className="text-2">{sub}</p> : null}
      </div>
      {actions ? <div className="m-top-actions">{actions}</div> : null}
    </header>
  );
}
