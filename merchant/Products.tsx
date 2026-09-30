import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage, patch } from "../shared/api"
import { meMerchant } from "../shared/merchantPath";
import { formatNaira, type CatalogItem, type ItemStatus } from "../shared/types";
import { EmptyState, ErrorState, ItemImage, PageLoader, Pill, copyText, useToast } from "../shared/ui";
import { useLoad, useMerchant } from "./context";
import { PageHeader } from "./Layout";

type Filter = "all" | ItemStatus | "service";

const STATUS_TONE = { published: "ok", draft: "neutral", archived: "err" } as const;
const STATUS_LABEL = { published: "Live", draft: "Draft", archived: "Archived" } as const;

export function ProductsPage() {
  const { shop } = useMerchant();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const { data, setData, error, loading, reload } = useLoad(async () => (await api<{ products: CatalogItem[] }>(meMerchant("/products"))).products);

  const items = data ?? [];
  const counts = useMemo(
    () => ({
      all: items.filter((i) => i.status !== "archived").length,
      published: items.filter((i) => i.status === "published").length,
      draft: items.filter((i) => i.status === "draft").length,
      service: items.filter((i) => i.kind === "service" && i.status !== "archived").length,
      archived: items.filter((i) => i.status === "archived").length,
    }),
    [items],
  );

  const visible = items.filter((i) => {
    if (filter === "all" && i.status === "archived") return false;
    if (filter === "service" && (i.kind !== "service" || i.status === "archived")) return false;
    if ((filter === "published" || filter === "draft" || filter === "archived") && i.status !== filter) return false;
    if (q && !i.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  async function setStatus(item: CatalogItem, status: ItemStatus) {
    try {
      const { product } = await patch<{ product: CatalogItem }>(meMerchant(`/products/${item.id}`, { status });
      setData((prev) => (prev ?? []).map((p) => (p.id === item.id ? product : p)));
      toast(status === "published" ? `"${item.title}" is live` : status === "draft" ? "Moved to drafts" : "Archived");
    } catch (err) {
      toast(errorMessage(err), "err");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={`${counts.published} live on your storefront`}
        title="Products & services"
        actions={
          <>
            <a className="btn btn-outline" href={`/shop/${shop.slug}`} target="_blank" rel="noreferrer">
              View storefront
            </a>
            <Link className="btn btn-sand" to="/dashboard/products/new">
              + Add item
            </Link>
          </>
        }
      />

      <div className="spread" style={{ marginBottom: 4, flexWrap: "wrap" }}>
        <div className="filters">
          {(
            [
              ["all", "All"],
              ["published", "Live"],
              ["draft", "Drafts"],
              ["service", "Services"],
              ["archived", "Archived"],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" className={`chip ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>
              {label}
              <span className="count">{counts[k]}</span>
            </button>
          ))}
        </div>
        <input className="input" style={{ maxWidth: 260, marginBottom: 18 }} placeholder="Search your catalog…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading && !data ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "No products yet" : "Nothing here"}
          body={items.length === 0 ? "Add your first product or service. A name and a price is enough to start — photos are optional." : "Try a different filter."}
          action={
            items.length === 0 ? (
              <Link className="btn btn-sand" to="/dashboard/products/new">
                Add your first item
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="m-grid">
          {visible.map((item) => (
            <article key={item.id} className="m-item">
              <Link to={`/dashboard/products/${item.id}`} className="m-item-media">
                <ItemImage src={item.imageUrls[0]} alt={item.title} />
                <Pill tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Pill>
              </Link>
              <div className="m-item-body">
                <span className="m-item-meta">
                  {item.kind === "service" ? "Service" : item.category ?? "Product"}
                  {item.sku ? ` · ${item.sku}` : ""}
                </span>
                <Link to={`/dashboard/products/${item.id}`} className="cell-title">
                  {item.title}
                </Link>
                <div className="spread">
                  <span className="price">
                    {formatNaira(item.priceKobo)}
                    {item.compareAtKobo ? <span className="compare">{formatNaira(item.compareAtKobo)}</span> : null}
                  </span>
                  <span className="mono" style={{ color: item.kind === "product" && item.qtyAvailable <= 3 ? "var(--warn)" : "var(--muted)" }}>
                    {item.kind === "service" ? (item.durationMinutes ? `${item.durationMinutes} min` : "bookable") : `${item.qtyAvailable} left · ${item.qtySold} sold`}
                  </span>
                </div>
              </div>
              <div className="m-item-actions">
                {item.status === "published" ? (
                  <>
                    <Link className="btn btn-outline btn-sm" to={`/dashboard/products/${item.id}/share`}>
                      Share
                    </Link>
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={async () => {
                        const ok = await copyText(`${window.location.origin}/shop/${shop.slug}/${item.slug}`);
                        toast(ok ? "Product link copied" : "Couldn't copy", ok ? "ok" : "err");
                      }}
                    >
                      Copy link
                    </button>
                  </>
                ) : item.status === "draft" ? (
                  <>
                    <button className="btn btn-outline btn-sm" type="button" onClick={() => void setStatus(item, "published")}>
                      Publish
                    </button>
                    <Link className="btn btn-ghost btn-sm" to={`/dashboard/products/${item.id}`}>
                      Edit
                    </Link>
                  </>
                ) : (
                  <button className="btn btn-outline btn-sm" type="button" onClick={() => void setStatus(item, "draft")}>
                    Restore to drafts
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
