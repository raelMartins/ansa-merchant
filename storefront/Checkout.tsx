import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errorMessage, post } from "../shared/api";
import { clearCart, useCart } from "../shared/cart";
import { DELIVERY_FEE_KOBO, formatNaira, type Order, type Shop } from "../shared/types";
import { ErrorState, Field, ItemImage, PageLoader, Spinner, Wordmark } from "../shared/ui";

export function CartPage() {
  const { shopSlug } = useParams();
  const cart = useCart(shopSlug);
  if (!shopSlug) return null;
  if (cart.lines.length === 0) {
    return (
      <div className="app-root theme-light sf-wrap" style={{ paddingTop: 40 }}>
        <h1>Your cart is empty</h1>
        <Link className="btn btn-primary" to={`/shop/${shopSlug}`}>Back to shop</Link>
      </div>
    );
  }
  const delivery = DELIVERY_FEE_KOBO;
  return (
    <div className="app-root theme-light sf">
      <header className="sf-bar scrolled"><Wordmark size={16} badge={false} /></header>
      <div className="sf-wrap co" style={{ paddingTop: 24 }}>
        <div>
          <h1>Cart</h1>
          {cart.lines.map((l) => (
            <div key={l.productId} className="line">
              <span className="thumb"><ItemImage src={l.imageUrl} alt={l.title} /></span>
              <div>
                <strong>{l.title}</strong>
                <div className="qty qty-sm" style={{ marginTop: 8 }}>
                  <button type="button" onClick={() => cart.setQty(l.productId, l.quantity - 1)}>−</button>
                  <span>{l.quantity}</span>
                  <button type="button" onClick={() => cart.setQty(l.productId, l.quantity + 1)}>+</button>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="price">{formatNaira(l.priceKobo * l.quantity)}</div>
                <button className="link-btn" type="button" onClick={() => cart.remove(l.productId)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <div className="card co-summary">
          <div className="totals">
            <div><span>Subtotal</span><span>{formatNaira(cart.subtotal)}</span></div>
            <div><span>Delivery (if selected)</span><span>{formatNaira(delivery)}</span></div>
            <div className="grand"><span>From</span><span>{formatNaira(cart.subtotal)}</span></div>
          </div>
          <Link className="btn btn-primary btn-block btn-lg" to={`/shop/${shopSlug}/checkout`}>Checkout</Link>
        </div>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const { shopSlug } = useParams();
  const nav = useNavigate();
  const cart = useCart(shopSlug);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fulfilment, setFulfilment] = useState<"pickup" | "delivery">("delivery");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [payStep, setPayStep] = useState(false);
  const [pending, setPending] = useState<{ order: Order; merchant: Shop; simulated: boolean } | null>(null);

  const deliveryFee = fulfilment === "delivery" ? DELIVERY_FEE_KOBO : 0;
  const total = cart.subtotal + deliveryFee;

  if (!shopSlug || cart.lines.length === 0) {
    return (
      <div className="app-root theme-light sf-wrap" style={{ paddingTop: 40 }}>
        <Link to={`/shop/${shopSlug ?? ""}`}>← Shop</Link>
      </div>
    );
  }

  async function createOrder() {
    setBusy(true);
    setErr(null);
    try {
      const res = await post<{ order: Order; merchant: Shop; payment: { simulated: boolean } }>("/v1/checkout", {
        merchantSlug: shopSlug,
        items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        customerName: name,
        customerPhone: phone,
        customerEmail: email || undefined,
        fulfilment,
        deliveryAddress: fulfilment === "delivery" ? address : undefined,
        deliveryInstructions: instructions || undefined,
      });
      setPending({ order: res.order, merchant: res.merchant, simulated: res.payment.simulated });
      setPayStep(true);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function payMock() {
    if (!pending) return;
    setBusy(true);
    try {
      await post("/v1/payments/mock/complete", { orderId: pending.order.id });
      if (shopSlug) clearCart(shopSlug);
      nav(`/order/${pending.order.reference}`);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-root theme-light sf">
      <header className="sf-bar scrolled"><Wordmark size={16} badge={false} /></header>
      <div className="sf-wrap co" style={{ paddingTop: 24 }}>
        {!payStep ? (
          <>
            <div className="stack">
              <h1>Checkout</h1>
              <p className="text-2">You're checking out with a trusted ansa link — no account needed.</p>
              {err ? <div className="alert alert-err">{err}</div> : null}
              <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
              <Field label="Phone"><input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
              <Field label="Email" optional><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <p className="eyebrow">Delivery</p>
              <div className="fulfil">
                <button type="button" className={`fulfil-option ${fulfilment === "pickup" ? "active" : ""}`} onClick={() => setFulfilment("pickup")}>
                  <strong>Pickup</strong><span>Collect from the merchant</span>
                </button>
                <button type="button" className={`fulfil-option ${fulfilment === "delivery" ? "active" : ""}`} onClick={() => setFulfilment("delivery")}>
                  <strong>Delivery</strong><span>{formatNaira(DELIVERY_FEE_KOBO)} prototype fee</span>
                </button>
              </div>
              {fulfilment === "delivery" ? (
                <>
                  <Field label="Delivery address"><textarea className="input" value={address} onChange={(e) => setAddress(e.target.value)} required /></Field>
                  <Field label="Instructions" optional><textarea className="input" value={instructions} onChange={(e) => setInstructions(e.target.value)} /></Field>
                </>
              ) : null}
            </div>
            <div className="card co-summary">
              <h3>Order summary</h3>
              {cart.lines.map((l) => (
                <div key={l.productId} className="line line-sm">
                  <span className="thumb"><ItemImage src={l.imageUrl} alt="" /></span>
                  <span>{l.quantity}× {l.title}</span>
                  <span className="price">{formatNaira(l.priceKobo * l.quantity)}</span>
                </div>
              ))}
              <div className="totals">
                <div><span>Subtotal</span><span>{formatNaira(cart.subtotal)}</span></div>
                <div><span>Delivery</span><span>{formatNaira(deliveryFee)}</span></div>
                <div className="grand"><span>Total</span><span>{formatNaira(total)}</span></div>
              </div>
              <div className="secure-note">🔒 Payments run through a regulated provider abstraction. Development uses MockPaymentProvider.</div>
              <button className="btn btn-primary btn-block btn-lg" type="button" disabled={busy || !name || !phone || (fulfilment === "delivery" && !address)} onClick={() => void createOrder()}>
                {busy ? <Spinner label="Preparing…" /> : "Continue to payment"}
              </button>
            </div>
          </>
        ) : (
          <div className="card pay-sheet" style={{ maxWidth: 480, margin: "0 auto" }}>
            <p className="eyebrow">payment</p>
            <h2>Pay {pending?.merchant.name}</h2>
            <p className="pay-amount">{formatNaira(pending?.order.totalKobo ?? 0)}</p>
            <p className="mono muted">Ref {pending?.order.reference}</p>
            <div className="pay-methods">
              <div className="pay-method active">
                <span>{pending?.simulated ? "Mock payment (prototype)" : "Flutterwave"}</span>
                <MockBadge />
              </div>
            </div>
            {err ? <div className="alert alert-err">{err}</div> : null}
            <button className="btn btn-primary btn-block btn-lg" type="button" disabled={busy} onClick={() => void payMock()}>
              {busy ? <Spinner label="Processing…" /> : "Complete payment"}
            </button>
            <p className="muted" style={{ fontSize: "0.82rem", textAlign: "center" }}>Prototype: no real charge. Inventory updates after success.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MockBadge() {
  return <span className="mock-badge">mock</span>;
}

export function OrderResultPage() {
  const { reference } = useParams();
  const [data, setData] = useState<{ order: Order; merchant: Shop | null } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) return;
    api<{ order: Order; merchant: Shop | null }>(`/v1/orders/${reference}`)
      .then(setData)
      .catch((e) => setErr(errorMessage(e)));
  }, [reference]);

  if (err) return <div className="app-root theme-light"><ErrorState message={err} /></div>;
  if (!data) return <div className="app-root theme-light"><PageLoader /></div>;

  const { order, merchant } = data;
  const paid = order.paymentStatus === "paid";
  const wa = merchant?.whatsapp || merchant?.phone;

  return (
    <div className="app-root theme-light sf">
      <div className="sf-wrap result">
        <div className="result-hero">
          <div className={`result-check ${paid ? "" : "pending"}`}>{paid ? "✓" : "…"}</div>
          <h1>{paid ? "Payment successful" : "Order received"}</h1>
          <span className="ref">{order.reference}</span>
          <p className="text-2">{paid ? "Your order is confirmed. The merchant has been notified (prototype WhatsApp)." : "Complete payment to confirm."}</p>
        </div>
        <div className="card stack">
          <div className="totals">
            <div><span>Merchant</span><span>{merchant?.name ?? "—"}</span></div>
            <div><span>Total</span><span className="price">{formatNaira(order.totalKobo)}</span></div>
            <div><span>Status</span><span>{order.orderStatus.replace(/_/g, " ")}</span></div>
          </div>
          {wa ? (
            <a className="btn btn-wa btn-block" href={`https://wa.me/${wa.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I placed order ${order.reference}`)}`} target="_blank" rel="noreferrer">
              Message on WhatsApp
            </a>
          ) : null}
          {merchant ? <Link className="btn btn-outline btn-block" to={`/shop/${merchant.slug}`}>Back to shop</Link> : null}
        </div>
      </div>
    </div>
  );
}
