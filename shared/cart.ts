import { useCallback, useEffect, useState } from "react";
import type { CatalogItem } from "./types";

/** PROTOTYPE: cart lives in localStorage, one cart per shop. No server cart yet. */
export type CartLine = {
  productId: string;
  slug: string;
  title: string;
  kind: CatalogItem["kind"];
  priceKobo: number;
  imageUrl: string | null;
  maxQty: number;
  quantity: number;
};

const key = (shopSlug: string) => `ansa.cart.${shopSlug}`;
const EVENT = "ansa-cart-change";

function read(shopSlug: string): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(key(shopSlug)) ?? "[]") as CartLine[];
  } catch {
    return [];
  }
}

function write(shopSlug: string, lines: CartLine[]): void {
  localStorage.setItem(key(shopSlug), JSON.stringify(lines));
  window.dispatchEvent(new Event(EVENT));
}

export function clearCart(shopSlug: string): void {
  write(shopSlug, []);
}

export function useCart(shopSlug: string | undefined) {
  const [lines, setLines] = useState<CartLine[]>(() => (shopSlug ? read(shopSlug) : []));

  useEffect(() => {
    if (!shopSlug) return;
    const sync = () => setLines(read(shopSlug));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [shopSlug]);

  const add = useCallback(
    (item: CatalogItem, quantity = 1) => {
      if (!shopSlug) return;
      const current = read(shopSlug);
      const maxQty = item.kind === "service" ? 10 : item.qtyAvailable;
      const existing = current.find((l) => l.productId === item.id);
      if (existing) {
        existing.quantity = Math.min(maxQty, existing.quantity + quantity);
        existing.maxQty = maxQty;
      } else {
        current.push({
          productId: item.id,
          slug: item.slug,
          title: item.title,
          kind: item.kind,
          priceKobo: item.priceKobo,
          imageUrl: item.imageUrls[0] ?? null,
          maxQty,
          quantity: Math.min(maxQty, quantity),
        });
      }
      write(shopSlug, current);
    },
    [shopSlug],
  );

  const setQty = useCallback(
    (productId: string, quantity: number) => {
      if (!shopSlug) return;
      const next = read(shopSlug)
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.max(0, Math.min(l.maxQty, quantity)) } : l))
        .filter((l) => l.quantity > 0);
      write(shopSlug, next);
    },
    [shopSlug],
  );

  const remove = useCallback(
    (productId: string) => {
      if (!shopSlug) return;
      write(
        shopSlug,
        read(shopSlug).filter((l) => l.productId !== productId),
      );
    },
    [shopSlug],
  );

  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = lines.reduce((n, l) => n + l.quantity * l.priceKobo, 0);

  return { lines, add, setQty, remove, count, subtotal };
}
