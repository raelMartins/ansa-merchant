export type User = {
  id: string;
  ansaId: string;
  email: string | null;
  phone: string | null;
};

export type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  xHandle: string | null;
  onboardingCompleted: boolean;
};

export type ItemKind = "product" | "service";
export type ItemStatus = "draft" | "published" | "archived";

export type CatalogItem = {
  id: string;
  shopId: string;
  title: string;
  description: string | null;
  priceKobo: number;
  compareAtKobo: number | null;
  currency: string;
  status: ItemStatus;
  slug: string;
  imageUrls: string[];
  kind: ItemKind;
  qtyAvailable: number;
  qtySold: number;
  sku: string | null;
  category: string | null;
  durationMinutes: number | null;
  availabilityNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";

export type Order = {
  id: string;
  shopId: string;
  shopName: string | null;
  reference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fulfilment: "pickup" | "delivery";
  deliveryAddress: string | null;
  deliveryInstructions: string | null;
  deliveryFeeKobo: number;
  subtotalKobo: number;
  totalKobo: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentProvider: string;
  createdAt: string;
  updatedAt: string;
  items: { id: string; productId: string | null; title: string; kind: ItemKind; quantity: number; unitPriceKobo: number }[];
};

export type Channel = "whatsapp" | "instagram" | "tiktok" | "x";
export type ConnectionStatus = "not_connected" | "connecting" | "connected" | "error";

export type Integration = {
  channel: Channel;
  status: ConnectionStatus;
  provider: string;
  externalAccount: string | null;
  lastError: string | null;
  connectedAt: string | null;
  simulated: boolean;
};

export type Publication = {
  id: string;
  channel: Channel;
  caption: string;
  status: "simulated" | "failed";
  provider: string;
  detail: string;
  createdAt: string;
  simulated: boolean;
};

export type ActivityEvent = {
  id: string;
  channel: string;
  templateKey: string;
  status: string;
  provider: string;
  body: string;
  recipient: string | null;
  orderId: string | null;
  createdAt: string;
  simulated: boolean;
};

export const DELIVERY_FEE_KOBO = 250_000;

export function nairaFromKobo(kobo: number): number {
  return kobo / 100;
}

export function koboFromNaira(naira: number): number {
  return Math.round(naira * 100);
}

export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: kobo % 100 === 0 ? 0 : 2,
  }).format(nairaFromKobo(kobo));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
};

export function isInStock(item: CatalogItem): boolean {
  return item.kind === "service" || item.qtyAvailable > 0;
}

export function stockLabel(item: CatalogItem): string {
  if (item.kind === "service") return item.availabilityNote ?? "Bookable";
  if (item.qtyAvailable === 0) return "Sold out";
  if (item.qtyAvailable <= 3) return `Only ${item.qtyAvailable} left`;
  return "In stock";
}

export function waLink(number: string | null | undefined, text: string): string {
  const digits = (number ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
