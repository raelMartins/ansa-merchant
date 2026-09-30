import { Link } from "react-router-dom";
import { Wordmark } from "../shared/ui";

export function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Wordmark size={24} tag="shop" inverse />
        <div className="row">
          <Link className="btn btn-ghost" to="/signin" style={{ color: "#f1ece5" }}>Sign in</Link>
          <Link className="btn btn-sand" to="/signup">Create your shop</Link>
        </div>
      </nav>
      <section className="landing-hero">
        <div>
          <p className="eyebrow">01 // instant activation</p>
          <h1>Your shop, live in seconds.</h1>
          <p className="lede">Build a mobile catalog, share one link on WhatsApp, and take paid orders — powered by ansa.</p>
          <div className="row" style={{ marginTop: 24 }}>
            <Link className="btn btn-sand btn-lg" to="/signup">Create your shop</Link>
            <Link className="btn btn-outline" to="/shop/zola-atelier" style={{ color: "#f1ece5", borderColor: "#444" }}>
              View live demo
            </Link>
          </div>
          <p className="mono" style={{ marginTop: 20, color: "#857d74", fontSize: "0.75rem" }}>
            TRANSACTION FEE: prototype · SETTLEMENT: mock provider
          </p>
        </div>
        <div className="phone-mock">
          <div className="phone-mock-screen" style={{ minHeight: 420, padding: 16 }}>
            <strong style={{ fontSize: "1.1rem" }}>Dara's Ankara</strong>
            <div style={{ marginTop: 12, height: 120, borderRadius: 12, background: "#e8e0d5" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
              <div style={{ aspectRatio: "1", background: "#e8e0d5", borderRadius: 10 }} />
              <div style={{ aspectRatio: "1", background: "#e8e0d5", borderRadius: 10 }} />
            </div>
            <div className="btn btn-wa btn-sm" style={{ marginTop: 16, width: "100%" }}>Order on WhatsApp</div>
          </div>
        </div>
      </section>
      <section className="landing-features">
        {[
          ["Instant catalog", "Add products in minutes"],
          ["WhatsApp orders", "Meet customers where they are"],
          ["Shareable links", "One URL for every channel"],
          ["Trusted checkout", "Guest checkout with mock Paystack"],
        ].map(([t, b]) => (
          <div key={t} className="landing-feature">
            <strong>{t}</strong>
            <p>{b}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
