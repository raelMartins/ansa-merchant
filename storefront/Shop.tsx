import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorMessage } from "../shared/api";
import { useCart } from "../shared/cart";
import { formatNaira, isInStock, stockLabel, waLink, type CatalogItem, type Shop } from "../shared/types";
import { BrandInline } from "../shared/BrandInline";
import { ChannelIcon, ErrorState, ItemImage, PageLoader, Wordmark } from "../shared/ui";

export function ShopPage() {
  const { shopSlug } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cat, setCat] = useState<string | "all">("all");
  const [scrolled, setScrolled] = useState(false);
  const cart = useCart(shopSlug);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!shopSlug) return;
    (async () => {
      try {
        const s = await api<{ merchant: Shop }>(`/v1/merchants/${shopSlug}`);
        const p = await api<{ products: CatalogItem[] }>(`/v1/merchants/${shopSlug}/products`);
        setShop(s.merchant);
        setItems(p.products);
      } catch (e) {
        setError(errorMessage(e, "Shop not found"));
      }
    })();
  }, [shopSlug]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean) as string[]);
    return ["all", ...set];
  }, [items]);

  const visible = items.filter((i) => cat === "all" || i.category === cat);

  if (error) {
    return (
      <div className="app-root theme-light sf">
        <ErrorState message={error} />
      </div>
    );
  }
  if (!shop) return <div className="app-root theme-light"><PageLoader label="Opening shop…" /></div>;

  const wa = shop.whatsapp || shop.phone;

  return (
    <div className="app-root theme-light sf">
      <header className={`sf-bar ${scrolled ? "scrolled" : ""}`}>
        <Link to={`/shop/${shop.slug}`} className="sf-bar-shop">
          <span className="avatar"><ItemImage src={shop.logoUrl} alt={shop.name} /></span>
          <span>{shop.name}</span>
        </Link>
        <div className="row">
          <Wordmark size={16} badge={false} />
          <Link to={`/shop/${shop.slug}/cart`} className="cart-btn">
            Cart
            {cart.count > 0 ? <span className="cart-count">{cart.count}</span> : null}
          </Link>
        </div>
      </header>

      {shop.coverUrl ? (
        <div className="sf-cover"><ItemImage src={shop.coverUrl} alt="" className="cover-fill" /></div>
      ) : null}

      <div className="sf-wrap">
        <div className="sf-profile">
          <div className="sf-logo"><ItemImage src={shop.logoUrl} alt={shop.name} label={shop.name} /></div>
          <div>
            <h1>{shop.name}</h1>
            <div className="sf-meta">
              {shop.category ? <span>{shop.category}</span> : null}
              {shop.location ? <span>{shop.location}</span> : null}
            </div>
          </div>
        </div>
        <div className="sf-about">
          {shop.description ? <p>{shop.description}</p> : null}
          <div className="sf-actions">
            {wa ? (
              <a className="btn btn-wa" href={waLink(wa, `Hi ${shop.name}, I'd like to order from your shop`)} target="_blank" rel="noreferrer">
                Chat on WhatsApp
              </a>
            ) : null}
          </div>
          <div className="social-links">
            {shop.instagramHandle ? <a href={`https://instagram.com/${shop.instagramHandle}`} target="_blank" rel="noreferrer" aria-label="Instagram"><ChannelIcon channel="instagram" /></a> : null}
            {shop.tiktokHandle ? <a href={`https://tiktok.com/@${shop.tiktokHandle}`} target="_blank" rel="noreferrer" aria-label="TikTok"><ChannelIcon channel="tiktok" /></a> : null}
            {shop.xHandle ? <a href={`https://x.com/${shop.xHandle}`} target="_blank" rel="noreferrer" aria-label="X"><ChannelIcon channel="x" /></a> : null}
          </div>
          <div className="trust-strip">
            <span>Secure checkout</span>
            <span>Order updates</span>
            <span className="brand-copy-line">Powered by <BrandInline fontSize={12} /></span>
          </div>
        </div>

        <div className="sf-section-head">
          <h2>Shop</h2>
          <span className="mono muted">{visible.length} items</span>
        </div>
        {categories.length > 2 ? (
          <div className="sf-cats">
            {categories.map((c) => (
              <button key={c} type="button" className={`chip ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        ) : null}

        <div className="sf-grid">
          {visible.map((item) => (
            <Link key={item.id} to={`/shop/${shop.slug}/${item.slug}`} className="sf-card">
              <div className="sf-card-media">
                <ItemImage src={item.imageUrls[0]} alt={item.title} label={item.title} />
                {!isInStock(item) ? <span className="sf-card-badge soldout">Sold out</span> : item.kind === "service" ? <span className="sf-card-badge">Service</span> : null}
              </div>
              <div>
                <div className="sf-card-title">{item.title}</div>
                <div className="spread">
                  <span className="price">{formatNaira(item.priceKobo)}</span>
                  <span className="sf-card-sub">{stockLabel(item)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <footer className="sf-foot">
          <Wordmark size={14} badge={false} />
          <span className="brand-copy-line">Trusted commerce on <BrandInline fontSize={12} /></span>
        </footer>
      </div>
    </div>
  );
}
