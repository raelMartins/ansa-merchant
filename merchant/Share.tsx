import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorMessage, post } from "../shared/api"
import { meMerchant } from "../shared/merchantPath";
import { CHANNEL_LABEL, type Channel, type CatalogItem, type Integration, type Publication } from "../shared/types";
import { ChannelIcon, ConnectionPill, ErrorState, Field, ItemImage, MockBadge, PageLoader, copyText, shareLink, useToast } from "../shared/ui";
import { useLoad, useMerchant } from "./context";
import { PageHeader } from "./Layout";

type ShareData = {
  url: string;
  defaultCaption: string;
  integrations: Integration[];
  publications: Publication[];
};

function Preview({ channel, item, shopName, caption }: { channel: Channel; item: CatalogItem; shopName: string; caption: string }) {
  const img = item.imageUrls[0];
  if (channel === "whatsapp") {
    return (
      <div className="social-preview sp-wa">
        <div className="sp-wa-msg">
          <div className="sp-wa-card">
            <ItemImage src={img} alt={item.title} />
            <div><strong>{item.title}</strong></div>
          </div>
          <div className="sp-wa-text">{caption}</div>
          <div className="sp-wa-time">12:04 ✓✓</div>
        </div>
      </div>
    );
  }
  if (channel === "instagram") {
    return (
      <div className="social-preview sp-ig">
        <div className="sp-ig-head">
          <span className="avatar"><ItemImage src={img} alt="" /></span>
          {shopName}
        </div>
        <div className="sp-ig-media"><ItemImage src={img} alt={item.title} /></div>
        <div className="sp-ig-caption"><strong>{shopName}</strong> {caption}</div>
      </div>
    );
  }
  if (channel === "tiktok") {
    return (
      <div className="social-preview sp-tt">
        <ItemImage src={img} alt={item.title} />
        <div className="sp-tt-overlay">{caption}</div>
      </div>
    );
  }
  return (
    <div className="social-preview sp-x">
      <span className="avatar"><ItemImage src={img} alt="" /></span>
      <div>
        <strong>{shopName}</strong> <span className="muted">@shop</span>
        <div className="sp-x-text">{caption}</div>
        <div className="sp-x-card">
          <ItemImage src={img} alt="" />
          <div>{item.title}</div>
        </div>
      </div>
    </div>
  );
}

export function SharePage() {
  const { productId } = useParams();
  const { shop } = useMerchant();
  const toast = useToast();
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, error, loading, reload } = useLoad(async () => {
    const [share, product] = await Promise.all([
      api<ShareData>(meMerchant(`/products/${productId}/share`)),
      api<{ product: CatalogItem }>(meMerchant(`/products/${productId}`)),
    ]);
    setCaption(share.defaultCaption);
    return { share, product: product.product };
  });

  if (loading && !data) return <PageLoader label="Loading share tools…" />;
  if (error && !data) return <ErrorState message={error} onRetry={() => void reload()} />;
  if (!data) return <PageLoader label="Loading share tools…" />;

  const { share, product } = data;
  const conn = share.integrations.find((i) => i.channel === channel);

  async function publish() {
    setBusy(true);
    try {
      const res = await post<{ publication: Publication }>(meMerchant(`/products/${productId}/share`), { channel, caption });
      toast(res.publication.detail, "info");
      void reload();
    } catch (e) {
      toast(errorMessage(e), "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-view" data-busy={busy || loading ? "true" : undefined}>
      {(busy || loading) && data ? <div className="route-progress" aria-hidden /> : null}
      <PageHeader
        eyebrow="share & publish"
        title={product.title}
        actions={<Link className="btn btn-ghost" to={`/dashboard/products/${productId}`}>← Edit item</Link>}
      />
      <div className="share-layout">
        <div className="stack">
          <div className="tabs">
            {(["whatsapp", "instagram", "tiktok", "x"] as Channel[]).map((ch) => (
              <button key={ch} type="button" className={`tab ${channel === ch ? "active" : ""}`} onClick={() => setChannel(ch)}>
                <ChannelIcon channel={ch} size={16} />
                {CHANNEL_LABEL[ch]}
              </button>
            ))}
          </div>
          <div className="spread">
            <ConnectionPill status={conn?.status ?? "not_connected"} />
            {conn?.simulated ? <MockBadge /> : null}
          </div>
          {conn?.status !== "connected" ? (
            <div className="alert alert-info">
              Connect {CHANNEL_LABEL[channel]} in{" "}
              <Link to="/dashboard/whatsapp">{channel === "whatsapp" ? "WhatsApp" : "Settings / integrations"}</Link>{" "}
              first. You can still copy the link and caption below.
            </div>
          ) : null}
          <Field label="Caption">
            <textarea className="input" value={caption} onChange={(e) => setCaption(e.target.value)} rows={5} />
          </Field>
          <div className="linkbox">
            <span>{share.url}</span>
            <button className="btn btn-outline btn-sm" type="button" onClick={() => void copyText(share.url).then((ok) => toast(ok ? "Link copied" : "Copy failed", ok ? "ok" : "err"))}>
              Copy
            </button>
          </div>
          <div className="row">
            <button className="btn btn-outline" type="button" onClick={() => void copyText(caption).then((ok) => toast(ok ? "Caption copied" : "Copy failed", ok ? "ok" : "err"))}>
              Copy caption
            </button>
            <button className="btn btn-outline" type="button" onClick={() => void shareLink({ title: product.title, text: caption, url: share.url }).then((r) => toast(r === "shared" ? "Shared" : r === "copied" ? "Link copied" : "Share cancelled", "info"))}>
              Share
            </button>
            <button className="btn btn-sand" type="button" disabled={busy || conn?.status !== "connected"} onClick={() => void publish()}>
              {busy ? "Publishing…" : "Publish to channel"}
            </button>
          </div>
          {share.publications.length > 0 ? (
            <div className="card">
              <h3>Recent publications</h3>
              <div className="stack-sm" style={{ marginTop: 12 }}>
                {share.publications.slice(0, 5).map((p) => (
                  <div key={p.id} className="cell-sub">
                    <strong style={{ color: "var(--text)" }}>{CHANNEL_LABEL[p.channel]}</strong> · {p.status} · {new Date(p.createdAt).toLocaleString()}
                    <div>{p.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <Preview channel={channel} item={product} shopName={shop.name} caption={caption} />
      </div>
    </div>
  );
}

export function SocialHubPage() {
  const { shop } = useMerchant();
  const { data, loading, reload } = useLoad(async () => (await api<{ integrations: Integration[] }>(meMerchant("/integrations"))).integrations);
  const { data: products } = useLoad(async () => (await api<{ products: CatalogItem[] }>(meMerchant("/products"))).products.filter((p) => p.status === "published"));
  return (
    <div>
      <PageHeader eyebrow="sell everywhere" title="Social / Publish" sub="Connect accounts once at account level, then publish any catalog item." />
      <div className="channel-grid" style={{ marginBottom: 24 }}>
        {(data ?? []).map((i) => (
          <div key={i.channel} className="channel-card">
            <div className="channel-head">
              <span className={`channel-icon ${i.channel}`}><ChannelIcon channel={i.channel} /></span>
              <div>
                <strong>{CHANNEL_LABEL[i.channel]}</strong>
                <ConnectionPill status={i.status} />
              </div>
            </div>
            {i.externalAccount ? <p className="muted">{i.externalAccount}</p> : null}
            {i.simulated ? <MockBadge /> : null}
          </div>
        ))}
      </div>
      {!loading && (products ?? []).length === 0 ? (
        <p className="muted">Publish a catalog item first, then open Share from the product card.</p>
      ) : (
        <div className="m-grid">
          {(products ?? []).map((p) => (
            <Link key={p.id} to={`/dashboard/products/${p.id}/share`} className="m-item">
              <div className="m-item-media"><ItemImage src={p.imageUrls[0]} alt={p.title} /></div>
              <div className="m-item-body">
                <span className="cell-title">{p.title}</span>
                <span className="muted">Share & publish →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      <p className="muted" style={{ marginTop: 16 }}>
        <Link to="/dashboard/settings">Manage connections</Link> · Storefront: <a href={`/shop/${shop.slug}`} target="_blank" rel="noreferrer">/shop/{shop.slug}</a>
      </p>
    </div>
  );
}
