import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errorMessage, patch, post, uploadImage } from "../shared/api"
import { meMerchant } from "../shared/merchantPath";
import { formatNaira, koboFromNaira, nairaFromKobo, type CatalogItem, type ItemKind } from "../shared/types";
import { Field, ItemImage, PageLoader, Spinner, useToast } from "../shared/ui";
import { useMerchant } from "./context";
import { PageHeader } from "./Layout";

export function ProductEditorPage() {
  const { productId } = useParams();
  const isNew = !productId;
  const nav = useNavigate();
  const toast = useToast();
  const { shop } = useMerchant();
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<ItemKind>("product");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [naira, setNaira] = useState("0");
  const [compareNaira, setCompareNaira] = useState("");
  const [qty, setQty] = useState("20");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    api<{ product: CatalogItem }>(meMerchant(`/products/${productId}`)
      .then(({ product }) => {
        setKind(product.kind);
        setTitle(product.title);
        setDescription(product.description ?? "");
        setNaira(String(nairaFromKobo(product.priceKobo)));
        setCompareNaira(product.compareAtKobo ? String(nairaFromKobo(product.compareAtKobo)) : "");
        setQty(String(product.qtyAvailable));
        setSku(product.sku ?? "");
        setCategory(product.category ?? "");
        setDuration(product.durationMinutes ? String(product.durationMinutes) : "");
        setAvailabilityNote(product.availabilityNote ?? "");
        setStatus(product.status === "archived" ? "draft" : product.status);
        setImages(product.imageUrls);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files).slice(0, 8 - images.length)) {
        const url = await uploadImage(f);
        setImages((prev) => [...prev, url]);
      }
    } catch (e) {
      toast(errorMessage(e), "err");
    } finally {
      setUploading(false);
    }
  }

  function body(publish: boolean) {
    const priceKobo = koboFromNaira(Number(naira));
    const compareAtKobo = compareNaira.trim() ? koboFromNaira(Number(compareNaira)) : null;
    return {
      title: title.trim(),
      description: description.trim() || undefined,
      priceKobo,
      compareAtKobo,
      status: publish ? "published" : status,
      kind,
      imageUrls: images,
      qtyAvailable: kind === "product" ? Number(qty) : undefined,
      sku: sku.trim() || null,
      category: category.trim() || undefined,
      durationMinutes: kind === "service" && duration ? Number(duration) : null,
      availabilityNote: availabilityNote.trim() || null,
    };
  }

  async function save(publish: boolean) {
    setBusy(true);
    try {
      if (isNew) {
        const { product } = await post<{ product: CatalogItem }>(meMerchant("/products"), {
          ...body(publish),
          status: publish ? "published" : "draft",
        });
        toast(publish ? "Published" : "Draft saved");
        nav(publish ? `/dashboard/products/${product.id}/share` : "/dashboard/products");
      } else {
        await patch(meMerchant(`/products/${productId}`, { ...body(publish), status: publish ? "published" : status });
        toast(publish ? "Published" : "Saved");
        nav("/dashboard/products");
      }
    } catch (e) {
      toast(errorMessage(e), "err");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        eyebrow={isNew ? "catalog" : "edit item"}
        title={isNew ? "Add product or service" : title || "Edit item"}
        actions={
          <Link className="btn btn-ghost" to="/dashboard/products">
            ← Back
          </Link>
        }
      />
      <form
        className="editor"
        onSubmit={(e) => {
          e.preventDefault();
          void save(false);
        }}
      >
        <div className="stack">
          <div className="kind-switch">
            {(["product", "service"] as const).map((k) => (
              <button key={k} type="button" className={`kind-option ${kind === k ? "active" : ""}`} onClick={() => setKind(k)}>
                <strong>{k === "product" ? "Product" : "Service"}</strong>
                <span>{k === "product" ? "Physical item with inventory" : "Bookable offering with duration"}</span>
              </button>
            ))}
          </div>
          <Field label="Name">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
          </Field>
          <Field label="Description" optional>
            <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} />
          </Field>
          <div className="form-row">
            <Field label="Price (₦)">
              <input className="input" type="number" min={0} step="0.01" value={naira} onChange={(e) => setNaira(e.target.value)} required />
            </Field>
            <Field label="Compare-at price" optional>
              <input className="input" type="number" min={0} step="0.01" value={compareNaira} onChange={(e) => setCompareNaira(e.target.value)} />
            </Field>
          </div>
          {kind === "product" ? (
            <div className="form-row">
              <Field label="Quantity in stock">
                <input className="input" type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} />
              </Field>
              <Field label="SKU" optional>
                <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} maxLength={64} />
              </Field>
            </div>
          ) : (
            <div className="form-row">
              <Field label="Duration (minutes)" optional>
                <input className="input" type="number" min={5} max={1440} value={duration} onChange={(e) => setDuration(e.target.value)} />
              </Field>
              <Field label="Availability note" optional>
                <input className="input" value={availabilityNote} onChange={(e) => setAvailabilityNote(e.target.value)} placeholder="Tue–Sat, 10am–5pm" />
              </Field>
            </div>
          )}
          <Field label="Category" optional>
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Dresses, Catering…" />
          </Field>
          <Field label="Photos" optional hint="Optional. Upload or skip — your listing still works without images.">
            <div className="media-row">
              {images.map((src) => (
                <div key={src} className="media-tile">
                  <ItemImage src={src} alt="" />
                  <button type="button" onClick={() => setImages((p) => p.filter((x) => x !== src))}>×</button>
                </div>
              ))}
              {images.length < 8 ? (
                <label className="media-add">
                  {uploading ? <Spinner /> : "+ Photo"}
                  <input type="file" accept="image/*" hidden multiple onChange={(e) => void onPick(e.target.files)} />
                </label>
              ) : null}
            </div>
          </Field>
        </div>
        <div className="sticky-side">
          <div className="card preview-phone">
            <div className="pp-media">
              <ItemImage src={images[0]} alt={title} label={title} />
            </div>
            <div className="pp-body">
              <span className="mono muted">{shop.name}</span>
              <strong>{title || "Item name"}</strong>
              <span className="price">{formatNaira(koboFromNaira(Number(naira) || 0))}</span>
            </div>
          </div>
          <div className="card save-bar" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")}>
              <option value="draft">Draft — only you see this</option>
              <option value="published">Published — on your storefront</option>
            </select>
            <button className="btn btn-outline" type="submit" disabled={busy}>
              {busy ? <Spinner label="Saving…" /> : "Save draft"}
            </button>
            <button className="btn btn-sand" type="button" disabled={busy} onClick={() => void save(true)}>
              Publish
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
