import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileEdit } from "lucide-react";
import DocumentUploadManager from "@/components/upload/DocumentUploadManager";
import { apiGet } from "@/lib/api";
import type { Layanan } from "@/lib/types";

export default function UploadDokumen() {
  const { id } = useParams<{ id: string }>();
  const [layanan, setLayanan] = useState<Layanan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadLayanan = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const data = await apiGet<Layanan>(`/layanan/${id}`);
      setLayanan(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLayanan();
  }, [loadLayanan]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to="/"
            aria-label="Kembali ke dashboard"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
              Upload & Kelengkapan Dokumen
            </h1>
            {layanan && (
              <p className="mt-0.5 text-sm text-slate-600">
                <span className="font-mono text-xs font-semibold text-slate-800">{layanan.no_layanan}</span>
                <span aria-hidden="true"> · </span>
                <span>{layanan.jenis_layanan}</span>
                <span aria-hidden="true"> · </span>
                <span>{layanan.pemohon}</span>
              </p>
            )}
          </div>
        </div>

        {layanan && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/buat-ba/${layanan.id}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <FileEdit className="size-3.5" />
              <span>{layanan.ba ? "Reviu BA" : "Buat BA"}</span>
            </Link>
          </div>
        )}
      </header>

      {loading && <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />}

      {error && (
        <div className="rounded-xl border border-red-200 bg-white p-8 text-sm text-slate-600">
          Data layanan tidak ditemukan.{" "}
          <Link to="/" className="font-semibold text-blue-600 hover:underline">
            Kembali ke daftar layanan
          </Link>
          .
        </div>
      )}

      {layanan && <DocumentUploadManager layanan={layanan} onLayananUpdated={setLayanan} />}
    </div>
  );
}
