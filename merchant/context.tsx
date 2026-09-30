import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, ApiError, clearTokens, errorMessage, getAccessToken } from "../shared/api";
import { setActiveMerchantId } from "../shared/merchantPath";
import type { Shop } from "../shared/types";
import { ErrorState, PageLoader } from "../shared/ui";

type MerchantCtx = {
  shop: Shop;
  setShop: (s: Shop) => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<MerchantCtx | null>(null);

export function useMerchant(): MerchantCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMerchant outside MerchantProvider");
  return v;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  if (!getAccessToken()) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

export function MerchantProvider({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { merchants } = await api<{ merchants: Shop[] }>("/v1/me/merchants");
      const shop = merchants[0] ?? null;
      if (!shop) {
        setActiveMerchantId(null);
        nav("/onboarding", { replace: true });
        return;
      }
      setActiveMerchantId(shop.id);
      setShop(shop);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        nav("/signin", { replace: true });
        return;
      }
      setError(errorMessage(err));
    }
  }, [nav]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="app-root" style={{ padding: 40 }}>
        <ErrorState message={error} onRetry={() => void load()} />
      </div>
    );
  }
  if (!shop) {
    return (
      <div className="app-root">
        <PageLoader label="Opening your shop…" />
      </div>
    );
  }
  return <Ctx.Provider value={{ shop, setShop, refresh: load }}>{children}</Ctx.Provider>;
}

export function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void run();
  }, [run]);

  return {
    data,
    setData,
    error,
    loading,
    /** True when refetching but previous data is still shown */
    busy: loading && data != null,
    reload: run,
  };
}
