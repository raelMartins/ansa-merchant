import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, errorMessage, patch } from "../shared/api"
import { meMerchant } from "../shared/merchantPath";
import { formatDateTime, formatNaira, ORDER_STATUSES, ORDER_STATUS_LABEL, type Order, type OrderStatus } from "../shared/types";
import { ErrorState, MockBadge, OrderStatusPill, PageLoader, PaymentPill, useToast } from "../shared/ui";
import { useLoad } from "./context";
import { PageHeader } from "./Layout";

export function OrdersPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("order");
  const { data, setData, error, loading, reload } = useLoad(async () => (await api<{ orders: Order[] }>(meMerchant("/orders"))).orders);
  const orders = data ?? [];
  const selected = useMemo(() => orders.find((o) => o.id === selectedId) ?? orders[0], [orders, selectedId]);

  async function setStatus(orderId: string, status: OrderStatus) {
    try {
      const res = await patch<{ order: Order; notification: { detail: string; simulated: boolean } | null }>(
        meMerchant(`/orders/${orderId}`,
        { status },
      );
      setData((prev) => (prev ?? []).map((o) => (o.id === orderId ? res.order : o)));
      if (res.notification?.simulated) toast(`WhatsApp update simulated · ${res.notification.detail}`, "info");
      else toast(`Order marked ${ORDER_STATUS_LABEL[status]}`);
    } catch (e) {
      toast(errorMessage(e), "err");
    }
  }

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={() => void reload()} />;

  return (
    <div>
      <PageHeader eyebrow={`${orders.length} orders`} title="Orders" />
      <div className="orders-layout">
        <div className="card card-flush">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o.id}
                      className={selected?.id === o.id ? "selected" : ""}
                      onClick={() => setParams({ order: o.id })}
                    >
                      <td className="mono">{o.reference}</td>
                      <td>
                        <div>{o.customerName}</div>
                        <div className="cell-sub">{formatDateTime(o.createdAt)}</div>
                      </td>
                      <td className="price">{formatNaira(o.totalKobo)}</td>
                      <td><PaymentPill status={o.paymentStatus} /></td>
                      <td><OrderStatusPill status={o.orderStatus} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {selected ? (
          <div className="card stack">
            <div className="spread">
              <h3>{selected.reference}</h3>
              <MockBadge label="notify · mock" />
            </div>
            <dl className="kv">
              <dt>Customer</dt>
              <dd>{selected.customerName}<br /><span className="muted">{selected.customerPhone}</span></dd>
              <dt>Fulfilment</dt>
              <dd>{selected.fulfilment === "delivery" ? `Delivery · ${selected.deliveryAddress}` : "Pickup"}</dd>
              <dt>Items</dt>
              <dd>{selected.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}</dd>
              <dt>Total</dt>
              <dd className="price">{formatNaira(selected.totalKobo)}</dd>
            </dl>
            <hr className="divider" />
            <p className="eyebrow">Update status</p>
            <div className="status-steps">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`status-step ${selected.orderStatus === s ? "current" : ""} ${ORDER_STATUSES.indexOf(s) < ORDER_STATUSES.indexOf(selected.orderStatus) ? "done" : ""}`}
                  disabled={selected.paymentStatus !== "paid" && s !== "cancelled" && s !== "pending"}
                  onClick={() => void setStatus(selected.id, s)}
                >
                  <span className="dot" />
                  {ORDER_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
