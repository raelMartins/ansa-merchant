import { useState } from "react";
import { api, errorMessage, patch, post } from "../shared/api"
import { meMerchant } from "../shared/merchantPath";
import type { Channel } from "../shared/types";
import { ConnectionPill, Field, MockBadge, PageLoader, Toggle, useToast } from "../shared/ui";
import { useLoad } from "./context";
import { PageHeader } from "./Layout";

type WaData = {
  connection: { channel: Channel; status: string; provider: string; externalAccount: string | null; simulated: boolean } | null;
  settings: {
    shareCatalog: boolean;
    notifyMerchant: boolean;
    notifyCustomer: boolean;
    contactNumber: string | null;
    templates: Record<string, string>;
  };
};

const TEMPLATE_KEYS = [
  "order_received",
  "payment_confirmed",
  "order_processing",
  "out_for_delivery",
  "delivered",
  "order_cancelled",
] as const;

export function WhatsAppPage() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { data, setData, loading, reload } = useLoad(async () => api<WaData>(meMerchant("/whatsapp")));

  async function connect() {
    setBusy(true);
    try {
      await post(meMerchant("/integrations/whatsapp/simulate"), {});
      toast("WhatsApp connected (prototype simulation)", "info");
      void reload();
    } catch (e) {
      toast(errorMessage(e), "err");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    await post(meMerchant("/integrations/whatsapp/disconnect"));
    toast("Disconnected");
    void reload();
  }

  async function saveSettings(patchBody: Partial<WaData["settings"]>) {
    try {
      const next = await patch<WaData>(meMerchant("/whatsapp"), patchBody);
      setData(next);
      toast("Saved");
    } catch (e) {
      toast(errorMessage(e), "err");
    }
  }

  if (loading && !data) return <PageLoader label="Loading WhatsApp…" />;
  if (!data) return <PageLoader label="Loading WhatsApp…" />;
  const conn = data.connection;
  const s = data.settings;

  return (
    <div className="page-view stack" data-busy={busy || loading ? "true" : undefined} aria-busy={busy || loading}>
      {loading && data ? <div className="route-progress" aria-hidden /> : null}
      <PageHeader eyebrow="major channel" title="WhatsApp" sub="Orders, updates, and catalog sharing for Nigerian social selling." />
      <div className="card">
        <div className="spread">
          <div>
            <h3>WhatsApp Business</h3>
            <p className="muted">Account-level connection — used for every product in your catalog.</p>
          </div>
          {conn ? <ConnectionPill status={conn.status as "connected" | "not_connected"} /> : null}
        </div>
        {conn?.simulated ? <MockBadge label="mock provider · meta later" /> : null}
        <div className="row" style={{ marginTop: 16 }}>
          {conn?.status === "connected" ? (
            <button className="btn btn-outline" type="button" onClick={() => void disconnect()}>Disconnect</button>
          ) : (
            <button className="btn btn-sand" type="button" disabled={busy} onClick={() => void connect()}>
              {busy ? "Connecting…" : "Simulate connection"}
            </button>
          )}
        </div>
        {conn?.externalAccount ? <p className="mono muted" style={{ marginTop: 12 }}>{conn.externalAccount}</p> : null}
      </div>
      <div className="card stack">
        <h3>Notifications</h3>
        <Toggle checked={s.shareCatalog} onChange={(v) => void saveSettings({ shareCatalog: v })} label="Share published catalog to WhatsApp" description="When enabled, new publishes can include WhatsApp (prototype)." />
        <Toggle checked={s.notifyMerchant} onChange={(v) => void saveSettings({ notifyMerchant: v })} label="Merchant order alerts" />
        <Toggle checked={s.notifyCustomer} onChange={(v) => void saveSettings({ notifyCustomer: v })} label="Customer order updates" />
        <Field label="Business contact number">
          <input className="input" value={s.contactNumber ?? ""} onChange={(e) => setData({ ...data, settings: { ...s, contactNumber: e.target.value } })} onBlur={() => void saveSettings({ contactNumber: s.contactNumber })} />
        </Field>
      </div>
      <div className="card stack">
        <h3>Message templates</h3>
        <p className="muted">Prototype templates. Real WhatsApp Business API templates need Meta approval.</p>
        {TEMPLATE_KEYS.map((key) => (
          <Field key={key} label={key.replace(/_/g, " ")}>
            <textarea
              className="input"
              rows={2}
              value={s.templates[key] ?? ""}
              onChange={(e) => setData({ ...data, settings: { ...s, templates: { ...s.templates, [key]: e.target.value } } })}
              onBlur={() => void saveSettings({ templates: s.templates })}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}
