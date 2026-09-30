import { useEffect, useState } from "react";
import { api, errorMessage, patch, post } from "../shared/api"
import { meMerchant } from "../shared/merchantPath";
import { formatNaira, CHANNEL_LABEL, type Channel, type Integration, type Shop } from "../shared/types";
import { ChannelIcon, ConnectionPill, Field, ImagePicker, MockBadge, useToast } from "../shared/ui";
import { useMerchant } from "./context";
import { PageHeader } from "./Layout";

export function SettingsPage() {
  const { shop, setShop, refresh } = useMerchant();
  const toast = useToast();
  const [form, setForm] = useState(shop);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(shop);
    api<{ integrations: Integration[] }>(meMerchant("/integrations")).then((r) => setIntegrations(r.integrations));
  }, [shop]);

  async function save() {
    setBusy(true);
    try {
      const { merchant: updated } = await patch<{ merchant: Shop }>(meMerchant(), {
        name: form.name,
        description: form.description || null,
        category: form.category,
        phone: form.phone,
        whatsapp: form.whatsapp,
        location: form.location,
        logoUrl: form.logoUrl,
        coverUrl: form.coverUrl,
        instagramHandle: form.instagramHandle?.replace(/^@/, "") || null,
        tiktokHandle: form.tiktokHandle?.replace(/^@/, "") || null,
        xHandle: form.xHandle?.replace(/^@/, "") || null,
      });
      setShop(updated);
      toast("Business profile saved");
    } catch (e) {
      toast(errorMessage(e), "err");
    } finally {
      setBusy(false);
    }
  }

  async function connect(ch: Channel) {
    try {
      const { integration } = await post<{ integration: Integration }>(meMerchant(`/integrations/${ch}/simulate`), {});
      setIntegrations((prev) => prev.map((i) => (i.channel === ch ? integration : i)));
      toast(`${CHANNEL_LABEL[ch]} connected (prototype)`, "info");
    } catch (e) {
      toast(errorMessage(e), "err");
    }
  }

  async function disconnect(ch: Channel) {
    const { integration } = await post<{ integration: Integration }>(meMerchant(`/integrations/${ch}/disconnect`));
    setIntegrations((prev) => prev.map((i) => (i.channel === ch ? integration : i)));
    toast("Disconnected");
  }

  const set = <K extends keyof Shop>(k: K, v: Shop[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="stack">
      <PageHeader eyebrow="account" title="Business settings" actions={<button className="btn btn-sand" type="button" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save changes"}</button>} />
      <div className="card form-grid">
        <Field label="Business name"><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Description"><textarea className="input" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
        <div className="form-row">
          <Field label="Category"><input className="input" value={form.category ?? ""} onChange={(e) => set("category", e.target.value)} /></Field>
          <Field label="Location"><input className="input" value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} /></Field>
        </div>
        <div className="form-row">
          <Field label="Phone"><input className="input" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="WhatsApp"><input className="input" value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
        </div>
        <Field label="Logo"><ImagePicker value={form.logoUrl} onChange={(v) => set("logoUrl", v)} label="Logo" shape="round" /></Field>
        <Field label="Cover"><ImagePicker value={form.coverUrl} onChange={(v) => set("coverUrl", v)} label="Cover" /></Field>
      </div>
      <div className="card">
        <h3>Connected accounts</h3>
        <p className="muted" style={{ marginBottom: 16 }}>Connect once — we use these channels for your whole catalog.</p>
        <div className="channel-grid">
          {integrations.map((i) => (
            <div key={i.channel} className="channel-card">
              <div className="channel-head">
                <span className={`channel-icon ${i.channel}`}><ChannelIcon channel={i.channel} /></span>
                <strong>{CHANNEL_LABEL[i.channel]}</strong>
              </div>
              <ConnectionPill status={i.status} />
              {i.simulated ? <MockBadge /> : null}
              {i.externalAccount ? <p className="muted">{i.externalAccount}</p> : null}
              <div className="row">
                {i.status === "connected" ? (
                  <button className="btn btn-outline btn-sm" type="button" onClick={() => void disconnect(i.channel)}>Disconnect</button>
                ) : (
                  <button className="btn btn-sand btn-sm" type="button" onClick={() => void connect(i.channel)}>Connect</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="btn btn-ghost" type="button" onClick={() => void refresh()}>Reload profile</button>
    </div>
  );
}

type CustomerRow = { name: string; phone: string; orders: number; spentKobo: number; lastOrderAt: string };

export function CustomersPage() {
  const [data, setData] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<{ customers: CustomerRow[] }>(meMerchant("/customers"))
      .then((r) => setData(r.customers))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <PageHeader eyebrow="buyers" title="Customers" />
      <div className="card card-flush">
        <table className="table">
          <thead><tr><th>Name</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Last order</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Loading…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>No customers yet</td></tr>
            ) : (
              data.map((c) => (
                <tr key={c.phone}>
                  <td>{c.name}</td>
                  <td className="mono">{c.phone}</td>
                  <td>{c.orders}</td>
                  <td className="price">{formatNaira(c.spentKobo)}</td>
                  <td>{new Date(c.lastOrderAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StorefrontSettingsPage() {
  const { shop } = useMerchant();
  const url = `${window.location.origin}/shop/${shop.slug}`;
  const toast = useToast();
  return (
    <div className="stack">
      <PageHeader eyebrow="public link" title="Storefront" />
      <div className="card stack">
        <p className="text-2">Send this link on WhatsApp, Instagram, or anywhere you sell. Customers browse, cart, and checkout without an account.</p>
        <div className="linkbox">
          <span>{url}</span>
          <button className="btn btn-sand btn-sm" type="button" onClick={() => void navigator.clipboard.writeText(url).then(() => toast("Copied"))}>Copy</button>
        </div>
        <a className="btn btn-outline" href={url} target="_blank" rel="noreferrer">Open storefront ↗</a>
      </div>
    </div>
  );
}
