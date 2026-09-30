import { Link, useSearchParams } from "react-router-dom";
import { api } from "../shared/api"
import { meMerchant } from "../shared/merchantPath";
import { formatNaira, timeAgo, type ActivityEvent, type CatalogItem, type Integration, type Order } from "../shared/types";
import { AsyncView } from "../shared/AsyncView";
import { ItemImage, MockBadge, OrderStatusPill, PaymentPill, copyText, useToast } from "../shared/ui";
import { useLoad, useMerchant } from "./context";
import { PageHeader } from "./Layout";

type OverviewData = {
  salesKobo: number;
  orders: number;
  paidOrders: number;
  products: number;
  published: number;
  lowStock: number;
  recentOrders: Order[];
};

export function OverviewPage() {
  const { shop } = useMerchant();
  const toast = useToast();
  const [params] = useSearchParams();
  const welcome = params.get("welcome") === "1";
  const { data, error, loading, busy, reload } = useLoad(async () => {
    const [overview, activity, products, integrations] = await Promise.all([
      api<OverviewData>(meMerchant("/overview")),
      api<{ events: ActivityEvent[] }>(meMerchant("/activity")),
      api<{ products: CatalogItem[] }>(meMerchant("/products")),
      api<{ integrations: Integration[] }>(meMerchant("/integrations")),
    ]);
    return { overview, events: activity.events, products: products.products, integrations: integrations.integrations };
  });

  const storeUrl = `${window.location.origin}/shop/${shop.slug}`;

  return (
    <AsyncView loading={loading} busy={busy} data={data} error={error} onRetry={() => void reload()} label="Loading overview…">
      {data ? <OverviewContent data={data} shop={shop} welcome={welcome} storeUrl={storeUrl} toast={toast} /> : null}
    </AsyncView>
  );
}

function OverviewContent({
  data,
  shop,
  welcome,
  storeUrl,
  toast,
}: {
  data: {
    overview: OverviewData;
    events: ActivityEvent[];
    products: CatalogItem[];
    integrations: Integration[];
  };
  shop: ReturnType<typeof useMerchant>["shop"];
  welcome: boolean;
  storeUrl: string;
  toast: ReturnType<typeof useToast>;
}) {
  const { overview, events, products, integrations } = data;
  const lowStock = products.filter((p) => p.kind === "product" && p.status !== "archived" && p.qtyAvailable <= 3);
  const connected = integrations.filter((i) => i.status === "connected").length;
  const setup = [
    { done: Boolean(shop.logoUrl), label: "Add a logo", to: "/dashboard/settings" },
    { done: overview.published > 0, label: "Publish your first item", to: "/dashboard/products/new" },
    { done: integrations.some((i) => i.channel === "whatsapp" && i.status === "connected"), label: "Connect WhatsApp", to: "/dashboard/whatsapp" },
    { done: overview.orders > 0, label: "Share your link and get an order", to: "/dashboard/storefront" },
  ];
  const setupLeft = setup.filter((s) => !s.done);

  return (
    <div className="stack" style={{ gap: 22 }}>
      <PageHeader
        eyebrow={welcome ? "your shop is live" : new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
        title={welcome ? `Welcome to ansa, ${shop.name}` : `Good to see you, ${shop.name}`}
        actions={
          <>
            <button
              className="btn btn-outline"
              type="button"
              onClick={async () => toast((await copyText(storeUrl)) ? "Storefront link copied" : "Couldn't copy", "ok")}
            >
              Copy shop link
            </button>
            <Link className="btn btn-sand" to="/dashboard/products/new">
              + Add item
            </Link>
          </>
        }
      />

      {setupLeft.length > 0 ? (
        <div className="card" style={{ borderColor: "color-mix(in srgb, var(--sand) 35%, var(--line))" }}>
          <div className="card-head">
            <h3>Finish setting up</h3>
            <span className="mono muted">
              {setup.length - setupLeft.length}/{setup.length} DONE
            </span>
          </div>
          <div className="row">
            {setup.map((s) => (
              <Link key={s.label} to={s.to} className={`chip ${s.done ? "" : ""}`} style={{ opacity: s.done ? 0.5 : 1 }}>
                {s.done ? "✓ " : "○ "}
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="stats">
        <div className="stat">
          <span className="stat-label">Sales (paid)</span>
          <span className="stat-value">{formatNaira(overview.salesKobo)}</span>
          <span className="stat-foot">{overview.paidOrders} paid orders</span>
        </div>
        <div className="stat">
          <span className="stat-label">Orders</span>
          <span className="stat-value">{overview.orders}</span>
          <span className="stat-foot">{overview.orders - overview.paidOrders} awaiting payment or cancelled</span>
        </div>
        <div className="stat">
          <span className="stat-label">Live items</span>
          <span className="stat-value">{overview.published}</span>
          <span className="stat-foot">{overview.products} in catalog</span>
        </div>
        <div className="stat">
          <span className="stat-label">Low stock</span>
          <span className="stat-value" style={{ color: lowStock.length ? "var(--warn)" : undefined }}>
            {lowStock.length}
          </span>
          <span className="stat-foot">{connected}/4 channels connected</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-flush">
          <div className="card-head" style={{ padding: "18px 18px 0" }}>
            <h3>Recent orders</h3>
            <Link to="/dashboard/orders" className="btn btn-ghost btn-sm">
              All orders →
            </Link>
          </div>
          {overview.recentOrders.length === 0 ? (
            <div style={{ padding: 18 }}>
              <p className="muted">No orders yet. Share your storefront link on WhatsApp to get your first one.</p>
            </div>
          ) : (
            overview.recentOrders.map((o) => (
              <Link key={o.id} to={`/dashboard/orders?order=${o.id}`} className="list-row clickable">
                <span className="thumb" style={{ display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
                  {o.customerName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="cell-title" style={{ display: "block" }}>
                    {o.customerName} · <span className="mono">{o.reference}</span>
                  </span>
                  <span className="cell-sub">
                    {o.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")} · {timeAgo(o.createdAt)}
                  </span>
                </span>
                <span style={{ display: "grid", justifyItems: "end", gap: 4 }}>
                  <span className="price">{formatNaira(o.totalKobo)}</span>
                  <span className="row" style={{ gap: 4 }}>
                    <PaymentPill status={o.paymentStatus} />
                    <OrderStatusPill status={o.orderStatus} />
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head">
              <h3>Recent activity</h3>
              <MockBadge label="whatsapp · mock" />
            </div>
            {events.length === 0 ? (
              <p className="muted">Order notifications will appear here.</p>
            ) : (
              events.slice(0, 5).map((e) => (
                <div key={e.id} className="event">
                  <span className="event-icon">✓</span>
                  <div className="event-body">
                    <div className="spread">
                      <strong style={{ color: "var(--text)", fontWeight: 500 }}>{e.templateKey.replace(/_/g, " ")}</strong>
                      <span className="mono muted">{timeAgo(e.createdAt)}</span>
                    </div>
                    <div className="cell-sub">
                      to {e.recipient} · {e.simulated ? "simulated" : e.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Inventory watch</h3>
              <Link to="/dashboard/products" className="btn btn-ghost btn-sm">
                Products →
              </Link>
            </div>
            {lowStock.length === 0 ? (
              <p className="muted">Everything is well stocked.</p>
            ) : (
              <div className="stack-sm">
                {lowStock.map((p) => (
                  <Link key={p.id} to={`/dashboard/products/${p.id}`} className="row" style={{ flexWrap: "nowrap" }}>
                    <span className="thumb" style={{ width: 36, height: 36 }}>
                      <ItemImage src={p.imageUrls[0]} alt={p.title} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }} className="cell-title">
                      {p.title}
                    </span>
                    <span className="mono" style={{ color: p.qtyAvailable === 0 ? "var(--err)" : "var(--warn)" }}>
                      {p.qtyAvailable} left
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
