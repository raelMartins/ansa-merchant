let activeMerchantId: string | null = null;

export function setActiveMerchantId(id: string | null): void {
  activeMerchantId = id;
}

/** Authenticated merchant-scoped API path. Requires bootstrap via MerchantProvider. */
export function meMerchant(suffix = ""): string {
  if (!activeMerchantId) {
    throw new Error("Merchant context is not ready");
  }
  return `/v1/me/merchants/${activeMerchantId}${suffix}`;
}
