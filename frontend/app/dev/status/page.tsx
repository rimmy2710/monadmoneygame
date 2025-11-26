"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import SectionTitle from "../../../components/ui/SectionTitle";
import Spinner from "../../../components/ui/Spinner";

type BackendStatus = "idle" | "ok" | "error";

type HealthResponse = {
  status: string;
  [key: string]: unknown;
};

const getDisplayValue = (value?: string) =>
  value && value.trim().length > 0 ? value : "(not set)";

export default function DevStatusPage() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("idle");
  const [backendMessage, setBackendMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const backendUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000",
    []
  );
  const healthUrl = `${backendUrl}/health`;

  const chainId = getDisplayValue(process.env.NEXT_PUBLIC_CHAIN_ID);
  const rpcUrl = getDisplayValue(process.env.NEXT_PUBLIC_RPC_URL);
  const monadRpcUrl = getDisplayValue(process.env.NEXT_PUBLIC_MONAD_RPC_URL);

  const checkBackend = useCallback(async () => {
    setLoading(true);
    setBackendMessage(null);
    setBackendStatus("idle");

    try {
      const response = await fetch(healthUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as HealthResponse;
      setBackendStatus("ok");
      setBackendMessage(typeof data.status === "string" ? data.status : "ok");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reach backend";
      setBackendStatus("error");
      setBackendMessage(message);
    } finally {
      setLoading(false);
    }
  }, [healthUrl]);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Dev Status"
        description="Check backend / health and chain configuration."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-white">Backend status</h3>
              <p className="text-sm text-slate-300">Pings {healthUrl}.</p>
            </div>
            <Badge
              variant={
                backendStatus === "ok"
                  ? "success"
                  : backendStatus === "error"
                  ? "danger"
                  : "info"
              }
            >
              {backendStatus === "ok"
                ? "Online"
                : backendStatus === "error"
                ? "Error"
                : "Checking"}
            </Badge>
          </div>

          <div className="space-y-3 text-sm text-slate-200">
            {loading && (
              <div className="flex items-center gap-2 text-slate-200">
                <Spinner />
                <span>Checking backend...</span>
              </div>
            )}

            {!loading && backendStatus === "ok" && (
              <div className="space-y-1 text-emerald-100">
                <p className="text-base font-semibold">Backend: OK</p>
                <p className="text-sm text-emerald-100/90">
                  Message: {backendMessage ?? "ok"}
                </p>
              </div>
            )}

            {!loading && backendStatus === "error" && (
              <div className="space-y-1 text-rose-100">
                <p className="text-base font-semibold">Backend: ERROR</p>
                <p className="text-sm text-rose-100/90">
                  {backendMessage ?? "Unable to reach /health"}
                </p>
              </div>
            )}

            {!loading && backendStatus === "idle" && (
              <p className="text-slate-300">Not checked yet.</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={checkBackend}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading && <Spinner />}
              {loading ? "Checking..." : "Recheck"}
            </Button>
            <span className="text-xs text-slate-400">Uses NEXT_PUBLIC_BACKEND_URL</span>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-white">Chain & RPC config</h3>
            <p className="text-sm text-slate-300">
              Values read from frontend environment variables.
            </p>
          </div>

          <div className="space-y-2 text-sm text-slate-200">
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3">
              <span className="text-slate-400">Chain ID</span>
              <span className="font-semibold text-white">{chainId}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3">
              <span className="text-slate-400">RPC URL</span>
              <span className="font-semibold text-white">{rpcUrl}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3">
              <span className="text-slate-400">Monad RPC URL</span>
              <span className="font-semibold text-white">{monadRpcUrl}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Contract address is configured in backend .env (CONTRACT_ADDRESS).
          </p>
        </Card>
      </div>
    </section>
  );
}
