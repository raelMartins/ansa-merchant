import type { ReactNode } from "react";
import { ErrorState, PageLoader } from "./ui";

type AsyncViewProps = {
  loading: boolean;
  busy?: boolean;
  data: unknown;
  error: string | null;
  onRetry?: () => void;
  label?: string;
  skeleton?: ReactNode;
  children: ReactNode;
};

/**
 * Initial load: centered loader. Refetch: keep content + top progress. Errors when empty.
 */
export function AsyncView({ loading, busy, data, error, onRetry, label, skeleton, children }: AsyncViewProps) {
  const isBusy = busy ?? (loading && data != null);

  if (error && !data) {
    return (
      <div className="page-enter">
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (loading && !data) {
    return skeleton ?? <PageLoader label={label} />;
  }

  if (!data) {
    return skeleton ?? <PageLoader label={label} />;
  }

  return (
    <div className="page-view" data-busy={isBusy ? "true" : undefined} aria-busy={isBusy}>
      {isBusy ? <div className="route-progress" aria-hidden /> : null}
      {children}
    </div>
  );
}
