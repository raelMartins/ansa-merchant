import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { errorMessage, mediaUrl, uploadImage } from "./api";
import { AnsaLogo } from "./AnsaLogo";
import { CHANNEL_LABEL, ORDER_STATUS_LABEL, type Channel, type ConnectionStatus, type OrderStatus, type PaymentStatus } from "./types";

export function Wordmark({
  size = 22,
  badge = "merchant",
  inverse = false,
}: {
  size?: number;
  /** Product pill; `false` hides the badge (e.g. buyer storefront). */
  badge?: string | false;
  /** Light logo for dark backgrounds (landing, auth art). */
  inverse?: boolean;
}) {
  const showBadge = badge !== false;
  const label = showBadge ? badge || "merchant" : "";

  return (
    <span className={`wordmark${inverse ? " wordmark--inverse" : ""}`}>
      <AnsaLogo height={size} className="ansa-logo" />
      {showBadge ? <span className="wordmark-badge">{label}</span> : null}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="spinner-wrap">
      <span className="spinner" aria-hidden />
      {label ? <span>{label}</span> : null}
    </span>
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="page-loader page-loader--enter" role="status" aria-live="polite">
      <Spinner label={label} />
    </div>
  );
}

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="page-skeleton page-enter" aria-hidden>
      <div className="page-skeleton-bar" />
      <div className="page-skeleton-grid">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="page-skeleton-card" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-card">
      <p className="state-title">Something didn't load</p>
      <p className="muted">{message}</p>
      {onRetry ? (
        <button className="btn btn-ghost" type="button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="state-card">
      <div className="state-mark" aria-hidden>
        ◌
      </div>
      <p className="state-title">{title}</p>
      {body ? <p className="muted">{body}</p> : null}
      {action}
    </div>
  );
}

type Tone = "ok" | "warn" | "err" | "info" | "neutral" | "accent";

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

const ORDER_TONE: Record<OrderStatus, Tone> = {
  pending: "warn",
  confirmed: "info",
  processing: "accent",
  ready: "accent",
  out_for_delivery: "info",
  delivered: "ok",
  cancelled: "err",
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <Pill tone={ORDER_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Pill>;
}

export function PaymentPill({ status }: { status: PaymentStatus }) {
  const tone: Tone = status === "paid" ? "ok" : status === "failed" ? "err" : "warn";
  return <Pill tone={tone}>{status === "paid" ? "Paid" : status === "failed" ? "Failed" : "Awaiting payment"}</Pill>;
}

export function ConnectionPill({ status }: { status: ConnectionStatus }) {
  const map: Record<ConnectionStatus, [Tone, string]> = {
    not_connected: ["neutral", "Not connected"],
    connecting: ["warn", "Connecting…"],
    connected: ["ok", "Connected"],
    error: ["err", "Connection error"],
  };
  const [tone, label] = map[status];
  return <Pill tone={tone}>{label}</Pill>;
}

export function MockBadge({ label = "prototype · mock" }: { label?: string }) {
  return <span className="mock-badge">{label}</span>;
}

export function ChannelIcon({ channel, size = 18 }: { channel: Channel; size?: number }) {
  const s = size;
  if (channel === "whatsapp") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-label={CHANNEL_LABEL[channel]}>
        <path
          d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M8.8 8.3c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .5-.1.6l-.5.6c-.1.2-.2.3 0 .6.5.9 1.3 1.7 2.3 2.2.3.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.2.4.4 0 .5-.2 1.2-.7 1.5-.5.4-1.4.6-2.8 0a8.6 8.6 0 0 1-4.2-4c-.6-1.2-.5-2.1-.4-2.4Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (channel === "instagram") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-label="Instagram">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
      </svg>
    );
  }
  if (channel === "tiktok") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-label="TikTok">
        <path
          d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.6 2.2 4.4 5 4.6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-label="X">
      <path d="M4 4l16 16M20 4 4 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function ItemImage({
  src,
  alt,
  className,
  label,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  label?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = mediaUrl(src);
  if (!url || failed) {
    const initials = (label ?? alt)
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    return (
      <div className={`img-fallback ${className ?? ""}`} aria-label={alt}>
        <span>{initials || "a"}</span>
      </div>
    );
  }
  return <img className={className} src={url} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export function ImagePicker({
  value,
  onChange,
  label,
  shape = "wide",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  shape?: "wide" | "square" | "round";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      onChange(await uploadImage(file));
    } catch (e) {
      setErr(errorMessage(e, "Upload failed"));
      toast(errorMessage(e, "Upload failed"), "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`picker picker-${shape}`}>
      <button type="button" className="picker-drop" onClick={() => ref.current?.click()} disabled={busy}>
        {value ? (
          <img src={mediaUrl(value)} alt="" />
        ) : (
          <span className="picker-empty">{busy ? <Spinner /> : <>+ {label}</>}</span>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {value ? (
        <button type="button" className="link-btn" onClick={() => onChange(null)}>
          Remove
        </button>
      ) : null}
      {err ? <span className="field-error">{err}</span> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  optional,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {optional ? <span className="field-optional">optional</span> : null}
      </span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="toggle-row">
      <span>
        <span className="toggle-label">{label}</span>
        {description ? <span className="field-hint">{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </label>
  );
}

type ToastTone = "ok" | "err" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };
const ToastCtx = createContext<(message: string, tone?: ToastTone) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, tone: ToastTone = "ok") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export async function shareLink(input: { title: string; text?: string; url: string }): Promise<"shared" | "copied" | "failed"> {
  if (navigator.share) {
    try {
      await navigator.share(input);
      return "shared";
    } catch {
      return "failed";
    }
  }
  return (await copyText(input.url)) ? "copied" : "failed";
}

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
        {title ? (
          <div className="modal-head">
            <h3>{title}</h3>
            <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
