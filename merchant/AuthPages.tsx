import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, errorMessage, post, setTokens } from "../shared/api";
import type { Shop } from "../shared/types";
import { Field, Spinner, Wordmark } from "../shared/ui";

type AuthData = { tokens: { accessToken: string; refreshToken: string } };

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="app-root auth">
      <div className="auth-art">
        <Wordmark size={30} tag="shop" inverse />
        <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 16 }}>
          <p className="eyebrow">instant storefront</p>
          <h2>Your shop, live in seconds.</h2>
          <p style={{ color: "#b9b1a7", maxWidth: "40ch" }}>
            Build a catalog, share one link on WhatsApp and Instagram, and take paid orders from customers who trust
            what they see.
          </p>
        </div>
        <p className="mono" style={{ color: "#857d74", position: "relative", zIndex: 1 }}>
          one identity · every service
        </p>
      </div>
      <div className="auth-form">{children}</div>
    </div>
  );
}

async function routeAfterAuth(nav: ReturnType<typeof useNavigate>) {
  try {
    const { merchants } = await api<{ merchants: Shop[] }>("/v1/me/merchants");
    const merchant = merchants[0];
    if (!merchant) {
      nav("/onboarding");
      return;
    }
    nav(merchant.onboardingCompleted ? "/dashboard" : "/onboarding");
  } catch {
    nav("/onboarding");
  }
}

export function SignUpPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await post<AuthData>("/v1/auth/register", { email, password });
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      nav("/onboarding");
    } catch (err) {
      setError(errorMessage(err, "Could not create your account"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame>
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="stack-sm">
          <p className="eyebrow">create your ansa account</p>
          <h1>Open your shop</h1>
          <p className="text-2">One ansa account for your business. Takes about two minutes.</p>
        </div>
        {error ? <div className="alert alert-err">{error}</div> : null}
        <Field label="Email">
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password" hint="At least 8 characters">
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </Field>
        <button className="btn btn-sand btn-lg btn-block" type="submit" disabled={busy}>
          {busy ? <Spinner label="Creating account…" /> : "Create account"}
        </button>
        <p className="muted" style={{ fontSize: "0.88rem" }}>
          Already selling on ansa?{" "}
          <Link to="/signin" style={{ color: "var(--sand)" }}>
            Sign in
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}

export function SignInPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(em: string, pw: string) {
    setBusy(true);
    setError(null);
    try {
      const data = await post<AuthData>("/v1/auth/login", { email: em, password: pw });
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      await routeAfterAuth(nav);
    } catch (err) {
      setError(errorMessage(err, "Could not sign in"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame>
      <form
        className="auth-card"
        onSubmit={(e) => {
          e.preventDefault();
          void signIn(email, password);
        }}
      >
        <div className="stack-sm">
          <p className="eyebrow">welcome back</p>
          <h1>Sign in to your shop</h1>
        </div>
        {error ? <div className="alert alert-err">{error}</div> : null}
        <Field label="Email">
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <button className="btn btn-sand btn-lg btn-block" type="submit" disabled={busy}>
          {busy ? <Spinner label="Signing in…" /> : "Sign in"}
        </button>
        <div className="demo-hint">
          <strong>Prototype demo accounts</strong> (after <span className="mono">pnpm api:seed</span>):
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn btn-outline btn-sm" type="button" disabled={busy} onClick={() => void signIn("zola@demo.ansa", "password123")}>
              Zola Atelier
            </button>
            <button className="btn btn-outline btn-sm" type="button" disabled={busy} onClick={() => void signIn("mama@demo.ansa", "password123")}>
              Mama Put Pantry
            </button>
          </div>
        </div>
        <p className="muted" style={{ fontSize: "0.88rem" }}>
          New to ansa?{" "}
          <Link to="/signup" style={{ color: "var(--sand)" }}>
            Create an account
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}
