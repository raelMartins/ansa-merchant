import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errorMessage } from "../shared/api";
import { useCart } from "../shared/cart";
import { formatNaira, isInStock, stockLabel, waLink, type CatalogItem, type Shop } from "../shared/types";
import { ErrorState, ItemImage, PageLoader, Wordmark } from "../shared/ui";

export function ProductPage() {
  const { shopSlug, itemSlug } = useParams();
  const nav = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const cart = useCart(shopSlug);

  useEffect(() => {
    if (!shopSlug || !itemSlug) return;
    (async () => {
      try {
        const s = await api<{ merchant: Shop }>(`/v1/merchants/${shopSlug}`);
        const p = await api<{ product: CatalogItem }>(`/v1/merchants/${shopSlug}/products/${itemSlug}`);
        setShop(s.merchant);
        setItem(p.product);
      } catch (e) {
        setError(errorMessage(e));
      }
    })();
  }, [shopSlug, itemSlug]);

  if (error) return <div className="app-root theme-light"><ErrorState message={error} /></div>;
  if (!shop || !item) return <div className="app-root theme-light"><PageLoader /></div>;

  const photos = item.imageUrls.length ? item.imageUrls : [null];
  const maxQty = item.kind === "service" ? 10 : item.qtyAvailable;
  const wa = shop.whatsapp || shop.phone;

  function add() {
    if (!item || !shop) return;
    cart.add(item, qty);
    nav(`/shop/${shop.slug}/cart`);
  }

  return (
    <div className="app-root theme-light sf">
      <header className="sf-bar scrolled">
        <Link to={`/shop/${shop.slug}`} className="sf-bar-shop">← {shop.name}</Link>
        <Wordmark size={16} tag="shop" />
      </header>
      <div className="sf-wrap pd">
        <div className="pd-gallery">
          <div className="pd-hero"><ItemImage src={photos[photo] ?? undefined} alt={item.title} label={item.title} /></div>
          {photos.length > 1 ? (
            <div className="pd-thumbs">
              {photos.map((src, i) => (
                <button key={i} type="button" className={i === photo ? "active" : ""} onClick={() => setPhoto(i)}>
                  <ItemImage src={src ?? undefined} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="pd-info">
          <p className="eyebrow">{item.kind === "service" ? "Service" : item.category ?? "Product"}</p>
          <h1>{item.title}</h1>
          <p className="pd-price">
            {formatNaira(item.priceKobo)}
            {item.compareAtKobo ? <span className="compare">{formatNaira(item.compareAtKobo)}</span> : null}
          </p>
          <p className="pd-desc">{item.description ?? "No description yet."}</p>
          <div className="detail-list">
            <div><dt>Availability</dt><dd>{stockLabel(item)}</dd></div>
            {item.durationMinutes ? <div><dt>Duration</dt><dd>{item.durationMinutes} minutes</dd></div> : null}
            {item.availabilityNote ? <div><dt>When</dt><dd>{item.availabilityNote}</dd></div> : null}
          </div>
          {isInStock(item) ? (
            <div className="row desktop-cta">
              <div className="qty">
                <button type="button" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}>−</button>
                <span>{qty}</span>
                <button type="button" disabled={qty >= maxQty} onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
              <button className="btn btn-primary btn-lg" type="button" onClick={add}>Add to cart</button>
            </div>
          ) : (
            <p className="alert alert-err">Currently unavailable</p>
          )}
          {wa ? (
            <a className="btn btn-wa btn-block" href={waLink(wa, `Hi, I'm interested in ${item.title}`)} target="_blank" rel="noreferrer">
              Ask on WhatsApp
            </a>
          ) : null}
          <Link to={`/shop/${shop.slug}`} className="merchant-card">
            <span className="avatar"><ItemImage src={shop.logoUrl} alt="" /></span>
            <span>
              <strong>{shop.name}</strong>
              <span className="muted" style={{ display: "block", fontSize: "0.84rem" }}>View all items</span>
            </span>
          </Link>
        </div>
      </div>
      {isInStock(item) ? (
        <div className="mobile-cta">
          <div className="qty qty-sm">
            <button type="button" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}>−</button>
            <span>{qty}</span>
            <button type="button" disabled={qty >= maxQty} onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
          <button className="btn btn-primary" type="button" onClick={add}>Add to cart</button>
        </div>
      ) : null}
    </div>
  );
}
