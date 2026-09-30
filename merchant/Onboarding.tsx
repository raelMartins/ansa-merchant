import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError, errorMessage, patch, post, signOut } from "../shared/api";
import { meMerchant, setActiveMerchantId } from "../shared/merchantPath";
import type { Shop } from "../shared/types";
import { ChannelIcon, Field, ImagePicker, ItemImage, PageLoader, Spinner, Wordmark } from "../shared/ui";

const CATEGORIES = ["Fashion", "Beauty", "Food & drink", "Home & living", "Electronics", "Art & crafts", "Services", "Other"];

type Draft = {
  name: string;
  description: string;
  category: string;
  phone: string;
  whatsapp: string;
  location: string;
  logoUrl: string | null;
  coverUrl: string | null;
  instagramHandle: string;
  tiktokHandle: string;
  xHandle: string;
};

const EMPTY: Draft = {
  name: "",
  description: "",
  category: "",
  phone: "",
  whatsapp: "",
  location: "",
  logoUrl: null,
  coverUrl: null,
  instagramHandle: "",
  tiktokHandle: "",
  xHandle: "",
};

const STEPS = ["Your business", "Contact", "Look & feel", "Socials"] as const;

function clean(v: string) {
  const t = v.trim();
  return t ? t : undefined;
}

export function OnboardingPage() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(EMPTY);
  const [existing, setExisting] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sameWa, setSameWa] = useState(true);

  useEffect(() => {
    api<{ merchants: Shop[] }>("/v1/me/merchants")
      .then(({ merchants }) => {
        const merchant = merchants[0];
        if (!merchant) {
          setExisting(null);
          return;
        }
        if (merchant.onboardingCompleted) {
          nav("/dashboard", { replace: true });
          return;
        }
        setActiveMerchantId(merchant.id);
        setExisting(merchant);
        setD({
          ...EMPTY,
          name: merchant.name,
          description: merchant.description ?? "",
          category: merchant.category ?? "",
          phone: merchant.phone ?? "",
          whatsapp: merchant.whatsapp ?? "",
          location: merchant.location ?? "",
          logoUrl: merchant.logoUrl,
          coverUrl: merchant.coverUrl,
        });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) nav("/signin", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [nav]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));

  function canContinue(): boolean {
    if (step === 0) return d.name.trim().length > 0 && d.category.length > 0;
    if (step === 1) return d.phone.trim().length >= 7;
    return true;
  }

  async function finish() {
    setBusy(true);
    setError(null);
    const body = {
      name: d.name.trim(),
      description: clean(d.description),
      category: clean(d.category),
      phone: clean(d.phone),
      whatsapp: clean(sameWa ? d.phone : d.whatsapp),
      location: clean(d.location),
      logoUrl: d.logoUrl ?? undefined,
      coverUrl: d.coverUrl ?? undefined,
      instagramHandle: clean(d.instagramHandle.replace(/^@/, "")),
      tiktokHandle: clean(d.tiktokHandle.replace(/^@/, "")),
      xHandle: clean(d.xHandle.replace(/^@/, "")),
      onboardingCompleted: true,
    };
    try {
      if (existing) {
        await patch(meMerchant(), body);
      } else {
        const { merchant } = await post<{ merchant: Shop }>("/v1/me/merchants", body);
        setActiveMerchantId(merchant.id);
      }
      nav("/dashboard?welcome=1");
    } catch (err) {
      setError(errorMessage(err, "Could not save your business profile"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="app-root">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="app-root onb">
      <div className="onb-top">
        <Wordmark size={22} tag="shop" />
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
      <div className="onb-body">
        <div className="stack" style={{ alignContent: "start", gap: 26 }}>
          <div className="progress">
            {STEPS.map((s, i) => (
              <span key={s} className={i <= step ? "on" : ""} />
            ))}
          </div>
          <div className="stack-sm">
            <p className="eyebrow">
              step {step + 1} of {STEPS.length} · {STEPS[step]}
            </p>
            <h1>
              {step === 0 && "Let's set up your ansa business profile"}
              {step === 1 && "How do customers reach you?"}
              {step === 2 && "Make it look like you"}
              {step === 3 && "Where do you already sell?"}
            </h1>
            <p className="text-2">
              {step === 0 && "This is what customers see on your storefront and every product link."}
              {step === 1 && "Your WhatsApp number powers order updates and the chat button on your shop."}
              {step === 2 && "A logo and cover photo make your link feel trustworthy. You can skip this and add them later."}
              {step === 3 && "Add your handles so customers can find you. You'll connect accounts for publishing from the dashboard."}
            </p>
          </div>

          {error ? <div className="alert alert-err">{error}</div> : null}

          {step === 0 ? (
            <div className="form-grid">
              <Field label="Business name">
                <input className="input" autoFocus value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Zola Atelier" maxLength={120} />
              </Field>
              <Field label="What do you sell?">
                <div className="cat-grid">
                  {CATEGORIES.map((c) => (
                    <button key={c} type="button" className={`cat-option ${d.category === c ? "active" : ""}`} onClick={() => set("category", c)}>
                      {c}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Short description" optional hint="One or two sentences. Say it how you'd say it on WhatsApp.">
                <textarea
                  className="input"
                  value={d.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Handmade adire and Ankara pieces, delivered across Nigeria."
                  maxLength={2000}
                />
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="form-grid">
              <Field label="Phone number">
                <input className="input" type="tel" autoFocus value={d.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+234 803 123 4567" />
              </Field>
              <label className="row" style={{ cursor: "pointer", fontSize: "0.9rem" }}>
                <input type="checkbox" checked={sameWa} onChange={(e) => setSameWa(e.target.checked)} />
                <span>My WhatsApp number is the same</span>
              </label>
              {!sameWa ? (
                <Field label="WhatsApp number">
                  <input className="input" type="tel" value={d.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+234…" />
                </Field>
              ) : null}
              <Field label="Location" optional hint="City or area. Helps customers judge delivery.">
                <input className="input" value={d.location} onChange={(e) => set("location", e.target.value)} placeholder="Yaba, Lagos" />
              </Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="form-grid">
              <Field label="Logo or profile photo" optional>
                <ImagePicker value={d.logoUrl} onChange={(v) => set("logoUrl", v)} label="Logo" shape="round" />
              </Field>
              <Field label="Storefront cover" optional>
                <ImagePicker value={d.coverUrl} onChange={(v) => set("coverUrl", v)} label="Cover image" />
              </Field>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="form-grid">
              {(
                [
                  ["instagramHandle", "instagram", "Instagram"],
                  ["tiktokHandle", "tiktok", "TikTok"],
                  ["xHandle", "x", "X / Twitter"],
                ] as const
              ).map(([key, ch, label]) => (
                <Field key={key} label={label} optional>
                  <div className="input-prefix">
                    <span>@</span>
                    <input className="input" value={d[key]} onChange={(e) => set(key, e.target.value)} placeholder="yourshop" />
                  </div>
                </Field>
              ))}
              <div className="alert alert-info row" style={{ alignItems: "flex-start" }}>
                <ChannelIcon channel="whatsapp" />
                <span>After setup, connect WhatsApp Business, Instagram, TikTok and X once from your dashboard. ansa uses them for every product.</span>
              </div>
            </div>
          ) : null}

          <div className="spread">
            {step > 0 ? (
              <button className="btn btn-ghost" type="button" onClick={() => setStep((s) => s - 1)} disabled={busy}>
                ← Back
              </button>
            ) : (
              <span />
            )}
            <div className="row">
              {step === 2 || step === 3 ? (
                <button
                  className="btn btn-ghost"
                  type="button"
                  disabled={busy}
                  onClick={() => (step === 3 ? void finish() : setStep((s) => s + 1))}
                >
                  Skip
                </button>
              ) : null}
              {step < STEPS.length - 1 ? (
                <button className="btn btn-sand" type="button" disabled={!canContinue()} onClick={() => setStep((s) => s + 1)}>
                  Continue
                </button>
              ) : (
                <button className="btn btn-sand" type="button" disabled={busy} onClick={() => void finish()}>
                  {busy ? <Spinner label="Opening your shop…" /> : "Open my shop"}
                </button>
              )}
            </div>
          </div>
        </div>

        <aside className="onb-preview">
          <p className="mono muted" style={{ marginBottom: 12 }}>
            LIVE PREVIEW
          </p>
          <div className="phone-mock">
            <div className="phone-mock-screen theme-light" style={{ minHeight: 520 }}>
              <div className="mock-surface" style={{ height: 130 }}>
                {d.coverUrl ? <ItemImage src={d.coverUrl} alt="" className="cover-fill" /> : null}
              </div>
              <div style={{ padding: "0 18px 18px", marginTop: -30, display: "grid", gap: 10 }}>
                <div className="sf-logo" style={{ width: 64, height: 64, borderRadius: 18 }}>
                  <ItemImage src={d.logoUrl} alt={d.name || "Your shop"} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem" }}>{d.name || "Your business"}</h3>
                  <p className="mock-text-muted" style={{ fontSize: "0.78rem" }}>
                    {[d.category, d.location].filter(Boolean).join(" · ") || "Category · Location"}
                  </p>
                </div>
                <p className="mock-text-body" style={{ fontSize: "0.82rem" }}>{d.description || "A short line about what you sell."}</p>
                <div className="btn btn-wa btn-sm" style={{ width: "fit-content" }}>
                  Chat on WhatsApp
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="mock-surface" style={{ aspectRatio: "4/5", borderRadius: 12 }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
